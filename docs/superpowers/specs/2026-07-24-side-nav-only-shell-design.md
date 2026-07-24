# Side-Nav-Only Application Shell Design

## Goal

Make the starter kit's authenticated frame use Astryx's side-nav-only shell
as its default. The interface must keep route context, responsive navigation,
account actions, and the persisted collapsed state without retaining a
persistent `TopNav`.

## Chosen Direction

Use `AppShell — Side Nav Only`, adapted to the starter kit rather than copied
as demo content.

- `AppShell` receives `sideNav`, but no `topNav`.
- `SideNav` is the sole persistent desktop navigation surface.
- Astryx's automatic mobile behavior reuses the same `SideNav` in a drawer and
  renders its compact mobile top bar and toggle below the `md` breakpoint.
- Breadcrumbs remain in the main content area as route context, not as a
  second navigation bar.

This preserves orientation and mobile access while removing the visual weight
and duplicated hierarchy of a top-plus-side shell.

## Component Structure

### Application shell

`app-shell.tsx` owns the frame:

- `AppShell` keeps `height="fill"` and `contentPadding={0}`.
- `variant="elevated"` remains unless visual verification shows that the
  side-nav-only composition requires the documented `section` variant for a
  clear boundary.
- `sideNav={<AppSidebar />}` is the only desktop navigation slot.
- `mobileNav={{ breakpoint: "md" }}` uses Astryx's built-in responsive
  transformation instead of maintaining a separate navigation tree.
- Main content contains a compact breadcrumb region followed by the current
  Inertia page.

### Side navigation

`app-sidebar.tsx` follows the installed `shell-side-nav` and
`AppShellSideNavOnly` references:

- `SideNavHeading` presents the application icon and name and links to the
  dashboard through the root `LinkProvider`.
- Primary application routes and resource links render as
  `SideNavSection`/`SideNavItem` children.
- The account menu moves from the removed top navigation into the `SideNav`
  footer.
- The existing controlled collapse state and `storage` persistence remain
  unchanged.

The navigation arrays in `app-navigation.tsx` stay the single route model for
desktop and mobile because Astryx renders the same sidebar inside its mobile
drawer.

### Content header

`app-header.tsx` stops rendering `TopNav`. It becomes a small content-level
breadcrumb composition using Astryx layout/navigation primitives.

- It renders only when breadcrumbs are present.
- It does not contain account actions or duplicate application navigation.
- On mobile, the menu toggle is provided by `AppShell`'s documented automatic
  side-nav top bar.

### Account actions

`user-menu-content.tsx` retains the existing Settings and Log out behavior:

- Settings remains an Inertia visit.
- Log out remains the existing `router.delete` request followed by
  `router.flushAll()`.
- Its trigger must remain identifiable by the user's name and usable in both
  expanded and collapsed sidebar states.

## Behavior and Data Flow

1. Inertia renders an authenticated page through the persistent `AppShell`.
2. `AppSidebar` derives selected routes from the current Inertia URL.
3. Desktop users navigate through the persistent `SideNav`.
4. Below the `md` breakpoint, Astryx hides the desktop panel, renders the
   compact mobile top bar, and opens the same navigation in its drawer.
5. Internal destinations continue through the shared `AppLink`/`LinkProvider`;
   external resources remain native external links.
6. Breadcrumbs reflect page props inside the main content region.
7. Account actions remain available from the sidebar footer and mobile drawer.

No Rails routes, Inertia props, request payloads, storage keys, or logout
semantics change.

## Accessibility

- The application retains one semantic `main` region supplied by `AppShell`.
- `SideNavHeading` provides a named home destination.
- Selected `SideNavItem` entries retain `isSelected`.
- Astryx owns the responsive drawer, focus management, close behavior, and
  mobile toggle label.
- Breadcrumbs keep the final item marked as current.
- Page headings remain the page-level H1; the shell does not introduce another
  H1.

## Verification

Extend behavior-oriented system coverage to verify:

- the authenticated frame renders `AppShell` and `SideNav`;
- no Astryx `TopNav` is present;
- the account menu is available from the sidebar;
- the collapsed preference still persists;
- at a mobile viewport, the automatic navigation toggle opens the drawer and
  an internal destination remains an Inertia navigation;
- breadcrumbs and the page H1 remain visible in the content region.

Run TypeScript checks, lint, production build, the relevant Rails system
specs, and the Astryx self-audit. Tests must not assert package versions or
implementation source strings.

## Non-Goals

- Redesigning application routes or adding new navigation destinations.
- Introducing a custom mobile drawer or a duplicate mobile route model.
- Changing the neutral theme, typography tokens, or application branding.
- Converting dashboard or session page content, which remains in later
  migration tasks.
