# Astryx UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complete shadcn/Radix presentation layer with Astryx 0.1.8 and its neutral theme while preserving every Rails, Inertia, authentication, form, route, and preference behavior.

**Architecture:** Deliver one coordinated Astryx-native frontend change, organized internally as foundation, root providers, application frame, public/auth pages, settings, remaining authenticated pages, and legacy cleanup. Inertia remains the navigation and form owner; Astryx owns presentation, layout, theme, overlays, and feedback without a shadcn compatibility layer.

**Tech Stack:** Rails 8.1, Ruby 4.0, Inertia Rails, React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Astryx 0.1.8, RSpec, Capybara, Selenium.

## Global Constraints

- Use `@astryxdesign/core`, `@astryxdesign/theme-neutral`, and `@astryxdesign/cli` at version `0.1.8`.
- Query the installed CLI before every Astryx component implementation: `npx astryx component <Name> --json`.
- Use `Theme` with `neutralTheme` and preserve `light | dark | system`.
- Preserve all Rails routes, controller behavior, Inertia page props, request payload names, flash data, and form validation.
- Use Astryx layout components instead of raw `<div>` or `<span>` layout wrappers.
- Use component props first and token-backed Tailwind utilities only when a component prop cannot express the requirement.
- Do not add raw colors, arbitrary Tailwind values, inline `style`, `@apply`, or local component CSS.
- Do not create a shadcn-compatible adapter layer.
- Keep cards for independent widgets only; use edge-to-edge rows for session data.
- Keep `Gemfile.lock` out of all commits unless a separate, reviewed Ruby dependency change explicitly requires it.
- Do not merge or release any intermediate commit; the selected delivery strategy is one final Astryx-native change.

## File Responsibility Map

- `app/javascript/entrypoints/application.css`: canonical Tailwind/Astryx layer order and no application-specific theme tokens.
- `app/javascript/entrypoints/inertia.tsx`: Inertia boot only; initializes the stored color mode before mounting.
- `app/javascript/components/inertia-link.tsx`: route-aware link adapter that sends internal URLs through Inertia and external URLs through native anchors.
- `app/javascript/hooks/use-appearance.tsx`: shared appearance context, persistence, OS preference handling, and root `color-scheme`.
- `app/javascript/hooks/use-flash.tsx`: translate Rails flash props into Astryx toast calls.
- `app/javascript/providers/astryx-provider.tsx`: neutral `Theme`, `LinkProvider`, and flash bridge.
- `app/javascript/layouts/persistent-layout.tsx`: one persistent root provider around all Inertia pages.
- `app/javascript/components/app-navigation.tsx`: one navigation model rendered by desktop and mobile Astryx navigation.
- `app/javascript/components/app-shell.tsx`: authenticated Astryx `AppShell` composition.
- `app/javascript/components/app-header.tsx`: top navigation, breadcrumbs, mobile toggle, and account menu.
- `app/javascript/components/page-heading.tsx`: shared Astryx heading and supporting text composition.
- `app/javascript/components/appearance-control.tsx`: controlled Astryx `SegmentedControl` for light/dark/system.
- `app/javascript/lib/astryx.ts`: conversion of Inertia error arrays to Astryx status objects.
- `app/javascript/layouts/auth-layout.tsx`: the one public authentication frame.
- `app/javascript/layouts/settings/layout.tsx`: route-driven Astryx settings navigation and content.
- `spec/frontend/astryx_migration_spec.rb`: static package, CSS, source, and legacy-removal contracts.
- `spec/system/astryx_ui_spec.rb`: browser coverage for the foundation, shell, theme, routes, and responsive behavior.

---

### Task 1: Establish the Astryx CSS and Package Foundation

**Files:**
- Create: `spec/frontend/astryx_migration_spec.rb`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/javascript/entrypoints/application.css`
- Include generated: `AGENTS.md`

**Interfaces:**
- Consumes: the already installed Astryx 0.1.8 packages.
- Produces: `npm run build`, canonical Astryx CSS layers, and static setup assertions used by later tasks.

- [ ] **Step 1: Refresh the installed setup documentation**

Run:

```bash
npx astryx docs migration --dense
npx astryx docs theme --dense
npx astryx docs styling --dense
```

Expected: each command exits `0` and describes the Tailwind v4 layer order, pre-built neutral theme, and token-backed utility rules.

- [ ] **Step 2: Write the failing package and cascade contract**

Create `spec/frontend/astryx_migration_spec.rb`:

```ruby
# frozen_string_literal: true

require "json"
require "pathname"

RSpec.describe "Astryx frontend migration" do
  let(:root) { Pathname.new(__dir__).join("../..").expand_path }
  let(:package) { JSON.parse(root.join("package.json").read) }
  let(:css) { root.join("app/javascript/entrypoints/application.css").read }

  it "pins the Astryx runtime and development packages" do
    expect(package.dig("dependencies", "@astryxdesign/core")).to eq("^0.1.8")
    expect(package.dig("dependencies", "@astryxdesign/theme-neutral")).to eq("^0.1.8")
    expect(package.dig("devDependencies", "@astryxdesign/cli")).to eq("^0.1.8")
  end

  it "loads the Astryx styles in canonical cascade order" do
    imports = [
      '@import "tailwindcss/theme.css" layer(theme);',
      '@import "tailwindcss/preflight.css" layer(base);',
      '@import "@astryxdesign/core/reset.css";',
      '@import "@astryxdesign/core/astryx.css";',
      '@import "@astryxdesign/theme-neutral/theme.css";',
      '@import "@astryxdesign/core/tailwind-theme.css";',
      '@import "tailwindcss/utilities.css" layer(utilities);'
    ]

    positions = imports.map { |statement| css.index(statement) }
    expect(positions).to all(be_a(Integer))
    expect(positions).to eq(positions.sort)
    expect(css).to start_with(
      "@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;"
    )
  end
