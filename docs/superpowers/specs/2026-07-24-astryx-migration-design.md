# Astryx UI Migration Design

Date: 2026-07-24

## Context

The Rails starter kit uses Inertia, React 19, Vite, Tailwind CSS v4, and a
locally owned shadcn/Radix component layer under
`app/javascript/components/ui`. The UI layer is used by the persistent
application shell, authentication pages, settings pages, form validation,
dialogs, navigation, appearance controls, and flash notifications.

Astryx 0.1.8 is installed through:

- `@astryxdesign/core`
- `@astryxdesign/theme-neutral`
- `@astryxdesign/cli`

The Astryx CLI generated `AGENTS.md`, whose conventions govern the migration.
The application must use Astryx components for layout and spacing, use tokens
instead of raw values, discover component APIs through the CLI, and avoid
hand-built layout markup.

## Goal

Replace the current shadcn/Radix UI implementation completely with native
Astryx components and the pre-built neutral theme while preserving the Rails,
Inertia, routing, authentication, validation, and persistence behavior.

The finished starter kit must:

- use Astryx directly rather than compatibility wrappers;
- preserve the existing routes, page data, form submissions, and user flows;
- preserve light, dark, and system appearance modes;
- use Astryx composition patterns for the shell and every page;
- contain no shadcn component sources or configuration;
- contain no unused shadcn/Radix dependencies;
- remain type-safe, lint-clean, testable, responsive, and keyboard accessible.

## Non-goals

- Changing Rails models, controllers, routes, authentication rules, or
  authorization behavior.
- Adding new product features or application workflows.
- Creating a custom Astryx theme or overriding individual color tokens.
- Preserving the current shadcn visual appearance pixel-for-pixel.
- Introducing a compatibility layer that makes Astryx imitate shadcn APIs.

## Chosen Migration Strategy

The migration will be delivered as one coordinated conversion rather than a
route-by-route mixed-design-system rollout. The implementation may be organized
internally into ordered steps, but the final change set must not leave an
intermediate production state in which shadcn and Astryx both render user-facing
surfaces.

This strategy accepts a larger coordinated change in exchange for a clean
boundary: the merged result is an Astryx-native application with no legacy UI
layer.

## Root Theme and CSS Architecture

`PersistentLayout` will become the application-wide Astryx root. It will:

- mount `Theme` from `@astryxdesign/core/theme`;
- use `neutralTheme` from `@astryxdesign/theme-neutral/built`;
- pass the existing `light | dark | system` appearance value to `Theme`;
- retain flash-message handling and provide the Astryx toast lifecycle.

The existing appearance preference remains stored under the current
`appearance` key. The appearance hook will own the preference and expose it to
the Astryx provider. Direct manipulation of shadcn theme classes will be removed
unless a non-Astryx integration still demonstrably requires it.

The global Tailwind v4 stylesheet will adopt the Astryx cascade order:

1. declare the canonical reset, theme, base, Astryx, component, and utility
   layers;
2. import Tailwind theme and preflight into their named layers;
3. import Astryx reset and component styles;
4. import the neutral theme stylesheet;
5. import Astryx token-backed Tailwind utilities;
6. import Tailwind utilities in the final utility layer.

The shadcn CSS variables, Radix animation tokens, custom dark variant, and
shadcn base rules will be removed. Tailwind remains available only for
token-backed utilities permitted by Astryx. Raw colors, arbitrary values,
inline styles, `@apply`, and new local component CSS are not allowed.

Before converting the full UI, implementation will add a temporary foundation
smoke surface or equivalent automated assertion that proves Astryx primitives
retain non-zero padding, borders, and internal spacing in both color modes. The
temporary visual surface will be removed after the cascade order is verified;
an inexpensive automated regression assertion may remain.

## Application Frame

Authenticated pages will share one Astryx-native application frame:

- `AppShell` is the outermost application layout.
- `SideNav` owns desktop primary navigation and collapse behavior.
- `MobileNav` uses the same navigation data on narrow viewports.
- The shell header owns mobile navigation toggle, breadcrumbs, contextual
  actions, and the account menu.
