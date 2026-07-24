# Login Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Throttle `POST /sign_in` with two independent limits — 10 attempts per IP and 5 attempts per email address, both within a 3-minute window — so brute force and credential stuffing are stopped without breaking the Inertia sign-in flow.

**Architecture:** Two named `rate_limit` declarations on `SessionsController#create`, using Rails 8.1's built-in `ActionController::RateLimiting`. Both share one private handler that redirects back to the sign-in page with a flash alert instead of the framework default 429. Counters live in the Action Controller cache store, which resolves to Solid Cache in production and needs a one-line override in the test environment (the global test cache store is `:null_store`, under which the limit can never fire).

**Tech Stack:** Rails 8.1.3, Ruby 4.0.1, RSpec (`bin/rspec`), Solid Cache, Inertia Rails.

**Design spec:** `docs/superpowers/specs/2026-07-24-login-rate-limiting-design.md`

## Global Constraints

- No new gems. `rate_limit` ships with Rails 8.1 — verified against
  <https://api.rubyonrails.org/v8.1.3/classes/ActionController/RateLimiting/ClassMethods.html>.
- Every Ruby file starts with `# frozen_string_literal: true` followed by a blank line — match the
  existing files in this repo.
- Style is `rubocop-rails-omakase`: double-quoted strings, two-space indent, spaces inside array
  literal brackets (`%i[ new create ]` style is already used in `sessions_controller.rb`).
- User-facing copy is hardcoded English, no i18n — this matches every other flash message in the
  codebase (e.g. `"That email or password is incorrect"`). The exact alert string is
  `"Too many sign in attempts. Please try again in a few minutes"`.
- Thresholds are exactly: **10 per IP / 3 minutes** (name `"sign-in-ip"`) and
  **5 per email / 3 minutes** (name `"sign-in-email"`).
- `name:` is mandatory on both limits. Rails builds the cache key as
  `["rate-limit", scope, name, by].compact.join(":")`; without distinct names the two limits would
  collide on one counter.
- Do **not** pass `store:` in the controller. Each environment must keep its own backend
  (Solid Cache in production — a per-process memory store would give an attacker N times the
  allowance across N Puma workers).

## Behavior reference (read before writing tests)

From the installed source, `actionpack-8.1.3/lib/action_controller/metal/rate_limiting.rb`:

```ruby
count = store.increment(cache_key, 1, expires_in: within)
if count && count > to
  # ... invoke `with:`
end
```

Consequences the tests depend on:

- The check is `count > to`, so `to: 10` **allows 10 requests and blocks the 11th**. `to: 5` allows
  5 and blocks the 6th.
- `store.increment` on a `:null_store` returns `nil`, so the limit never fires — this is why the
  test environment needs a real Action Controller cache store.
- `MemoryStore#increment` preserves the original `expires_at` across increments (fixed window, not
  sliding), and `ActiveSupport::Cache::Entry#expired?` compares against `Time.now.to_f` — so
  `travel` from `ActiveSupport::Testing::TimeHelpers` correctly expires the window in tests.
- The counter increments on **every** POST to `/sign_in`, including successful sign-ins. There is no
  documented option to count failures only. This is accepted, not a bug.

## File Structure

| File | Responsibility |
| --- | --- |
| `app/controllers/sessions_controller.rb` (modify) | The two `rate_limit` declarations and the shared `rate_limit_exceeded` handler |
| `config/environments/test.rb` (modify) | Give Action Controller a real cache store in test so limits can fire |
| `spec/support/cache_helpers.rb` (create) | Clear the controller cache store before each example so counters never leak between tests |
| `spec/requests/sessions_spec.rb` (modify) | Request specs for the IP limit, the email limit, and window expiry |

The spec's fourth test case — "a normal sign-in below the threshold still works" — is already
covered by the existing `context "with valid credentials"` example in
`spec/requests/sessions_spec.rb`. Do not duplicate it; just keep it green.

---

### Task 1: Per-IP rate limit

Includes the test-environment cache store setup and the between-examples cleanup, because the first
test cannot fail-for-the-right-reason without them.

**Files:**
- Modify: `config/environments/test.rb:23`
- Create: `spec/support/cache_helpers.rb`
- Modify: `app/controllers/sessions_controller.rb`
- Test: `spec/requests/sessions_spec.rb`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SessionsController::RATE_LIMIT_ALERT` (a `String` constant) and the private instance
  method `rate_limit_exceeded` (no arguments, performs a redirect). Task 2 reuses both by name.

- [ ] **Step 1: Give Action Controller a real cache store in test**

In `config/environments/test.rb`, find this line:

```ruby
  config.cache_store = :null_store
