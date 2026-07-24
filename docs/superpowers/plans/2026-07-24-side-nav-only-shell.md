# Side-Nav-Only Application Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Astryx's side-nav-only frame the default authenticated application shell while preserving breadcrumbs, account actions, responsive navigation, Inertia routing, and the stored collapsed state.

**Architecture:** `AppShell` will receive one `SideNav` and no `TopNav`. The same `SideNav` tree will become Astryx's automatic mobile drawer at the `md` breakpoint; a content-level `Toolbar` will retain breadcrumbs without becoming a second application-navigation surface.

**Tech Stack:** Rails 8.1, Inertia Rails, React 19, TypeScript 6, Astryx 0.1.8, RSpec, Capybara, Selenium.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-24-side-nav-only-shell-design.md`.
- Query the installed CLI before every Astryx component implementation with `npx astryx component <Name> --json`.
- Start discovery with `npx astryx build "Rails starter application shell with side navigation only, breadcrumbs, account menu, and responsive mobile navigation"`.
- Keep `AppShell` as the single semantic `main` owner.
- Do not pass a `topNav` slot.
- Use one shared `SideNav` tree for desktop and Astryx's automatic mobile drawer.
- Preserve the `sidebar` storage key and its existing boolean-string semantics.
- Preserve all Inertia routes, selected-route behavior, external-link behavior, Settings navigation, and logout behavior.
- Use Astryx components instead of raw `<div>` or `<span>` layout wrappers.
- Do not add inline styles, raw colors, arbitrary Tailwind values, `@apply`, local component CSS, or a compatibility adapter.
- Keep all tests behavior-oriented; do not assert package versions or application source strings.
- Do not modify dashboard, settings form, or session page content in this change.

## File Responsibility Map

- `app/javascript/components/app-shell.tsx`: owns the side-nav-only `AppShell`, automatic mobile navigation configuration, and content header placement.
- `app/javascript/components/app-sidebar.tsx`: owns application identity, route sections, collapse persistence, and the account-menu footer.
- `app/javascript/components/app-header.tsx`: owns only content-level breadcrumbs; it no longer renders `TopNav` or account actions.
- `app/javascript/components/app-navigation.tsx`: remains the single primary/resource route model and needs no duplicate mobile representation.
- `app/javascript/components/user-menu-content.tsx`: retains Settings/logout behavior unchanged and is consumed from the sidebar footer.
- `spec/system/astryx_ui_spec.rb`: verifies the side-nav-only structure and responsive behavior through the browser.

---

### Task 1: Replace the Hybrid Shell with SideNav-Only

**Files:**
- Modify: `app/javascript/components/app-shell.tsx`
- Modify: `app/javascript/components/app-sidebar.tsx`
- Modify: `app/javascript/components/app-header.tsx`
- Test: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Consumes: `AppNavigation`, `BreadcrumbItem[]`, current Inertia `auth`/URL props, `storage.getItem("sidebar")`, `storage.setItem("sidebar", value)`, `UserMenuContent`.
- Produces: `AppShell({ children, breadcrumbs })`, one responsive `AppSidebar`, and `AppHeader({ breadcrumbs })` as a breadcrumb-only content toolbar.

- [ ] **Step 1: Refresh the exact installed references**

Run:

```bash
npx astryx build "Rails starter application shell with side navigation only, breadcrumbs, account menu, and responsive mobile navigation"
npx astryx template shell-side-nav --skeleton
npx astryx template AppShellSideNavOnly
npx astryx component AppShell --json
npx astryx component SideNav --json
npx astryx component SideNavHeading --json
npx astryx component SideNavItem --json
npx astryx component SideNavSection --json
npx astryx component NavIcon --json
npx astryx component Toolbar --json
npx astryx component Breadcrumbs --json
npx astryx component DropdownMenu --json
```

Expected: all commands exit `0`. `AppShell` documents automatic mobile navigation from its `sideNav`; `SideNav` documents `header`, `footerIcons`, and controlled `collapsible`; `Toolbar` documents its content slots.

- [ ] **Step 2: Change the authenticated-shell example to the desired behavior**

Replace the first authenticated-frame example in `spec/system/astryx_ui_spec.rb` with:

```ruby
it "renders the authenticated side-nav-only application frame" do
  sign_in_as users(:one)
  page.execute_script("localStorage.removeItem('sidebar')")
  visit dashboard_path

  expect(page).to have_css(".astryx-app-shell")
  expect(page).to have_css(".astryx-side-nav")
  expect(page).to have_no_css(".astryx-top-nav")
  expect(page).to have_css('[role="main"]')
  expect(page).to have_css(".astryx-breadcrumbs")

  within(".astryx-side-nav") do
    expect(page).to have_button(users(:one).name)
    click_on "Collapse navigation"
    expect(page).to have_button(users(:one).name)
  end

  expect(
    page.evaluate_script("localStorage.getItem('sidebar')"),
  ).to eq("false")