- Route state remains the source of truth for selected navigation items.
- Existing Inertia `Link` navigation and prefetch behavior are retained where
  compatible with the Astryx component contract.
- Sidebar collapse preference remains persisted locally.

The frame will be composed with Astryx slots and layout components. It will not
use raw `<div>` or `<span>` elements to create layout or spacing. The frame will
use the Astryx `fill` height model where independent application scrolling is
required and assign content padding by surface type.

Public and authentication pages will use Astryx `Layout`, `Section`, `Card`,
`VStack`, `HStack`, and related primitives rather than the authenticated shell.
Existing auth layout variants may be consolidated when they express the same
information architecture; functional page behavior and content remain intact.

## Component Replacement Map

The implementation must consult `npx astryx component <Name>` before using each
component. The expected semantic mapping is:

| Legacy responsibility | Astryx responsibility |
| --- | --- |
| Application wrapper and sidebar | `AppShell`, `SideNav`, `MobileNav` |
| Page and regional layout | `Layout`, `Section`, `VStack`, `HStack`, `Grid` |
| Buttons and icon actions | `Button`, `IconButton` |
| Inputs and field validation | `TextInput` and native Astryx field status APIs |
| Checkbox controls | `CheckboxInput` or grouped checkbox component |
| Select controls | `Selector` or another CLI-confirmed bounded-choice component |
| Appearance selection | CLI-confirmed three-option selection component |
| Cards | `Card`, only for widgets and grouped settings content |
| Navigable or actionable rows | `List`, `ListItem`, or CLI-confirmed row components |
| Breadcrumbs | Native Astryx breadcrumb/navigation component |
| User image | Native Astryx avatar component |
| Dropdown and overflow actions | `DropdownMenu`, `MoreMenu`, or CLI-confirmed equivalent |
| Informational page feedback | `Banner` |
| Transient flash feedback | `useToast` and Astryx toast viewport |
| Destructive confirmation | `AlertDialog` |
| Loading state | Native loading/progress component and component loading props |
| Enumerated state or count | `Token`, `StatusDot`, or `Badge` according to semantics |

Cards will not wrap dense lists or session rows. Status indicators will use
`StatusDot` or `Token`; `Badge` is reserved for counts and enumerated states.

## Page Conversion

### Authentication and Password Recovery

Registration, login, password-reset request, and password-reset completion
pages will use Astryx form and layout primitives. Inertia form state, server
errors, disabled submission state, autofocus, autocomplete, and links remain
unchanged. Validation messages render inline through Astryx field status APIs
rather than through toasts.

### Dashboard and Home

The dashboard and home page will preserve their purpose and route behavior but
adopt Astryx page hierarchy. Dashboard widgets may use `Card`; placeholder and
empty content will use CLI-confirmed Astryx primitives rather than decorative
custom markup.

### Settings

Settings retain profile, email, password, appearance, and active-session
destinations. The settings frame will use Astryx navigation and content panels
based on the `settings-sidebar` reference template while preserving Inertia
routes as the source of navigation state.

Profile, email, and password pages will use Astryx form components with inline
validation and existing request payloads. Appearance will offer light, dark,
and system modes and update the root `Theme` immediately. Active sessions will
render as edge-to-edge list rows rather than card-wrapped items.

### Destructive Account Action

Account deletion will use Astryx `AlertDialog`, preserve password confirmation
and server validation, retain focus management, and keep the existing Inertia
delete request. Errors remain in the dialog near the relevant field.

## State and Data Flow

Rails continues to provide page props and flash data. Inertia continues to own
navigation and form requests. The migration changes only presentation and local
UI state.

- Page props flow from Rails to existing Inertia pages.
- Form state and validation remain managed by Inertia form helpers.
- Navigation selection derives from the current Inertia URL.
- Appearance state is read from local storage, passed to `Theme`, and updated
  through the existing appearance hook.
- Sidebar state is local UI state persisted through the existing storage
  helper.
- Flash props are normalized by the existing flash hook and sent to Astryx
  `useToast`.