```

Replace it with:

```ruby
  config.cache_store = :null_store

  # Rate limiting counts requests in the Action Controller cache store. Under :null_store,
  # `increment` returns nil and limits can never fire, so give this layer a real store while
  # leaving general caching disabled.
  config.action_controller.cache_store = :memory_store
```

- [ ] **Step 2: Clear the store between examples**

Create `spec/support/cache_helpers.rb`:

```ruby
# frozen_string_literal: true

RSpec.configure do |config|
  # Rate limit counters live in the Action Controller cache store, which is not reset by
  # transactional fixtures. Without this the suite becomes order-dependent.
  config.before { ActionController::Base.cache_store.clear }
end
```

`spec/rails_helper.rb:12` already globs `spec/support/**/*.rb`, so no registration is needed.

- [ ] **Step 3: Write the failing test**

In `spec/requests/sessions_spec.rb`, add this block inside `describe "POST /sign_in" do`, after the
existing `context "with invalid credentials"` block:

```ruby
    context "when rate limited by IP" do
      it "blocks the 11th attempt from the same IP" do
        10.times do |i|
          post sign_in_path, params: { email: "attacker#{i}@example.com", password: "wrongpassword" }
          expect(flash[:alert]).to eq("That email or password is incorrect")
        end

        post sign_in_path, params: { email: "attacker10@example.com", password: "wrongpassword" }

        expect(response).to redirect_to(sign_in_path)
        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")
      end
    end
```

Each of the 11 requests uses a different email, so the per-email limit added in Task 2 can never be
the cause of the block — only the IP limit.

- [ ] **Step 4: Run the test and confirm it fails**

Run: `bin/rspec spec/requests/sessions_spec.rb -e "blocks the 11th attempt from the same IP"`

Expected: FAIL. The 11th request still returns the credentials alert, so the final expectation
reports `expected: "Too many sign in attempts. Please try again in a few minutes" got: "That email or password is incorrect"`.

- [ ] **Step 5: Add the IP limit and the handler**

In `app/controllers/sessions_controller.rb`, replace the class body header — currently:

```ruby
class SessionsController < InertiaController
  skip_before_action :authenticate, only: %i[new create]
  before_action :require_no_authentication, only: %i[new create]
  before_action :set_session, only: :destroy
```

with:

```ruby
class SessionsController < InertiaController
  RATE_LIMIT_ALERT = "Too many sign in attempts. Please try again in a few minutes"

  skip_before_action :authenticate, only: %i[new create]
  before_action :require_no_authentication, only: %i[new create]
  before_action :set_session, only: :destroy

  rate_limit to: 10, within: 3.minutes, name: "sign-in-ip",
             with: :rate_limit_exceeded, only: :create
```

Then add the handler to the existing `private` section, after `set_session`:

```ruby
  def rate_limit_exceeded
    redirect_to sign_in_path, alert: RATE_LIMIT_ALERT
  end
```

`by:` is omitted deliberately — it defaults to `-> { request.remote_ip }`, which is what this limit
needs.

- [ ] **Step 6: Run the test and confirm it passes**

Run: `bin/rspec spec/requests/sessions_spec.rb -e "blocks the 11th attempt from the same IP"`

Expected: PASS — `1 example, 0 failures`.

- [ ] **Step 7: Run the whole sessions suite for regressions**

Run: `bin/rspec spec/requests/sessions_spec.rb`

Expected: PASS — all examples green. The pre-existing examples issue at most one POST to
`/sign_in` each, well under the limit.

- [ ] **Step 8: Commit**

```bash
git add app/controllers/sessions_controller.rb config/environments/test.rb spec/support/cache_helpers.rb spec/requests/sessions_spec.rb
git commit -m "feat: rate limit sign in attempts per IP"
```

---

### Task 2: Per-email rate limit

**Files:**
- Modify: `app/controllers/sessions_controller.rb`
- Test: `spec/requests/sessions_spec.rb`

**Interfaces:**
- Consumes: `SessionsController::RATE_LIMIT_ALERT` and the private `rate_limit_exceeded` method from
  Task 1 — both reused verbatim, nothing new is defined.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing test**

In `spec/requests/sessions_spec.rb`, add this block immediately after the
`context "when rate limited by IP"` block from Task 1:

```ruby
    context "when rate limited by email" do
      it "blocks the 6th attempt against the same email" do
        5.times do
          post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
          expect(flash[:alert]).to eq("That email or password is incorrect")
        end

        post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }

        expect(response).to redirect_to(sign_in_path)
        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")
      end

      it "ignores casing and surrounding whitespace in the email" do
        5.times do
          post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
        end

        post sign_in_path, params: { email: " #{users(:one).email.upcase} ", password: "wrongpassword" }

        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")
      end
    end
