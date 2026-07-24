# Login rate limiting — design

Date: 2026-07-24
Status: approved

## Problem

`POST /sign_in` (`app/controllers/sessions_controller.rb`) has no throttling. An attacker can
issue unlimited credential guesses against a single account, or sweep a list of emails from one
source, and nothing in the stack slows them down.

## Solution

Use Rails 8.1's native `ActionController::RateLimiting`. No gem is required.

Reference consulted: <https://api.rubyonrails.org/v8.1.3/classes/ActionController/RateLimiting/ClassMethods.html>
(`rate_limit(to:, within:, by:, with:, store:, name:, scope:, **options)` — the `name:` option is
what allows more than one limit on the same controller).

### Two named limits on `SessionsController#create`

| Name             | Limit | Window | Keyed by                       | Protects against                     |
| ---------------- | ----- | ------ | ------------------------------ | ------------------------------------ |
| `sign-in-ip`     | 10    | 3 min  | `request.remote_ip` (default)  | Credential stuffing from one source  |
| `sign-in-email`  | 5     | 3 min  | submitted email, normalized    | Brute force on one account, from many IPs |

The two limits are independent — whichever bucket empties first blocks the request.

```ruby
class SessionsController < InertiaController
  RATE_LIMIT_ALERT = "Too many sign in attempts. Please try again in a few minutes"

  rate_limit to: 10, within: 3.minutes, name: "sign-in-ip",
             with: :rate_limit_exceeded, only: :create

  rate_limit to: 5, within: 3.minutes, name: "sign-in-email",
             by: -> { params[:email].to_s.downcase.strip },
             with: :rate_limit_exceeded, only: :create

  private

  def rate_limit_exceeded
    redirect_to sign_in_path, alert: RATE_LIMIT_ALERT
  end
end
```

The email key is normalized (`to_s.downcase.strip`) so that `Foo@Bar.com ` and `foo@bar.com` share
one bucket and casing cannot be used to multiply the allowance.

### Response on limit exceeded

`with: :rate_limit_exceeded` overrides the framework default (raise
`ActionController::TooManyRequests` → `429`). This app is Inertia-driven, so a bare 429 would
replace the sign-in form with an error page. The handler redirects back to `sign_in_path` with a
flash alert, matching the existing failed-credentials path in the same action.

No frontend change is needed: `sessions#create` already redirects with `alert:` on bad
credentials, so the flash rendering surface exists.

### Cache store

Rate limit counters live in an `ActiveSupport::Cache` store. Rails resolves it as
`config.action_controller.cache_store` → falling back to the global `config.cache_store`.

- production: inherits `:solid_cache_store` (DB-backed, therefore shared across Puma processes — a
  per-process memory store would let an attacker get N times the allowance)
- development: inherits `:memory_store`
- test: `config.cache_store` is `:null_store`, under which `increment` never returns a count and the
  limit would never fire. Fix by setting **only** `config.action_controller.cache_store = :memory_store`
  in `config/environments/test.rb`. The general cache stays `:null_store`; this uses the documented
  lookup order rather than changing global caching behavior in tests.

No `store:` argument is passed in the controller, so each environment keeps its own correct backend.

## Testing

Counters persist across examples within a run, so a global hook clears the controller cache store
before each example. Without it the suite is order-dependent and flaky.

`spec/support/` — new file:

```ruby
RSpec.configure do |config|
  config.before { ActionController::Base.cache_store.clear }
end
```

`spec/requests/sessions_spec.rb` — new `describe` block:

1. **IP limit** — 10 POSTs with *different* emails (staying under the per-email limit), all
   rejected as bad credentials; the 11th (again a fresh email, so only the IP bucket can be the
   cause) redirects with `RATE_LIMIT_ALERT`.
2. **Email limit** — 5 POSTs with the *same* email; the 6th redirects with `RATE_LIMIT_ALERT`.
3. **Window expiry** — exhaust the email limit, `travel 4.minutes`, then a request is accepted
   again. `ActiveSupport::Testing::TimeHelpers` is already included in `spec/rails_helper.rb`.
4. **Valid credentials still work** — one successful sign-in below the threshold is unaffected.

## Accepted trade-offs

1. `rate_limit` installs a `before_action`, so it counts **every** POST to `/sign_in`, including
   successful sign-ins. Rails exposes no documented option to count failures only. At 10/IP per
   3 minutes this does not affect normal use.
2. Requests with a blank `email` param all share one bucket (key `""`). This is desirable: bots
   posting empty forms are throttled together.
3. Users behind a shared NAT share the per-IP bucket. The per-email limit is the tighter of the two
   for a single account, so the practical impact is limited; thresholds can be raised if a real
   deployment reports false positives.

## Out of scope

Same treatment is warranted later, each with its own thresholds, on:

- `Identity::PasswordResetsController#create` — email flooding
- `UsersController#create` — signup abuse
- `Settings::PasswordsController#update` — password change

## Files touched

- `app/controllers/sessions_controller.rb` — two `rate_limit` declarations + private handler
- `config/environments/test.rb` — `config.action_controller.cache_store = :memory_store`
- `spec/support/cache_helpers.rb` — new, clears the store between examples
- `spec/requests/sessions_spec.rb` — new rate limiting examples
