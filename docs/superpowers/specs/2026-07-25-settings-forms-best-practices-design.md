# Settings Forms Best-Practices Design

## Goal

Bring the Settings forms in line with the supported Inertia.js 3.6.1 and
React 19.2 patterns identified in the audit, without duplicating navigation
guard logic across pages.

## Scope

This change covers three focused improvements:

1. Move avatar object-URL allocation out of `useMemo` and into an effect with
   matching cleanup.
2. Protect dirty forms during normal Inertia visits and full browser unloads
   through one project-wide mechanism.
3. Make the account-deletion interaction a semantic HTML form.

It does not change validation rules, controller behavior, form copy, routes,
or visual styling.

## Shared Unsaved-Changes Guard

Add a persistent provider mounted from the application's persistent layout.
The provider owns the only global listeners:

- `router.on("before", ...)` for cancellable Inertia visits.
- `window.addEventListener("beforeunload", ...)` for refreshes, tab closes,
  and other full-page unloads.

Pages register their dirty state through a small hook. The hook exposes no
navigation implementation details; consumers only provide whether they have
pending changes. The provider keeps a registry so multiple forms can
participate without installing duplicate listeners or clearing another
form's state when one consumer unmounts.

When at least one registration is dirty:

- A normal Inertia visit uses the browser's synchronous `window.confirm`.
- Rejecting the confirmation cancels the visit by returning `false` from the
  official Inertia `before` listener.
- Accepting it allows the original visit to continue unchanged.
- A full unload calls `preventDefault()` on `beforeunload`, allowing the
  browser to show its required native warning.

The prompt copy is centralized in the provider. Clean forms do not install an
active guard.

Inertia documents that native `popstate` cannot be cancelled. Therefore,
browser back/forward navigation cannot be guarded through a supported Inertia
API. This design deliberately does not add a history workaround.

## Profile Avatar Preview

Replace render-time `URL.createObjectURL` work with a focused object-URL hook.
The hook:

- returns no URL when no file is selected;
- creates the URL in an effect after the file changes;
- stores the current preview URL in state;
- revokes that exact URL in the effect cleanup before replacement or unmount.

This keeps render and `useMemo` calculations pure under React Strict Mode.
The existing preview precedence remains unchanged: pending upload, armed
removal, then stored avatar.

The profile page registers `form.isDirty` with the shared unsaved-changes
guard and removes its page-local `beforeunload` effect.

## Account Deletion

Wrap the deletion dialog's layout in a native `<form>` with `onSubmit`.
The destructive button becomes `type="submit"` and the cancel button remains
`type="button"`. Submission prevents the browser default and calls the
existing Inertia `useForm().delete(...)` request.

This preserves the current reset, error, focus, processing, and confirmation
behavior while adding native keyboard submission and form semantics.

## Error Handling and Accessibility

- Existing server-side Inertia errors remain authoritative.
- The deletion password field retains its error status and error-focus
  behavior.
- The unsaved-changes confirmation uses the browser dialog documented by
  Inertia, so no custom focus management is required.
- The `beforeunload` warning text remains browser-controlled, as required by
  modern browsers.

## Testing

Use test-driven changes with the existing Rails system-test stack:

- A dirty profile cancels an Inertia navigation when the user dismisses the
  confirmation.
- A dirty profile completes the original Inertia navigation when the user
  accepts the confirmation.
- A clean profile navigates without a confirmation.
- Pressing Enter in the deletion password field submits the deletion form.
- Existing avatar upload, removal, preview, and rebaseline tests remain green.

Run the focused Settings request/system specs, TypeScript checking, ESLint,
and the complete relevant verification set before completion.

## Documentation Consulted

- Inertia.js v3 Events: cancellable `before` events, listener cleanup, and the
  native `popstate` limitation.
- Inertia.js v3 Manual Visits and the installed `@inertiajs/react` 3.6.1
  types/source.
- React 19.2 `useMemo`, `useEffect`, and Strict Mode guidance.
- Astryx 0.1.8 CLI documentation for `AlertDialog`, `Dialog`, `TextInput`,
  `FileInput`, `FormLayout`, and `Button`.