```

Six requests total per example — under the IP limit of 10, so only the email limit can be the cause.
The second example is what forces the key to be normalized: without it, varying the casing would
open a fresh bucket and multiply the allowance.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `bin/rspec spec/requests/sessions_spec.rb -e "when rate limited by email"`

Expected: FAIL — `2 examples, 2 failures`, both reporting
`expected: "Too many sign in attempts. Please try again in a few minutes" got: "That email or password is incorrect"`.

- [ ] **Step 3: Add the email limit**

In `app/controllers/sessions_controller.rb`, add a second declaration directly below the existing
`rate_limit` from Task 1, so the block reads:

```ruby
  rate_limit to: 10, within: 3.minutes, name: "sign-in-ip",
             with: :rate_limit_exceeded, only: :create

  rate_limit to: 5, within: 3.minutes, name: "sign-in-email",
             by: -> { params[:email].to_s.downcase.strip },
             with: :rate_limit_exceeded, only: :create
```

`to_s` guards against a missing `email` param (all such requests then share the `""` bucket, which
is the desired behavior for bots posting empty forms); `downcase.strip` is what makes the second
test pass.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `bin/rspec spec/requests/sessions_spec.rb -e "when rate limited by email"`

Expected: PASS — `2 examples, 0 failures`.

- [ ] **Step 5: Run the whole sessions suite for regressions**

Run: `bin/rspec spec/requests/sessions_spec.rb`

Expected: PASS — all examples green, including the Task 1 IP example (its 11 requests use unique
emails, so each sits at 1 in its own email bucket).

- [ ] **Step 6: Commit**

```bash
git add app/controllers/sessions_controller.rb spec/requests/sessions_spec.rb
git commit -m "feat: rate limit sign in attempts per email address"
```

---

### Task 3: Window expiry and full verification

Proves the limit actually releases after `within:` elapses — without this, a passing suite is also
consistent with a permanent lockout.

**Files:**
- Test: `spec/requests/sessions_spec.rb`

**Interfaces:**
- Consumes: the two `rate_limit` declarations from Tasks 1 and 2. Nothing new is defined.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

In `spec/requests/sessions_spec.rb`, add this block immediately after the
`context "when rate limited by email"` block from Task 2:

```ruby
    context "when the rate limit window has elapsed" do
      it "allows sign in again after 3 minutes" do
        6.times do
          post sign_in_path, params: { email: users(:one).email, password: "wrongpassword" }
        end
        expect(flash[:alert]).to eq("Too many sign in attempts. Please try again in a few minutes")

        travel 4.minutes do
          post sign_in_path, params: { email: users(:one).email, password: "Secret1*3*5*" }

          expect(response).to redirect_to(dashboard_path)
          expect(cookies[:session_token]).to be_present
        end
      end
    end
```

`ActiveSupport::Testing::TimeHelpers` is already included at `spec/rails_helper.rb:30`, so `travel`
is available with no extra setup. `"Secret1*3*5*"` is the password for both fixture users — see the
comment at the top of `spec/fixtures/users.yml`.

- [ ] **Step 2: Run the test and confirm it passes for the right reason**

Run: `bin/rspec spec/requests/sessions_spec.rb -e "allows sign in again after 3 minutes"`

Expected: PASS.

This is a characterization test — it passes on the first run because `expires_in:` is already
wired. To confirm it is actually exercising expiry rather than passing vacuously, temporarily change
`travel 4.minutes do` to `travel 1.minute do` and re-run: it must FAIL with
`expected response to be a redirect to <.../dashboard> but was a redirect to <.../sign_in>`.
Then change it back to `4.minutes` and re-run to confirm PASS.

- [ ] **Step 3: Run the full test suite**

Run: `bin/rspec`

Expected: PASS — `0 failures`. Report the actual example/failure counts; do not claim green without
reading the output.

- [ ] **Step 4: Run RuboCop**

Run: `bin/rubocop`

Expected: `no offenses detected`. If the two `rate_limit` continuation lines are flagged for
alignment, fix them as RuboCop directs rather than adding an inline disable.

- [ ] **Step 5: Run Brakeman**

Run: `bin/brakeman --no-pager`

Expected: `No warnings found`. This change touches an authentication path, so the security scan is
part of the definition of done.

- [ ] **Step 6: Commit**

```bash
git add spec/requests/sessions_spec.rb
git commit -m "test: verify sign in rate limit window expires"
```

---

## Definition of done

- `bin/rspec` green, output read and reported.
- `bin/rubocop` reports no offenses.
- `bin/brakeman --no-pager` reports no warnings.
- `app/controllers/sessions_controller.rb` contains exactly two `rate_limit` declarations, both
  named, both `only: :create`, both routed through `rate_limit_exceeded`.
- No `store:` argument anywhere in the controller.
- No changes under `app/frontend/` — the flash alert reuses the surface the failed-credentials path
  already renders.