end
```

Add a separate responsive example:

```ruby
it "uses the shared side navigation in Astryx's mobile drawer" do
  sign_in_as users(:one)
  page.current_window.resize_to(767, 900)
  visit settings_profile_path

  click_on "Open navigation"

  expect(page).to have_css(".astryx-mobile-nav")
  expect(page).to have_link("Dashboard", href: dashboard_path)
  expect(page).to have_button(users(:one).name)

  click_link "Dashboard", href: dashboard_path

  expect(page).to have_current_path(dashboard_path)
ensure
  page.current_window.resize_to(1400, 900)
end
```

The test checks rendered semantics and user-visible behavior. It must not read
component source or package versions.

- [ ] **Step 3: Run the new examples and verify RED**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: the side-nav-only example fails because the current frame still
renders `.astryx-top-nav` and keeps the account menu outside the sidebar.

- [ ] **Step 4: Convert `AppHeader` into a breadcrumb-only content toolbar**

Replace `app/javascript/components/app-header.tsx` with:

```tsx
import { Toolbar } from "@astryxdesign/core/Toolbar"

import { Breadcrumbs } from "@/components/breadcrumbs"
import type { BreadcrumbItem } from "@/types"

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  if (breadcrumbs.length === 0) return null

  return (
    <Toolbar
      label="Page context"
      size="sm"
      dividers={["bottom"]}
      startContent={<Breadcrumbs breadcrumbs={breadcrumbs} />}
    />
  )
}
```

This keeps route context in the content region and removes `TopNav`,
`MobileNavToggle`, and `UserMenuContent` from the header.

- [ ] **Step 5: Move identity, navigation, and account actions into `AppSidebar`**

Replace the `AppSidebar` composition with:

```tsx
import { Icon } from "@astryxdesign/core/Icon"
import { NavIcon } from "@astryxdesign/core/NavIcon"
import { SideNav, SideNavHeading } from "@astryxdesign/core/SideNav"
import { usePage } from "@inertiajs/react"
import { useState } from "react"

import AppLogoIcon from "@/components/app-logo-icon"
import {
  PrimaryNavigation,
  ResourceNavigation,
} from "@/components/app-navigation"
import { UserMenuContent } from "@/components/user-menu-content"
import * as storage from "@/lib/storage"
import { dashboard } from "@/routes"

export function AppSidebar() {
  const { auth } = usePage().props
  const [isCollapsed, setIsCollapsed] = useState(
    () => storage.getItem("sidebar") === "false",
  )

  const handleCollapsedChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    storage.setItem("sidebar", String(!collapsed))
  }

  return (
    <SideNav
      header={
        <SideNavHeading
          icon={<NavIcon icon={<Icon icon={AppLogoIcon} size="sm" />} />}
          heading={import.meta.env.VITE_APP_NAME ?? "React Starter Kit"}
          headingHref={dashboard.index().url}
        />
      }
      footerIcons={<UserMenuContent auth={auth} />}
      collapsible={{
        isCollapsed,
        onCollapsedChange: handleCollapsedChange,
        buttonLabel: "Collapse navigation",
      }}
    >
      <PrimaryNavigation />
      <ResourceNavigation />
    </SideNav>
  )
}
```

Do not create a second navigation model. `ResourceNavigation` moves from the
old footer into the scrollable navigation body; the account menu becomes the
footer action and retains its existing routes.

- [ ] **Step 6: Remove `TopNav` and custom mobile-drawer duplication from `AppShell`**

Replace the `AstryxAppShell` composition with:

```tsx
<AstryxAppShell
  variant="elevated"
  height="fill"
  contentPadding={0}
  sideNav={<AppSidebar />}
  mobileNav={{ breakpoint: "md" }}
>
  <AppHeader breadcrumbs={breadcrumbs} />
  {children}
</AstryxAppShell>
```

Remove the `MobileNav`, `AppLogo`, and `AppNavigation` imports from this file.
Do not pass `topNav`. Astryx will render the side-nav-only mobile top bar and
reuse `AppSidebar` as the drawer content.

- [ ] **Step 7: Run GREEN verification**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
npm run format:fix
npm run check
npm run lint
npm run build
```

Expected: all system examples pass; TypeScript, ESLint, and Vite exit `0`.

- [ ] **Step 8: Run the Astryx self-audit**

Run:

```bash
git diff --check
rg -n 'style=\{|<div|<span|bg-\[|text-\[|#[0-9a-fA-F]{3,8}|@apply' \
  app/javascript/components/app-shell.tsx \
  app/javascript/components/app-sidebar.tsx \
  app/javascript/components/app-header.tsx
rg -n 'TopNav|topNav=|MobileNav|AppNavigation' \
  app/javascript/components/app-shell.tsx \
  app/javascript/components/app-header.tsx
```

Expected: all commands return no violations. The final search must not find
hybrid-shell imports or slots in `app-shell.tsx`/`app-header.tsx`.

- [ ] **Step 9: Commit the side-nav-only frame**

```bash
git add \
  app/javascript/components/app-shell.tsx \
  app/javascript/components/app-sidebar.tsx \
  app/javascript/components/app-header.tsx \
  spec/system/astryx_ui_spec.rb
git commit -m "feat: make side navigation the default shell"
```

The commit must not include generated build artifacts, dependency changes, or
later dashboard/session work.
