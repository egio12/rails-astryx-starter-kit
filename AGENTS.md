# AGENTS.md

Project-specific guidance for AI coding agents.

## Non-negotiable rules

These rules override convenience, speed, and your own recollection. They apply to every task.

### 1. Documentation first — always, before writing anything

Before you start any task that touches a library, framework, gem, or API, you MUST read the
official documentation for the exact version in use. Never work from memory: your training data
is stale, and this project pins recent versions (Rails 8.1, Ruby 4.0, React 19, TypeScript 6,
Vite 8, Tailwind 4, Inertia, Astryx).

- If the Context7 MCP server is available, use it first:
  `resolve-library-id` → `query-docs`. Prefer it over web search for library documentation.
- If Context7 is unavailable, fetch the official documentation site directly. Blog posts,
  Stack Overflow answers, and AI-generated summaries are not sources — they are hints that
  must be confirmed against official docs.
- Astryx is the exception in mechanism only: its source of truth is the installed CLI
  (`npx astryx component <Name>`, `npx astryx docs <topic>`) — see the Astryx section below.
- State in your response which documentation you consulted. If you could not consult any,
  say so explicitly instead of guessing.

### 2. Never write workaround code

Do not write a workaround, a patch-over, a hack, a monkey patch, a `rescue` that swallows the
problem, a hardcoded value that dodges the real path, a disabled test, or a "temporary" shim.

**99% of the time an official, supported solution exists.** Your job is to find it, not to route
around it. Framework-supported APIs, documented configuration, and official extension points are
always preferred over anything you invent.

If, after actually reading the official documentation, you are convinced no supported solution
exists: stop and report that to the user with what you checked and what you found. Do not
implement the workaround unilaterally. If the user then explicitly asks for one, implement it and
mark it in the code with a comment stating what is missing upstream and why the workaround exists.

### 3. Every bug goes through systematic debugging

The moment you hit a bug, a failing test, or any unexpected behavior, invoke the
`superpowers:systematic-debugging` skill **before** proposing or writing a fix. No guess-and-check,
no shotgun edits, no "let me try changing this."

Then apply rule 1 again: verify the intended behavior against the official documentation before
writing the fix. Most bugs are a misused API, not a broken one.

### 4. Verify, don't claim

Never state that something works, is fixed, or passes without having run the command and read its
output. Use `superpowers:verification-before-completion` before claiming any work is complete.

## Browser verification

Use Chrome for browser automation and system-test verification. Run RSpec system tests with the
default browser (`bin/rspec spec/system`), which is headless Chrome.

Do not use Safari. It was measured on this project and rejected: three consecutive runs of the
system suite gave 0 / 11 / 3 failures out of 13 under `SYSTEM_TEST_BROWSER=safari`, against 0
failures every time under headless Chrome. The flakiness is `safaridriver` mishandling form input
(the password ends up appended to the email field), not application code, and Safari has no
headless mode. Do not try to paper over it with retry helpers around `fill_in` — that was tried and
made the suite fail deterministically in Chrome too.

<!-- ASTRYX:START -->
Astryx v0.1.8 · 153 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Nested `Section` is full-bleed by design: it escapes its parent container padding. Use `Section` only for an intentional page region or surface; use `VStack`/`HStack` for neutral grouping. When nested section content must align with its parent, set the documented `padding` prop explicitly to the same spacing step instead of relying on the theme default.
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   153 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