No duplicate source of truth will be introduced for route, form, appearance, or
navigation state.

## Error Handling and Accessibility

- Server validation errors render inline on their corresponding Astryx inputs.
- Blocking or persistent errors use `Banner`.
- Non-blocking success and informational flash messages use Astryx toasts.
- Destructive actions require `AlertDialog`.
- Mobile navigation must close on route changes and restore focus correctly.
- The shell must retain skip-to-content behavior supplied by `AppShell`.
- Navigation, menus, dialogs, appearance controls, and forms must be operable
  with the keyboard.
- Every icon-only action requires an accessible label.
- Light, dark, and system modes must maintain readable contrast and visible
  focus indicators.
- Loading and disabled states must remain perceivable and prevent duplicate
  submissions.

## Legacy Removal

After all call sites use Astryx, the implementation will remove:

- `app/javascript/components/ui`;
- `components.json`;
- shadcn-only utility code;
- shadcn CSS variables and Radix animation rules;
- `radix-ui`;
- `sonner`;
- `next-themes` if no non-Astryx consumer remains;
- `class-variance-authority` if no non-Astryx consumer remains;
- `tailwind-merge` and `clsx` if no permitted consumer remains;
- `tw-animate-css` if no permitted consumer remains;
- any other dependency proven unused after a repository-wide import scan.

`lucide-react` may remain only if required by the neutral theme or directly
required by Astryx APIs. Direct application icon usage will follow Astryx icon
conventions rather than the legacy icon wrapper.

## Verification

Verification is required after the coordinated conversion:

1. Run TypeScript checks.
2. Run ESLint with zero warnings.
3. Run Prettier validation.
4. Run the production Vite build.
5. Run the Rails test suite.
6. Run repository-wide scans proving there are no imports from
   `@/components/ui`, `radix-ui`, `sonner`, or other removed packages.
7. Run repository-wide scans for forbidden layout markup, inline styles,
   arbitrary Tailwind values, raw colors, `@apply`, and new local CSS.
8. Exercise the application in a browser at desktop and mobile viewport sizes.
9. Verify public pages, authentication forms, dashboard, every settings page,
   account menu, sidebar navigation, mobile navigation, flash messages, and the
   destructive dialog.
10. Verify light, dark, and system mode, including persistence and OS preference
    changes.
11. Verify keyboard navigation, focus restoration, visible focus, error states,
    loading states, empty states, and duplicate-submission prevention.

## Acceptance Criteria

The migration is complete when:

- all existing user-facing routes render and retain their current behavior;
- every user-facing UI surface is composed from Astryx components and approved
  token-backed utilities;
- the neutral Astryx theme works in light, dark, and system mode;
- the authenticated shell is responsive and keyboard accessible;
- all forms submit the same payloads and display server validation correctly;
- flash feedback and destructive confirmations use native Astryx behavior;
- no shadcn configuration, component source, import, or unused dependency
  remains;
- the full verification suite passes;
- the working tree contains only intentional migration changes.

## Risks and Mitigations

### CSS cascade conflict

An incorrect Tailwind/Astryx layer order can silently remove component padding
or borders. Mitigation: establish the canonical layer order first and run the
foundation smoke assertion before converting pages.

### API assumptions

Astryx APIs differ from shadcn and may change while the package is young.
Mitigation: query the installed 0.1.8 CLI for every component immediately before
implementation and do not infer props.

### Large coordinated change

The selected big-bang strategy increases regression surface. Mitigation:
organize work internally by root, shell, shared primitives, and page families;
run focused checks after each internal step even though the final delivery is a
single Astryx-native change.

### Inertia integration

Design-system navigation and form APIs may not accept Inertia objects directly.
Mitigation: keep Inertia as the state and navigation owner, use documented
render/handler extension points, and avoid compatibility wrappers that reproduce
shadcn APIs.

### Theme flash during startup

Moving from direct class manipulation to the Astryx provider can introduce a
first-paint mismatch. Mitigation: use the pre-built neutral theme CSS and retain
the earliest safe initialization of the saved mode before the React tree becomes
interactive.