end
```

- [ ] **Step 3: Run the focused contract and confirm the CSS example fails**

Run:

```bash
bin/rspec spec/frontend/astryx_migration_spec.rb
```

Expected: the package example passes; the cascade-order example fails because the stylesheet still contains the shadcn import and token definitions.

- [ ] **Step 4: Replace the global stylesheet and add a build script**

Replace `app/javascript/entrypoints/application.css` with:

```css
@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;

@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "@astryxdesign/core/reset.css";
@import "@astryxdesign/core/astryx.css";
@import "@astryxdesign/theme-neutral/theme.css";
@import "@astryxdesign/core/tailwind-theme.css";
@import "tailwindcss/utilities.css" layer(utilities);
```

Add the production build script to `package.json`:

```json
"build": "vite build"
```

Keep these exact dependency placements:

```json
"dependencies": {
  "@astryxdesign/core": "^0.1.8",
  "@astryxdesign/theme-neutral": "^0.1.8"
},
"devDependencies": {
  "@astryxdesign/cli": "^0.1.8"
}
```

Run `npm install` once to keep `package-lock.json` synchronized.

- [ ] **Step 5: Verify the foundation**

Run:

```bash
bin/rspec spec/frontend/astryx_migration_spec.rb
npm run check
npm run build
```

Expected: `2 examples, 0 failures`; TypeScript exits `0`; Vite completes a production build.

- [ ] **Step 6: Commit the foundation**

```bash
git add AGENTS.md package.json package-lock.json app/javascript/entrypoints/application.css spec/frontend/astryx_migration_spec.rb
git commit -m "build: configure Astryx foundation"
```

### Task 2: Add the Shared Theme, Router, Appearance, and Flash Providers

**Files:**
- Create: `app/javascript/components/inertia-link.tsx`
- Create: `app/javascript/providers/astryx-provider.tsx`
- Modify: `app/javascript/hooks/use-appearance.tsx`
- Modify: `app/javascript/hooks/use-flash.tsx`
- Modify: `app/javascript/layouts/persistent-layout.tsx`
- Modify: `app/javascript/entrypoints/inertia.tsx`
- Modify: `spec/frontend/astryx_migration_spec.rb`

**Interfaces:**
- Consumes: `Appearance = "light" | "dark" | "system"`, Rails `FlashData`, Inertia `Link`, `neutralTheme`.
- Produces: `AppLink`, `AppearanceProvider`, `useAppearance()`, `initializeTheme()`, `AstryxProvider`, and Astryx toast feedback for all pages.

- [ ] **Step 1: Read the exact provider and toast APIs**

Run:

```bash
npx astryx component Theme --json
npx astryx component Link --json
npx astryx hook useToast --json
```

Expected: `Theme` accepts `theme`, `mode`, and `children`; `LinkProvider` accepts `component`; `useToast` returns `showToast(options)`.

- [ ] **Step 2: Add failing provider source contracts**

Append to `spec/frontend/astryx_migration_spec.rb`:

```ruby
it "mounts the neutral Astryx theme and Inertia link provider" do
  provider = root.join("app/javascript/providers/astryx-provider.tsx").read
  expect(provider).to include('from "@astryxdesign/core/theme"')
  expect(provider).to include('from "@astryxdesign/theme-neutral/built"')
  expect(provider).to include("<LinkProvider component={AppLink}>")
  expect(provider).to include("<Theme theme={neutralTheme} mode={appearance}>")
end

it "uses Astryx rather than Sonner for Rails flash messages" do
  flash_hook = root.join("app/javascript/hooks/use-flash.tsx").read
  expect(flash_hook).to include('from "@astryxdesign/core/Toast"')
  expect(flash_hook).not_to include('from "sonner"')
end
```

- [ ] **Step 3: Run the focused contracts and confirm both fail**

Run:

```bash
bin/rspec spec/frontend/astryx_migration_spec.rb
```

Expected: two new failures because the provider does not exist and `use-flash.tsx` imports Sonner.

- [ ] **Step 4: Convert appearance state into a shared context**

Implement `app/javascript/hooks/use-appearance.tsx` around this exact public contract:

```tsx
export type Appearance = "light" | "dark" | "system"

interface AppearanceContextValue {
  appearance: Appearance
  updateAppearance: (appearance: Appearance) => void
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance)

  const updateAppearance = useCallback((nextAppearance: Appearance) => {
    setAppearance(nextAppearance)
    persistAppearance(nextAppearance)
    applyColorScheme(nextAppearance)
  }, [])

  useEffect(() => {
    applyColorScheme(appearance)
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyColorScheme(appearance)
    query.addEventListener("change", handleChange)
    return () => query.removeEventListener("change", handleChange)
  }, [appearance])

  return (
    <AppearanceContext value={{ appearance, updateAppearance }}>
      {children}
    </AppearanceContext>
  )
}

export function useAppearance() {
  const context = use(AppearanceContext)
  if (!context) throw new Error("useAppearance must be used inside AppearanceProvider")
  return context
}
```

Keep `initializeTheme()` as the pre-mount call from `inertia.tsx`, but restrict it to reading the saved preference and setting `document.documentElement.style.colorScheme`. Store explicit `light` and `dark`; remove the storage key for `system`.

- [ ] **Step 5: Implement the route-aware link adapter**

Create `app/javascript/components/inertia-link.tsx`:

```tsx
import { Link as InertiaLink } from "@inertiajs/react"
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react"

