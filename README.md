# Rails + Inertia + React Starter Kit

An opinionated starting point for full-stack applications: a Rails 8.1 backend and a React 19
frontend joined by [Inertia.js](https://inertia-rails.dev), with the props that cross the boundary
**typed end to end** — TypeScript interfaces and route helpers are generated from the Ruby
serializers, not hand-maintained.

It began as output of the [inertia-rails generator](https://github.com/inertia-rails/generator) and
has since diverged: the UI layer was replaced, serialization and authorization were added, and the
app no longer tracks upstream. Treat this repository as the source of truth.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | Ruby 4.0.1, [Rails](https://rubyonrails.org) 8.1.3 | |
| Server | [Puma](https://puma.io) 8 + [Thruster](https://github.com/basecamp/thruster) | Thruster adds HTTP caching, compression and X-Sendfile in front of Puma |
| Database | SQLite | Plus [Solid Cache / Queue / Cable](https://github.com/rails/solid_queue) — cache, jobs and websockets all live in the database, no Redis |
| Assets | [Propshaft](https://github.com/rails/propshaft) + [rails_vite](https://github.com/skryukov/rails_vite) | |
| Bridge | [inertia_rails](https://inertia-rails.dev) 3.22 / [@inertiajs/react](https://inertiajs.com) 3.6 | Server-driven routing, no separate API to version |
| Frontend | [React](https://react.dev) 19.2 + [React Compiler](https://react.dev/learn/react-compiler), [TypeScript](https://www.typescriptlang.org) 6, [Vite](https://vite.dev) 8 | |
| UI | [Astryx](https://www.npmjs.com/package/@astryxdesign/core) 0.1.8 + [Tailwind](https://tailwindcss.com) 4 | Component-first design system; it replaced shadcn/ui, so there is no local `components/ui` layer to maintain |
| Icons | [lucide-react](https://lucide.dev) | |
| Authentication | [authentication-zero](https://github.com/lazaronixon/authentication-zero) 4 | A generator, not a runtime dependency — the auth code lives in this repo and is yours to edit. The gem stays in the `Gemfile` so security advisories still reach us |
| Authorization | [Action Policy](https://actionpolicy.evilmartians.io) 0.7 | Policy objects with first-class scoping, and verdicts that can be handed to the client |
| Serialization | [Alba](https://github.com/okuramasafumi/alba) 3.10 + [alba-inertia](https://github.com/skryukov/alba-inertia) | Inertia props are defined as resources instead of inline hashes |
| Types | [Typelizer](https://github.com/skryukov/typelizer) 0.13 | Generates TS interfaces from the Alba serializers *and* typed route helpers from `routes.rb` |
| Pagination | [Pagy](https://ddnexus.github.io/pagy) 43.6 | |
| Images | [image_processing](https://github.com/janko/image_processing) + Active Storage | Avatar variants |
| Tests | [RSpec](https://rspec.info) 8, [Capybara](https://teamcapybara.github.io/capybara/) + Selenium, [capybara-lockstep](https://github.com/makandra/capybara-lockstep) | |
| Quality | [RuboCop](https://github.com/rails/rubocop-rails-omakase) (omakase), [ESLint](https://eslint.org), [Prettier](https://prettier.io), [Brakeman](https://brakemanscanner.org), [bundler-audit](https://github.com/rubysec/bundler-audit) | |
| Deployment | [Kamal](https://kamal-deploy.org) 2 | |

## What you get

**Authentication** — sign up, sign in, sign out, email verification, and password reset, all built
on `has_secure_password` and signed cookies. Passwords require 12 characters minimum. Changing a
password revokes every other session automatically.

**Sign-in rate limiting** — two independent limits on `SessionsController#create`: 10 attempts per
IP and 5 per email address, each over a 3-minute window, counted in the Action Controller cache
store. Exceeding either
redirects back with a neutral message that does not reveal whether the account exists.

**Session management** — users see every active session with its user agent, IP and creation time,
and can revoke any of them. The table is paginated *and* sorted on the server, with an `id`
tiebreaker so paging never skips or repeats a row when values collide.

**Account settings** — profile (name and avatar), password, email address, active sessions, and
appearance. Avatars accept PNG, JPEG or WebP up to 5 MB and are served as a 256px square WebP
variant. Changing an email marks the account unverified again and re-sends the verification link.

**Light / dark / system theme** — a client-side preference wired into the Astryx `Theme` provider,
with no flash of the wrong theme on load.

**Account deletion.**

## Getting started

Requires Ruby 4.0.1 and Node 22.

```bash
bin/setup
```

That installs gems and npm packages, prepares the database, and starts the dev server. Then open
<http://localhost:3000>.

In development the seeds create a ready-to-use account:

```
dev@example.com / password123456
```

Useful variants: `bin/setup --skip-server` (set up but don't boot) and `bin/setup --reset` (drop and
recreate the database).

Outgoing mail in development opens in the browser via
[letter_opener](https://github.com/ryanb/letter_opener) instead of being sent.

## Project layout

```
app/
  controllers/
    inertia_controller.rb     # base for every Inertia page: shared props + serializer params
  policies/                   # Action Policy — authorization rules and scopes
  serializers/                # Alba resources — the shape of every Inertia prop
  javascript/
    entrypoints/inertia.tsx   # createInertiaApp
    pages/                    # one file per Inertia page, resolved by name
    layouts/                  # persistent, app (sidebar shell), auth, settings
    components/               # app-specific composition over Astryx primitives
    hooks/
    routes/                   # GENERATED by Typelizer — typed route helpers
    types/serializers/        # GENERATED by Typelizer — prop interfaces
```

`@/` is an alias for `app/javascript/`.

## How props and types flow

This is the part worth understanding before writing a feature.

1. A controller inherits from `InertiaController`, which shares global props and passes the current
   user into every serializer via `inertia_serializer_params`.
2. Props are declared as **Alba serializers** under `app/serializers`. `alba-inertia` renders them
   as Inertia props; `Typelizer::DSL` annotates the types Ruby cannot infer.
3. **Typelizer** reads those serializers and emits TypeScript interfaces into
   `app/javascript/types/serializers`, plus typed route helpers into `app/javascript/routes`.
4. The page imports both and gets full type safety:

```tsx
import { settingsSessions } from "@/routes"
import type { SettingsSessionsIndex } from "@/types"

export default function Sessions({ sessions, pagy }: SettingsSessionsIndex) { ... }
```

Regenerate after touching a serializer or a route:

```bash
bin/rails typelizer:generate:refresh
```

> **Generated files are not editable.** Everything under `app/javascript/routes` and
> `app/javascript/types/serializers` is overwritten. CI regenerates them and fails if the result
> differs from what is committed, so stale types cannot reach `main`.

## Authorization

Policies live in `app/policies` and are enforced in controllers. `ApplicationController` tells
Action Policy where the performer comes from:

```ruby
authorize :user, through: -> { Current.user }
```

Three patterns are used throughout:

- **`authorize! record, to: :action?`** — the explicit check that raises. `ActionPolicy::Unauthorized`
  is rescued globally and redirects to the root with the policy's message.
- **`authorized_scope(Session.all)`** — scoping lookups so another user's record is a 404 rather
  than a 403, while the explicit `authorize!` still enforces the rule.
- **`allowed_to?` inside a serializer** — verdicts are serialized as `can_*` props, so the frontend
  hides a button because the policy said so, not because it guessed:

```ruby
attribute(:can_destroy) { |session| allowed_to?(:destroy?, session) }
```

Serializers authorize against the same user and the same policies as the controllers, so the UI and
the server can never disagree.

## Daily commands

| Command | What it does |
| --- | --- |
| `bin/dev` | Rails + Vite together (uses overmind or hivemind if installed, else foreman) |
| `bin/rspec` | Full test suite |
| `bin/rspec spec/system` | System tests only |
| `bin/rubocop` | Ruby style |
| `bin/brakeman` | Static security analysis |
| `bin/bundler-audit` | Known gem vulnerabilities |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:fix` | Prettier |
| `npm run check` | TypeScript, both projects |
| `bin/rails typelizer:generate:refresh` | Regenerate types and route helpers |
| `bin/ci` | Everything below, locally |

## Testing

RSpec, organised as request specs (one per controller), system specs, policy specs and mailer
specs. Fixtures for uploads live in `spec/fixtures/files`.

System tests run in **headless Chrome** via Selenium, with capybara-lockstep synchronising Capybara
against in-flight JavaScript and AJAX. Override the browser when debugging:

```bash
SYSTEM_TEST_BROWSER=chrome bin/rspec spec/system
```

## CI

`bin/ci` runs the same checks locally that CI runs remotely, via
`ActiveSupport::ContinuousIntegration` — setup, RuboCop, ESLint, Prettier, `tsc`, the generated-types
freshness check, bundler-audit, `npm audit`, Brakeman, RSpec, and a seed run against the test
database. Configure it in [`config/ci.rb`](config/ci.rb).

On GitHub, [`ci.yml`](.github/workflows/ci.yml) splits that into four parallel jobs (`scan_ruby`,
`lint_js`, `lint`, `test`) and uploads screenshots from failed system tests.
[`deploy.yml`](.github/workflows/deploy.yml) is **disabled by default** — flip its `if: false` to
enable deploy-on-green.

## Server-side rendering

SSR is **on**. `config.ssr_enabled = true` in
[`config/initializers/inertia_rails.rb`](config/initializers/inertia_rails.rb), and the Puma plugin
`inertia_ssr` ([`config/puma.rb`](config/puma.rb)) runs the Node renderer in-process — no separate
accessory, no second container.

In development that is all it takes: Vite serves the SSR bundle from its own dev endpoint with HMR.

For production images, [`Dockerfile`](Dockerfile) defaults `ARG SSR_ENABLED=true`, builds the SSR
bundle with `npx vite build --ssr`, and ships the Node runtime alongside the app. A normal build
already includes SSR.

To turn SSR **off**, set `config.ssr_enabled = false` and build with `SSR_ENABLED=false` so the
image drops the Node runtime:

```yml
# config/deploy.yml
builder:
  args:
    SSR_ENABLED: false
```

If the SSR process fails at runtime, Inertia logs the error and falls back to client-side rendering
rather than serving a 500 (`ssr_raise_on_error` defaults to `false`). Set `config.on_ssr_error` to
report those failures to your error tracker.

## Deployment

Kamal ships the app as a Docker container. Before the first deploy, edit
[`config/deploy.yml`](config/deploy.yml) and replace every `REPLACE_WITH_*` value:

- `servers.web` — the host to deploy to
- `registry.server` and `registry.username` — where images are pushed
- `builder.cache.image` — the build cache repository
- `service` / `image` — your application name, if you renamed it
- `proxy.host` + `ssl: true` — uncomment for Let's Encrypt certificates

Nothing points anywhere real until you fill those in, so a premature `bin/kamal deploy` fails
resolving the host instead of reaching a machine you did not mean to touch.

Secrets are declared in [`.kamal/secrets`](.kamal/secrets) and pulled from a password manager or
ENV; `RAILS_MASTER_KEY` is required. Never commit `config/master.key`.

```bash
bin/kamal setup     # first deploy
bin/kamal deploy    # subsequent deploys
```

Jobs run inside Puma by default (`SOLID_QUEUE_IN_PUMA: true`). Split them onto a dedicated `job`
host once one server is no longer enough.

## Working with agents

[`AGENTS.md`](AGENTS.md) holds the rules for AI coding agents on this repo — documentation-first,
no workarounds, systematic debugging, verify before claiming. `CLAUDE.md` simply includes it.
Design documents and implementation plans live under `docs/`.

## Credits

Originally generated by [inertia-rails/generator](https://github.com/inertia-rails/generator),
itself based on the [Laravel React Starter Kit](https://github.com/laravel/react-starter-kit) and
built by [Evil Martians](https://evilmartians.com).

## License

Available as open source under the terms of the [MIT License](LICENSE).