type AppLinkProps = ComponentPropsWithoutRef<"a">

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  function AppLink({ href = "", ...props }, ref) {
    const destination = href.toString()
    const isExternal = /^(https?:)?\/\//.test(destination)

    if (isExternal) {
      return <a ref={ref} href={destination} {...props} />
    }

    return <InertiaLink ref={ref} href={destination} {...props} />
  },
)
```

This is routing infrastructure, not a UI compatibility wrapper. It preserves
native browser behavior for external documentation/repository links and lets
Astryx navigation use Inertia for internal URLs.

- [ ] **Step 6: Implement the root provider and Astryx flash bridge**

Create `app/javascript/providers/astryx-provider.tsx`:

```tsx
import { LinkProvider } from "@astryxdesign/core/Link"
import { Theme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import type { PropsWithChildren } from "react"

import { AppLink } from "@/components/inertia-link"
import {
  AppearanceProvider,
  useAppearance,
} from "@/hooks/use-appearance"
import { useFlash } from "@/hooks/use-flash"

function ThemedApplication({ children }: PropsWithChildren) {
  const { appearance } = useAppearance()
  useFlash()

  return (
    <LinkProvider component={AppLink}>
      <Theme theme={neutralTheme} mode={appearance}>
        {children}
      </Theme>
    </LinkProvider>
  )
}

export function AstryxProvider({ children }: PropsWithChildren) {
  return (
    <AppearanceProvider>
      <ThemedApplication>{children}</ThemedApplication>
    </AppearanceProvider>
  )
}
```

Replace `use-flash.tsx` with the same StrictMode deferral but call:

```tsx
const showToast = useToast()

if (flash.alert) {
  showToast({ body: flash.alert, type: "error", uniqueID: "rails-alert" })
}
if (flash.notice) {
  showToast({ body: flash.notice, type: "info", uniqueID: "rails-notice" })
}
```

Update `PersistentLayout` to render only:

```tsx
export default function PersistentLayout({ children }: PropsWithChildren) {
  return <AstryxProvider>{children}</AstryxProvider>
}
```

- [ ] **Step 7: Verify provider behavior**

Run:

```bash
bin/rspec spec/frontend/astryx_migration_spec.rb
npm run check
npm run lint
npm run build
```

Expected: frontend contracts pass and all three npm commands exit `0`.

- [ ] **Step 8: Commit the root integration**

```bash
git add app/javascript/components/inertia-link.tsx app/javascript/providers/astryx-provider.tsx app/javascript/hooks/use-appearance.tsx app/javascript/hooks/use-flash.tsx app/javascript/layouts/persistent-layout.tsx app/javascript/entrypoints/inertia.tsx spec/frontend/astryx_migration_spec.rb
git commit -m "feat: add Astryx root providers"
```

### Task 3: Rebuild the Authenticated Application Frame

**Files:**
- Create: `app/javascript/components/app-navigation.tsx`
- Create: `app/javascript/components/page-heading.tsx`
- Modify: `app/javascript/components/app-logo.tsx`
- Modify: `app/javascript/components/app-shell.tsx`
- Modify: `app/javascript/components/app-header.tsx`
- Modify: `app/javascript/components/app-sidebar.tsx`
- Modify: `app/javascript/components/breadcrumbs.tsx`
- Modify: `app/javascript/components/user-menu-content.tsx`
- Delete: `app/javascript/components/app-content.tsx`
- Delete: `app/javascript/components/app-sidebar-header.tsx`
- Delete: `app/javascript/components/nav-main.tsx`
- Delete: `app/javascript/components/nav-footer.tsx`
- Delete: `app/javascript/components/nav-user.tsx`
- Delete: `app/javascript/components/user-info.tsx`
- Modify: `app/javascript/layouts/app-layout.tsx`
- Modify: `app/javascript/layouts/app/app-sidebar-layout.tsx`
- Delete: `app/javascript/layouts/app/app-header-layout.tsx`
- Modify: `app/javascript/types/index.ts`
- Create: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Consumes: `Auth`, `BreadcrumbItem`, current Inertia URL, dashboard/settings/session routes, stored sidebar state.
- Produces: one `AppLayout({children, breadcrumbs})`, one shared navigation model, responsive desktop/mobile navigation, and native Astryx breadcrumbs/account actions.

- [ ] **Step 1: Inspect every structural API immediately before editing**

Run:

```bash
npx astryx component AppShell --json
npx astryx component SideNav --json
npx astryx component SideNavItem --json
npx astryx component MobileNav --json
npx astryx component TopNav --json
npx astryx component Breadcrumbs --json
npx astryx component DropdownMenu --json
npx astryx component Avatar --json
```

Expected: all commands exit `0`; use only props present in these installed 0.1.8 responses.

- [ ] **Step 2: Write a failing authenticated-shell system spec**

Create `spec/system/astryx_ui_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Astryx UI", type: :system do
  fixtures :users

  it "renders the authenticated Astryx application frame" do
    sign_in users(:one)
    visit dashboard_path

    expect(page).to have_css(".astryx-app-shell")
    expect(page).to have_css(".astryx-side-nav")
    expect(page).to have_css("main")
    expect(page).to have_text("Dashboard")
  end
end
```

- [ ] **Step 3: Run the shell spec and confirm it fails**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: failure because `.astryx-app-shell` and `.astryx-side-nav` do not exist.

- [ ] **Step 4: Centralize navigation data and remove icon types from shared page data**

In `app-navigation.tsx`, define one route model:

```tsx
const primaryNavigation = [
  {
    label: "Dashboard",
    href: dashboard.index().url,
    icon: LayoutGrid,
  },
] as const

const resourceNavigation = [
  {
    label: "Repository",
    href: "https://github.com/inertia-rails/react-starter-kit",
    icon: Folder,
  },
  {
    label: "Documentation",
    href: "https://inertia-rails.dev",
    icon: BookOpen,
  },
] as const
```

Render `SideNavItem` with `as={AppLink}`, `href`, `label`, `icon`, and
`isSelected={page.url === item.href}`. Reuse the same primary items inside
`MobileNav`; mark resource links as external in the appropriate Astryx link
component.

Change `NavItem` in `types/index.ts` to presentation-neutral route data:

```ts
export interface NavItem {
  title: string
  href: string
  isActive?: boolean
}
```

- [ ] **Step 5: Build the one authenticated frame**

Compose `AppShell` with this structure:

```tsx
<AstryxAppShell
  height="fill"
  variant="elevated"
  sideNav={<AppSidebar />}
  mobileNav={{ content: <AppMobileNavigation /> }}
  topNav={<AppHeader breadcrumbs={breadcrumbs} />}
  contentPadding={0}
>
  {children}
</AstryxAppShell>
```

Use a controlled `SideNav` collapse configuration backed by the existing
`storage` helper:

```tsx
<SideNav
  collapsible={{
    isCollapsed,
    onCollapsedChange: updateCollapsed,
    hasButton: true,
    buttonLabel: "Toggle navigation",
  }}
  header={<AppLogo />}
  footer={<AppAccountMenu />}
>
  <AppDesktopNavigation />
</SideNav>
```

Use `TopNav` for `MobileNavToggle`, breadcrumbs when `breadcrumbs.length > 1`,
and account actions. Use `Breadcrumbs`/`BreadcrumbItem` with the final item
marked `isCurrent`.

Consolidate `app-layout.tsx` and `app-sidebar-layout.tsx` so all authenticated
pages use this frame. Delete the unused header-layout alternative and
`app-content.tsx`; `AppShell` now owns the main content region directly.

- [ ] **Step 6: Replace account and navigation subcomponents**

Use:

```tsx
<Avatar src={auth.user.avatar} name={auth.user.name} size="md" />
```

Use `DropdownMenu` action entries for Settings and Log out. Settings navigation
uses Inertia navigation; logout calls `router.delete(sessions.destroy().url)`.
Keep `AppLogo` as content, but use Astryx layout/text components rather than
raw layout wrappers.

Move the old `nav-main`, `nav-footer`, `nav-user`, and `user-info` behavior into
`app-navigation.tsx`, `AppSidebar`, and `user-menu-content.tsx`, then delete
those obsolete files. Delete `app-sidebar-header.tsx` because `TopNav` now owns
the mobile toggle and breadcrumbs. Retain `app-logo-icon.tsx` as the custom SVG
brand mark, but remove shadcn-only classes from its call sites.

Create `page-heading.tsx`:

```tsx
export function PageHeading({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <VStack gap={1}>
      <Heading level={2}>{title}</Heading>
      {description ? (
        <Text type="supporting" color="secondary">
          {description}
        </Text>
      ) : null}
    </VStack>
  )
}
```

- [ ] **Step 7: Verify shell, types, and responsive navigation**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
npm run check
npm run lint
npm run build
```

Expected: the shell system example passes; TypeScript, lint, and build exit `0`.

- [ ] **Step 8: Commit the frame**

```bash
git add app/javascript/components app/javascript/layouts/app-layout.tsx app/javascript/layouts/app app/javascript/types/index.ts spec/system/astryx_ui_spec.rb
git commit -m "feat: rebuild application frame with Astryx"
```

### Task 4: Convert Public and Authentication Pages

**Files:**
- Create: `app/javascript/lib/astryx.ts`
- Modify: `app/javascript/layouts/auth-layout.tsx`
- Modify: `app/javascript/layouts/auth/auth-simple-layout.tsx`
- Delete: `app/javascript/layouts/auth/auth-card-layout.tsx`
- Delete: `app/javascript/layouts/auth/auth-split-layout.tsx`
- Modify: `app/javascript/pages/home/index.tsx`
- Modify: `app/javascript/pages/sessions/new.tsx`
- Modify: `app/javascript/pages/users/new.tsx`
- Modify: `app/javascript/pages/identity/password_resets/new.tsx`
- Modify: `app/javascript/pages/identity/password_resets/edit.tsx`
- Modify: `app/javascript/components/text-link.tsx`
- Modify: `spec/system/sessions_spec.rb`
- Modify: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Consumes: Inertia `Form`, generated Wayfinder routes, Rails validation arrays.
- Produces: `astryxStatus(messages)`, one Astryx auth frame, controlled Astryx fields with unchanged HTML names and route actions.

- [ ] **Step 1: Inspect form and layout APIs**

Run:

```bash
npx astryx component TextInput --json
npx astryx component Button --json
npx astryx component FormLayout --json
npx astryx component Card --json
npx astryx component Link --json
npx astryx component Layout --json
```

- [ ] **Step 2: Add failing public/auth browser expectations**

Append to `spec/system/astryx_ui_spec.rb`:

```ruby
it "renders the public and authentication routes with Astryx fields" do
  visit root_path
  expect(page).to have_css(".astryx-link")

  visit sign_in_path
  expect(page).to have_css(".astryx-text-input", count: 2)
  expect(page).to have_css(".astryx-button")

  padding = page.evaluate_script(
    "getComputedStyle(document.querySelector('.astryx-button')).paddingInline"
  )
  expect(padding).not_to eq("0px")
end
```

- [ ] **Step 3: Confirm the new example fails**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: failure because login still renders shadcn fields and buttons.

- [ ] **Step 4: Add the shared validation converter**

Create `app/javascript/lib/astryx.ts`:

```ts
export function astryxStatus(messages?: string[]) {
  if (!messages?.length) return undefined

  return {
    type: "error" as const,
    message: messages.join(". "),
  }
}
```

- [ ] **Step 5: Consolidate the auth frame**

Build one `AuthLayout` with `Layout`, `Card`, `VStack`, `Heading`, `Text`, and
the application logo. It accepts the unchanged interface:

```ts
interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
}
```

Use `Card maxWidth={420} padding={6}` for the independent authentication task.
Delete the unused card/split alternatives after confirming no imports remain.

- [ ] **Step 6: Convert every authentication form using the same controlled pattern**

For each field, preserve the exact `htmlName`, input type, autocomplete value,
required state, and route action. The login pattern is:

```tsx
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")

<Form action={sessions.create()} onSuccess={() => setPassword("")}>
  {({ processing, errors }) => (
    <FormLayout>
      <TextInput
        label="Email address"
        type="email"
        htmlName="email"
        value={email}
        onChange={setEmail}
        isRequired
        hasAutoFocus
        placeholder="email@example.com"
        status={astryxStatus(errors.email)}
      />
      <TextInput
        label="Password"
        type="password"
        htmlName="password"
        value={password}
        onChange={setPassword}
        isRequired
        placeholder="Password"
        status={astryxStatus(errors.password)}
      />
      <Button
        type="submit"
        label="Log in"
        variant="primary"
        width="100%"
        isLoading={processing}
      />
    </FormLayout>
  )}
</Form>
```

Use this exact field and submission matrix:

| Page | Controlled fields | Submission details |
| --- | --- | --- |
| Login | `email`, `password` | Preserve `sessions.create()` and clear only `password` after success. |
| Registration | `name`, `email`, `password`, `password_confirmation` | Preserve `users.create()` and clear both password fields after success. |
| Reset request | `email` | Preserve `identityPasswordResets.create()` and the link back to login. |
| Reset password | read-only `email`, `password`, `password_confirmation` | Preserve `identityPasswordResets.update()`, `transform={(data) => ({ ...data, sid, email })}`, and clear both password fields after success. `sid` remains transform-only and is not rendered as an input. |

Keep the existing autocomplete values: `email`, `name`, `current-password`, and
`new-password` as appropriate. Preserve autofocus on the first editable field
and display every field's Rails error through `astryxStatus`.

- [ ] **Step 7: Convert public links and the home page**

Make `TextLink` a thin Astryx `Link` composition using `as={InertiaLink}` for
internal routes. Rebuild the home page with `Layout`, `Section`, `VStack`,
`HStack`, `Heading`, `Text`, `Link`, and `Button` only. Preserve authenticated
dashboard navigation and unauthenticated sign-in navigation.

- [ ] **Step 8: Verify the auth workflows**

Run:

```bash
bin/rspec spec/system/sessions_spec.rb spec/system/astryx_ui_spec.rb
bin/rspec spec/requests/sessions_spec.rb spec/requests/users_spec.rb spec/requests/identity/password_resets_spec.rb
npm run check
npm run lint
```

Expected: all system and request examples pass; npm checks exit `0`.

- [ ] **Step 9: Commit public and auth conversion**

```bash
git add app/javascript/lib/astryx.ts app/javascript/layouts/auth-layout.tsx app/javascript/layouts/auth app/javascript/pages/home app/javascript/pages/sessions app/javascript/pages/users app/javascript/pages/identity/password_resets app/javascript/components/text-link.tsx spec/system
git commit -m "feat: convert public and auth pages to Astryx"
```

### Task 5: Convert Settings Navigation and Appearance

**Files:**
- Create: `app/javascript/components/appearance-control.tsx`
- Modify: `app/javascript/layouts/settings/layout.tsx`
- Modify: `app/javascript/pages/settings/appearance.tsx`
- Delete: `app/javascript/components/appearance-tabs.tsx`
- Delete: `app/javascript/components/appearance-dropdown.tsx`
- Delete: `app/javascript/components/heading.tsx`
- Modify: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Consumes: settings route URLs and `useAppearance()`.
- Produces: native Astryx settings navigation and a controlled three-option appearance input.

- [ ] **Step 1: Inspect the exact settings and appearance references**

Run:

```bash
npx astryx template settings-sidebar --skeleton
npx astryx component Layout --json
npx astryx component List --json
npx astryx component ListItem --json
npx astryx component Toolbar --json
npx astryx hook useMediaQuery --json
npx astryx component SegmentedControl --json
npx astryx component SegmentedControlItem --json
npx astryx component Section --json
```

- [ ] **Step 2: Add a failing appearance persistence example**

Append to `spec/system/astryx_ui_spec.rb`:

```ruby
it "switches and persists all three Astryx appearance modes" do
  sign_in users(:one)
  visit settings_appearance_path

  click_on "Dark"
  expect(page.evaluate_script("localStorage.getItem('appearance')")).to eq("dark")
  expect(page.evaluate_script("document.documentElement.style.colorScheme")).to eq("dark")

  click_on "Light"
  expect(page.evaluate_script("localStorage.getItem('appearance')")).to eq("light")

  click_on "System"
  expect(page.evaluate_script("localStorage.getItem('appearance')")).to be_nil
end
```

- [ ] **Step 3: Confirm the appearance example fails**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: failure because the settings page still uses the shadcn appearance tabs.

- [ ] **Step 4: Implement the native appearance control**

Create `appearance-control.tsx`:

```tsx
const appearanceOptions: { value: Appearance; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

export default function AppearanceControl() {
  const { appearance, updateAppearance } = useAppearance()

  return (
    <SegmentedControl
      label="Appearance"
      value={appearance}
      onChange={(value) => updateAppearance(value as Appearance)}
      layout="fill"
    >
      {appearanceOptions.map((option) => (
        <SegmentedControlItem
          key={option.value}
          value={option.value}
          label={option.label}
        />
      ))}
    </SegmentedControl>
  )
}
```

- [ ] **Step 5: Rebuild the settings frame**

Use the existing route array and follow the installed `settings-sidebar`
master/detail pattern. Render a `List` of linked `ListItem` entries with
`href`, `isSelected`, and the current Inertia URL. On desktop, place this list
inside the `Layout` start `LayoutPanel`. On viewports matching the official
template query `useMediaQuery("(max-width: 768px)")`, show the page detail by
default, provide a `Toolbar` back action that switches to the full-width
navigation list, and return to detail after choosing a destination. Because
the shared root `LinkProvider` owns links, each `href` remains an Inertia
visit. Render page content through `LayoutContent`, `Section`, and `VStack`; do
not wrap settings sections in decorative cards.

Convert `settings/appearance.tsx` to:

```tsx
<AppLayout breadcrumbs={breadcrumbs}>
  <Head title="Appearance settings" />
  <SettingsLayout>
    <Section>
      <VStack gap={4}>
        <PageHeading
          title="Appearance settings"
          description="Update your account's appearance settings"
        />
        <AppearanceControl />
      </VStack>
    </Section>
  </SettingsLayout>
</AppLayout>
```

Delete both legacy appearance components. Once `settings/layout.tsx` uses
`PageHeading` or direct Astryx typography, confirm `heading.tsx` has no imports
and delete it too.

- [ ] **Step 6: Verify settings navigation and appearance**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
npm run check
npm run lint
npm run build
```

Expected: all appearance assertions pass; npm commands exit `0`.

- [ ] **Step 7: Commit settings frame and appearance**

```bash
git add app/javascript/components/appearance-control.tsx app/javascript/components/appearance-tabs.tsx app/javascript/components/appearance-dropdown.tsx app/javascript/components/heading.tsx app/javascript/layouts/settings/layout.tsx app/javascript/pages/settings/appearance.tsx spec/system/astryx_ui_spec.rb
git commit -m "feat: convert settings navigation and theme controls"
```

### Task 6: Convert Settings Forms and Destructive Account Action

**Files:**
- Modify: `app/javascript/pages/settings/profiles/show.tsx`
- Modify: `app/javascript/pages/settings/emails/show.tsx`
- Modify: `app/javascript/pages/settings/passwords/show.tsx`
- Modify: `app/javascript/components/delete-user.tsx`
- Modify: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Consumes: existing Inertia `Form` route actions and `astryxStatus`.
- Produces: Astryx-native profile, email, password, and delete-account workflows with unchanged payloads.

- [ ] **Step 1: Inspect the required form and dialog APIs**

Run:

```bash
npx astryx component TextInput --json
npx astryx component FormLayout --json
npx astryx component Button --json
npx astryx component Dialog --json
npx astryx component DialogHeader --json
npx astryx template DialogFormDialog
npx astryx component Banner --json
```

- [ ] **Step 2: Add failing settings form and dialog browser checks**

Append to `spec/system/astryx_ui_spec.rb`:

```ruby
it "renders settings forms and destructive confirmation with Astryx" do
  sign_in users(:one)

  visit settings_profile_path
  expect(page).to have_css(".astryx-text-input", minimum: 1)
  click_on "Delete account"
  expect(page).to have_css(".astryx-dialog")
  expect(page).to have_text("Delete account?")
  expect(page).to have_field("Password")

  visit settings_email_path
  expect(page).to have_css(".astryx-text-input")

  visit settings_password_path
  expect(page).to have_css(".astryx-text-input", minimum: 3)
end
```

- [ ] **Step 3: Confirm the new example fails**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: failure on shadcn fields or dialog.

- [ ] **Step 4: Convert profile, email, and password forms**

For each page:

- keep its current Inertia `Form` action and method;
- move each field to controlled React state;
- preserve each `htmlName` exactly;
- pass `status={astryxStatus(errors.<field>)}`;
- use `FormLayout` and one primary `Button` with `isLoading={processing}`;
- replace Headless UI save transitions with an Astryx toast or persistent
  supporting text driven by the existing `recentlySuccessful` value;
- use `Banner` for persistent verification warnings on the email page.

Use this exact controlled-state matrix:

| Page | Fields and defaults | Reset/preserved behavior |
| --- | --- | --- |
| Profile | `name`, initialized from `auth.user.name` | Preserve scroll and keep the edited value after either response. |
| Email | `email`, initialized from `auth.user.email`; `password_challenge`, initialized empty | Clear `password_challenge` after success or error. Preserve the unverified-email warning and resend-verification action. |
| Password | `password_challenge`, `password`, `password_confirmation`, all initialized empty | Clear all three fields after success or error. |

For controlled fields, implement those resets explicitly in `onSuccess` and
`onError`; do not rely on `resetOnSuccess`/`resetOnError` to mutate React state.
Keep every current route action, `preserveScroll`, autocomplete value, label,
and server-error binding.

The shared field form is:

```tsx
<TextInput
  label={label}
  type={type}
  htmlName={name}
  value={value}
  onChange={setValue}
  status={astryxStatus(errors[name])}
  isRequired
/>
```

- [ ] **Step 5: Convert account deletion to a controlled form Dialog**

Use local `isOpen` state and Inertia `useForm`. Keep the password field, its
server error, and both actions inside `Dialog purpose="form"`:

```tsx
const deletion = useForm({ password_challenge: "" })
const passwordInput = useRef<HTMLInputElement>(null)

const closeDeletion = () => {
  deletion.reset()
  deletion.clearErrors()
  setIsOpen(false)
}

const updateDeletionOpen = (nextOpen: boolean) => {
  if (nextOpen) {
    setIsOpen(true)
  } else {
    closeDeletion()
  }
}

const submitDeletion = () => {
  deletion.delete(users.destroy().url, {
    preserveScroll: true,
    onSuccess: closeDeletion,
    onError: () => passwordInput.current?.focus(),
  })
}

<Dialog
  isOpen={isOpen}
  onOpenChange={updateDeletionOpen}
  purpose="form"
  width={480}
>
  <Layout
    header={
      <DialogHeader
        title="Delete account?"
        subtitle="This action cannot be undone."
        onOpenChange={updateDeletionOpen}
      />
    }
    content={
      <LayoutContent>
        <VStack gap={4}>
          <Text type="body">
            Enter your password to permanently delete your account and all
            associated data.
          </Text>
          <TextInput
            label="Password"
            type="password"
            ref={passwordInput}
            value={deletion.data.password_challenge}
            onChange={(value) =>
              deletion.setData("password_challenge", value)
            }
            status={astryxStatus(deletion.errors.password_challenge)}
            isRequired
            hasAutoFocus
          />
        </VStack>
      </LayoutContent>
    }
    footer={
      <LayoutFooter>
        <HStack gap={2} hAlign="end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={closeDeletion}
          />
          <Button
            label="Delete account"
            variant="destructive"
            isDisabled={!deletion.data.password_challenge}
            isLoading={deletion.processing}
            onClick={submitDeletion}
          />
        </HStack>
      </LayoutFooter>
    }
  />
</Dialog>
```

Preserve the exact payload key `password_challenge`; show its server error
inline beside this field and leave the dialog open when validation fails.

- [ ] **Step 6: Remove obsolete heading-wrapper imports from these pages**

Replace `HeadingSmall` imports in the profile, email, password, and delete-user
components with `PageHeading` or direct Astryx `Heading`/`Text`. Confirm the
general `heading.tsx` wrapper was removed in Task 5. Keep `heading-small.tsx`
only until the sessions page is converted in Task 7.

- [ ] **Step 7: Verify settings behavior**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
bin/rspec spec/requests/settings spec/requests/users_spec.rb
npm run check
npm run lint
```

Expected: system and request specs pass; npm checks exit `0`.

- [ ] **Step 8: Commit settings forms**

```bash
git add app/javascript/pages/settings app/javascript/components/delete-user.tsx spec/system/astryx_ui_spec.rb
git commit -m "feat: convert account settings forms to Astryx"
```

### Task 7: Convert Dashboard and Session Management

**Files:**
- Modify: `app/javascript/pages/dashboard/index.tsx`
- Modify: `app/javascript/pages/settings/sessions/index.tsx`
- Delete: `app/javascript/components/placeholder-pattern.tsx`
- Delete: `app/javascript/components/heading-small.tsx`
- Modify: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Consumes: dashboard route and `Session[]` page props.
- Produces: Astryx dashboard widgets and an edge-to-edge session list with current-session status and revoke actions.

- [ ] **Step 1: Inspect dashboard and row components**

Run:

```bash
npx astryx build "starter dashboard with three widgets and one primary content region"
npx astryx component Grid --json
npx astryx component Card --json
npx astryx component List --json
npx astryx component ListItem --json
npx astryx component StatusDot --json
npx astryx component Button --json
```

- [ ] **Step 2: Add failing dashboard and sessions checks**

Append to `spec/system/astryx_ui_spec.rb`:

```ruby
it "renders Astryx dashboard widgets and edge-to-edge session rows" do
  sign_in users(:one)

  visit dashboard_path
  expect(page).to have_css(".astryx-grid")
  expect(page).to have_css(".astryx-card", minimum: 3)

  visit settings_sessions_path
  expect(page).to have_css(".astryx-list")
  expect(page).to have_text("Current")
end
```

- [ ] **Step 3: Confirm the dashboard/session example fails**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: failure because the dashboard is raw Tailwind markup and sessions use shadcn `Badge`/`Button`.

- [ ] **Step 4: Rebuild the dashboard hierarchy**

Use `Layout`, `Section`, `PageHeading`, `Grid`, `Card`, `VStack`, `Heading`, and
`Text`. Create three independent starter widgets in the grid and one main
content section. Remove decorative SVG pattern markup and delete
`placeholder-pattern.tsx`.

Each starter widget follows:

```tsx
<Card padding={4}>
  <VStack gap={2}>
    <Heading level={3}>Starter widget</Heading>
    <Text color="secondary">
      Replace this content with an application-specific metric.
    </Text>
  </VStack>
</Card>
```

- [ ] **Step 5: Convert sessions to rows**

Use `List hasDividers density="balanced"` and one `ListItem` per session. Put
user agent/IP/date in label/description slots confirmed by the installed CLI.
Use `StatusDot` plus visible `Current` text for the authenticated session.
Render a destructive `Button` for other sessions and preserve the existing
Inertia delete route. Replace the sessions page's last `HeadingSmall` use with
`PageHeading`, confirm `rg -n 'heading-small' app/javascript` has no imports,
and delete `heading-small.tsx`.

- [ ] **Step 6: Verify remaining authenticated pages**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
bin/rspec spec/requests/settings/sessions_spec.rb
npm run check
npm run lint
npm run build
```

Expected: all checks pass.

- [ ] **Step 7: Commit dashboard and sessions**

```bash
git add app/javascript/pages/dashboard app/javascript/pages/settings/sessions app/javascript/components/placeholder-pattern.tsx app/javascript/components/heading-small.tsx spec/system/astryx_ui_spec.rb
git commit -m "feat: convert dashboard and sessions to Astryx"
```

### Task 8: Remove shadcn, Radix, and Unused Legacy Dependencies

**Files:**
- Delete: `app/javascript/components/ui/`
- Delete: `components.json`
- Delete if unused: `app/javascript/lib/utils.ts`
- Delete if unused: `app/javascript/components/alert-error.tsx`
- Delete if unused: `app/javascript/components/icon.tsx`
- Delete if unused: `app/javascript/hooks/use-initials.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `spec/frontend/astryx_migration_spec.rb`
- Modify: all remaining files reported by the legacy scans

**Interfaces:**
- Consumes: fully migrated Astryx call sites from Tasks 2–7.
- Produces: no shadcn source/config/imports and a minimal runtime dependency graph.

- [ ] **Step 1: Add the failing legacy-removal contract**

Append to `spec/frontend/astryx_migration_spec.rb`:

```ruby
it "contains no legacy shadcn or Radix frontend" do
  source_files = root.glob("app/javascript/**/*.{ts,tsx,css}")
  forbidden = [
    %r{@/components/ui},
    %r{from "radix-ui"},
    %r{from "sonner"},
    %r{from "@headlessui/react"},
    %r{class-variance-authority},
    %r{from "clsx"},
    %r{tailwind-merge},
    %r{tw-animate-css},
    %r{@apply},
    %r{style=\{\{}
  ]

  matches = source_files.flat_map do |file|
    file.readlines.filter_map.with_index(1) do |line, number|
      "#{file.relative_path_from(root)}:#{number}:#{line.strip}" if forbidden.any? { |pattern| line.match?(pattern) }
    end
  end

  expect(matches).to eq([])
  expect(root.join("components.json")).not_to exist
  expect(root.join("app/javascript/components/ui")).not_to exist
end

it "removes packages that only supported the legacy UI layer" do
  all_dependencies = package.fetch("dependencies", {}).merge(
    package.fetch("devDependencies", {})
  )

  expect(all_dependencies.keys).not_to include(
    "radix-ui",
    "sonner",
    "next-themes",
    "class-variance-authority",
    "tailwind-merge",
    "tw-animate-css",
    "@headlessui/react",
    "clsx",
    "@tailwindcss/forms",
    "@tailwindcss/typography"
  )
end
```

- [ ] **Step 2: Run the focused contract and confirm it fails**

Run:

```bash
bin/rspec spec/frontend/astryx_migration_spec.rb
```

Expected: failures list the remaining UI directory, config, imports, and legacy packages.

- [ ] **Step 3: Remove all legacy files and imports**

Delete `components.json` and every file under `app/javascript/components/ui`.
Run:

```bash
rg -n '@/components/ui|radix-ui|sonner|@headlessui/react|class-variance-authority|clsx|tailwind-merge|tw-animate-css|@apply|style=\\{\\{' app/javascript
```

Expected after cleanup: exit `1` with no matches.

Delete `lib/utils.ts`, `components/alert-error.tsx`, `components/icon.tsx`, and
`hooks/use-initials.tsx` only after `rg` confirms zero imports. Replace any
remaining raw layout containers with Astryx `VStack`, `HStack`, `Grid`,
`Layout`, `Section`, or `StackItem`.

- [ ] **Step 4: Remove unused packages and normalize dependency placement**

Run:

```bash
npm uninstall radix-ui sonner next-themes @headlessui/react class-variance-authority clsx tailwind-merge tw-animate-css @tailwindcss/forms @tailwindcss/typography
npm install lucide-react
```

Keep `lucide-react` as a runtime dependency because Astryx accepts direct SVG
components and the neutral theme depends on the icon library. Run:

```bash
npm dedupe
```

- [ ] **Step 5: Run Astryx self-check scans**

Run:

```bash
rg -n '<div|<span|style=\\{\\{|#[0-9A-Fa-f]{3,8}|\\[[0-9]+px\\]|@apply|className=' app/javascript --glob '*.tsx' --glob '*.css'
```

Review every result. Retain semantic `<span>` only when the Astryx component API
requires inline text and the element does not perform layout. Replace all raw
layout elements, raw colors, arbitrary values, inline styles, and unsupported
class overrides.

- [ ] **Step 6: Verify cleanup**

Run:

```bash
bin/rspec spec/frontend/astryx_migration_spec.rb
npm run check
npm run lint
npm run format
npm run build
npm ls @astryxdesign/core @astryxdesign/theme-neutral @astryxdesign/cli --depth=0
```

Expected: frontend spec has zero failures; all npm scripts exit `0`; all three Astryx packages report `0.1.8`.

- [ ] **Step 7: Commit legacy removal**

```bash
git add package.json package-lock.json components.json app/javascript spec/frontend/astryx_migration_spec.rb
git commit -m "refactor!: remove shadcn UI layer"
```

### Task 9: Run Full Functional, Visual, and Accessibility Verification

**Files:**
- Modify if verification exposes defects: only the Astryx migration files listed in Tasks 1–8.
- Test: `spec/frontend/astryx_migration_spec.rb`
- Test: `spec/system/astryx_ui_spec.rb`
- Test: existing `spec/requests/` and `spec/system/sessions_spec.rb`

**Interfaces:**
- Consumes: the complete Astryx-native frontend.
- Produces: fresh evidence that the coordinated conversion is releasable.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
bin/rspec
npm run check
npm run lint
npm run format
npm run build
```

Expected: RSpec reports `0 failures`; every npm command exits `0`.

- [ ] **Step 2: Start the application and verify the health endpoint**

Run:

```bash
bin/dev
```

In another terminal:

```bash
curl --fail --silent --show-error --output /dev/null --write-out "HTTP %{http_code}\n" http://127.0.0.1:3000/
```

Expected: Rails and Vite remain running; curl prints `HTTP 200`.

- [ ] **Step 3: Verify desktop flows in the browser**

At a desktop viewport, verify:

1. home page;
2. registration;
3. login and invalid-login feedback;
4. password-reset request and reset form;
5. authenticated dashboard;
6. sidebar selection and collapse persistence;
7. breadcrumbs;
8. account menu and logout;
9. profile, email, password, appearance, and sessions settings;
10. account-deletion confirmation and cancellation.

Expected: no console errors; no horizontal overflow; visible focus states; all route transitions remain Inertia visits.

- [ ] **Step 4: Verify mobile and keyboard behavior**

At a 390×844 viewport:

1. open mobile navigation;
2. navigate to Dashboard and Settings;
3. verify the drawer closes and focus returns to the toggle;
4. tab through navigation, forms, menus, segmented control, and dialog;
5. use Escape to close menus and dialogs.

Expected: every interactive control is reachable, has an accessible name, and shows focus; no focus is trapped after overlays close.

- [ ] **Step 5: Verify appearance modes**

Test Light, Dark, and System. For System, change the emulated OS preference
between light and dark.

Expected: surfaces, text, borders, icons, hover, focus, banners, dialogs, menus,
and toasts update consistently; explicit modes persist; System removes the
storage override and follows OS changes.

- [ ] **Step 6: Run final source and dependency audits**

Run:

```bash
rg -n '@/components/ui|radix-ui|sonner|components.json|@headlessui/react|class-variance-authority|clsx|tailwind-merge|tw-animate-css' . --glob '!node_modules/**' --glob '!docs/superpowers/**'
rg -n '<div|<span|style=\\{\\{|#[0-9A-Fa-f]{3,8}|\\[[0-9]+px\\]|@apply' app/javascript --glob '*.tsx' --glob '*.css'
npm ls --depth=0
git diff --check
git status --short
```

Expected: no legacy matches; every markup/style match is reviewed and conforms
to `AGENTS.md`; dependency tree is valid; diff check is empty; status contains
only intentional migration work and preserves the unrelated `Gemfile.lock`
change.

- [ ] **Step 7: Commit verification fixes, if any**

If verification required changes:

```bash
git add app/javascript package.json package-lock.json spec
git commit -m "fix: resolve Astryx migration regressions"
```

If no files changed, do not create an empty commit.
