# Settings Forms Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Settings form lifecycle, navigation guarding, and deletion submission follow the supported Inertia.js 3.6.1 and React 19.2 patterns.

**Architecture:** A persistent `UnsavedChangesProvider` owns the single Inertia `before` listener and browser `beforeunload` listener. A `useUnsavedChanges` hook registers dirty forms by stable React ID. Avatar object URLs move to a focused effect-backed hook, and account deletion becomes a semantic HTML form.

**Tech Stack:** Rails 8.1 system tests with RSpec/Capybara and headless Chrome, React 19.2.8, TypeScript 6, `@inertiajs/react` 3.6.1, Astryx 0.1.8.

## Global Constraints

- Use only documented Inertia.js events and browser APIs.
- Guard GET visits; never prompt for POST, PUT, PATCH, or DELETE form submissions.
- Keep one project-wide navigation listener and one project-wide unload listener.
- Do not attempt to cancel browser back/forward navigation; Inertia documents native `popstate` as non-cancellable.
- Keep server-side validation authoritative.
- Use Astryx components for layout and controls; add no custom CSS or raw layout elements.
- Run browser verification with headless Chrome.

---

### Task 1: Shared Unsaved-Changes Guard

**Files:**
- Create: `app/javascript/providers/unsaved-changes-provider.tsx`
- Modify: `app/javascript/layouts/persistent-layout.tsx`
- Modify: `app/javascript/pages/settings/profiles/show.tsx`
- Test: `spec/system/profile_avatar_spec.rb`

**Interfaces:**
- Produces: `UnsavedChangesProvider({ children }: PropsWithChildren)`
- Produces: `useUnsavedChanges(isDirty: boolean): void`
- Consumes: `router.on("before", callback)` from `@inertiajs/react`
- Consumes: `form.isDirty` from the profile page's Inertia `useForm`

- [ ] **Step 1: Add failing system tests for guarded and unguarded visits**

Add these examples to `spec/system/profile_avatar_spec.rb`:

```ruby
it "keeps a dirty profile in place when navigation is cancelled" do
  visit settings_profile_path
  fill_in "Name", with: "Unsaved name"

  dismiss_confirm("You have unsaved changes. Leave this page and discard them?") do
    find_link("Email", href: settings_email_path).click
  end

  expect(page).to have_current_path(settings_profile_path)
  expect(page).to have_field("Name", with: "Unsaved name")
end

it "allows a dirty profile to navigate after confirmation" do
  visit settings_profile_path
  fill_in "Name", with: "Unsaved name"

  accept_confirm("You have unsaved changes. Leave this page and discard them?") do
    find_link("Email", href: settings_email_path).click
  end

  expect(page).to have_current_path(settings_email_path)
end

it "navigates from a clean profile without confirmation" do
  visit settings_profile_path
  find_link("Email", href: settings_email_path).click

  expect(page).to have_current_path(settings_email_path)
end

it "saves a dirty profile without a discard confirmation" do
  visit settings_profile_path
  fill_in "Name", with: "Saved without prompting"
  click_on "Save"

  expect(page).to have_current_path(settings_profile_path)
  expect(page).to have_text("Your profile has been updated")
  expect(user.reload.name).to eq("Saved without prompting")
end
```

- [ ] **Step 2: Run the new navigation examples and verify RED**

Run:

```bash
bin/rspec spec/system/profile_avatar_spec.rb
```

Expected: the two confirmation examples fail because no browser confirmation
is present. The save example remains green and protects the non-GET behavior.

- [ ] **Step 3: Implement the provider and hook**

Create `app/javascript/providers/unsaved-changes-provider.tsx`:

```tsx
import { router } from "@inertiajs/react"
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"

const CONFIRM_DISCARD_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?"

interface UnsavedChangesContextValue {
  updateRegistration: (id: string, isDirty: boolean) => void
}

const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null)

export function UnsavedChangesProvider({ children }: PropsWithChildren) {
  const [dirtyRegistrations, setDirtyRegistrations] = useState<
    ReadonlySet<string>
  >(() => new Set())

  const updateRegistration = useCallback((id: string, isDirty: boolean) => {
    setDirtyRegistrations((current) => {
      const next = new Set(current)

      if (isDirty) {
        next.add(id)
      } else {
        next.delete(id)
      }

      return next
    })
  }, [])

  const hasUnsavedChanges = dirtyRegistrations.size > 0

  useEffect(() => {
    if (!hasUnsavedChanges) return

    return router.on("before", (event) => {
      if (event.detail.visit.method !== "get") return

      return window.confirm(CONFIRM_DISCARD_MESSAGE)
    })
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!hasUnsavedChanges) return

    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", preventUnload)
    return () => window.removeEventListener("beforeunload", preventUnload)
  }, [hasUnsavedChanges])

  const value = useMemo(
    () => ({ updateRegistration }),
    [updateRegistration],
  )

  return (
    <UnsavedChangesContext value={value}>
      {children}
    </UnsavedChangesContext>
  )
}

export function useUnsavedChanges(isDirty: boolean) {
  const context = useContext(UnsavedChangesContext)
  const id = useId()

  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used inside UnsavedChangesProvider",
    )
  }

  const { updateRegistration } = context

  useEffect(() => {
    updateRegistration(id, isDirty)
    return () => updateRegistration(id, false)
  }, [id, isDirty, updateRegistration])
}
```

Use React 19's provider shorthand, matching the installed version.

- [ ] **Step 4: Mount the provider once**

Update `app/javascript/layouts/persistent-layout.tsx` so the persistent tree is:

```tsx
return (
  <AstryxProvider>
    <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
  </AstryxProvider>
)
```

Import `UnsavedChangesProvider` from
`@/providers/unsaved-changes-provider`.

- [ ] **Step 5: Register the profile form and remove its local unload effect**

In `app/javascript/pages/settings/profiles/show.tsx`:

```tsx
import { useUnsavedChanges } from "@/providers/unsaved-changes-provider"
```

After creating the Inertia form:

```tsx
useUnsavedChanges(form.isDirty)
```

Remove the page-local `beforeunload` effect. Keep the preview cleanup effect
until Task 2 replaces it.

- [ ] **Step 6: Run the focused system spec and verify GREEN**

Run:

```bash
bin/rspec spec/system/profile_avatar_spec.rb
```

Expected: all examples pass; GET navigation prompts, cancellation preserves
the profile form, confirmation navigates, and PATCH save does not prompt.

- [ ] **Step 7: Commit the shared guard**

```bash
git add app/javascript/providers/unsaved-changes-provider.tsx \
  app/javascript/layouts/persistent-layout.tsx \
  app/javascript/pages/settings/profiles/show.tsx \
  spec/system/profile_avatar_spec.rb
git commit -m "feat: guard unsaved inertia forms"
```

### Task 2: Effect-Backed Avatar Object URL

**Files:**
- Create: `app/javascript/hooks/use-object-url.ts`
- Modify: `app/javascript/pages/settings/profiles/show.tsx`
- Test: `spec/system/profile_avatar_spec.rb`

**Interfaces:**
- Produces: `useObjectUrl(file: File | null): string | null`
- Consumes: the profile form's `avatar: File | null`

- [ ] **Step 1: Add browser instrumentation that exposes leaked object URLs**

Add this example to `spec/system/profile_avatar_spec.rb`:

```ruby
it "revokes every temporary avatar preview URL" do
  visit settings_profile_path
  page.execute_script(<<~JS)
    window.objectUrlMetrics = { created: 0, revoked: 0 }
    window.originalCreateObjectURL = URL.createObjectURL.bind(URL)
    window.originalRevokeObjectURL = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (...args) => {
      window.objectUrlMetrics.created += 1
      return window.originalCreateObjectURL(...args)
    }
    URL.revokeObjectURL = (...args) => {
      window.objectUrlMetrics.revoked += 1
      return window.originalRevokeObjectURL(...args)
    }
  JS

  attach_avatar
  click_on "Remove photo"

  metrics = page.evaluate_script("window.objectUrlMetrics")
  expect(metrics.fetch("created")).to eq(metrics.fetch("revoked"))
ensure
  page.execute_script(<<~JS)
    if (window.originalCreateObjectURL) {
      URL.createObjectURL = window.originalCreateObjectURL
      URL.revokeObjectURL = window.originalRevokeObjectURL
      delete window.originalCreateObjectURL
      delete window.originalRevokeObjectURL
      delete window.objectUrlMetrics
    }
  JS
end
```

- [ ] **Step 2: Run the lifecycle example and verify RED**

Run:

```bash
bin/rspec spec/system/profile_avatar_spec.rb \
  --example "revokes every temporary avatar preview URL"
```

Expected in the React Strict Mode development build: FAIL because the
render-time `useMemo` calculation creates an extra object URL whose value is
discarded and never reaches the cleanup effect.

If the installed test build does not double-invoke the calculation, retain
the test as lifecycle coverage and use the React purity rule plus the exact
installed source behavior as the refactoring oracle; do not add a test-only
production branch.

- [ ] **Step 3: Implement the object-URL hook**

Create `app/javascript/hooks/use-object-url.ts`:

```ts
import { useEffect, useState } from "react"

export function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)

    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return url
}
```

- [ ] **Step 4: Replace the render-time allocation**

In `app/javascript/pages/settings/profiles/show.tsx`:

- import `useObjectUrl` from `@/hooks/use-object-url`;
- remove `useMemo` and the preview cleanup `useEffect`;
- set `const preview = useObjectUrl(avatar)`.

Keep the remaining profile data flow unchanged.

- [ ] **Step 5: Run avatar system coverage and verify GREEN**

Run:

```bash
bin/rspec spec/system/profile_avatar_spec.rb
```

Expected: the lifecycle assertion and all existing avatar behavior pass.

- [ ] **Step 6: Commit the lifecycle fix**

```bash
git add app/javascript/hooks/use-object-url.ts \
  app/javascript/pages/settings/profiles/show.tsx \
  spec/system/profile_avatar_spec.rb
git commit -m "fix: manage avatar object url lifecycle"
```

### Task 3: Semantic Account-Deletion Form

**Files:**
- Modify: `app/javascript/components/delete-user.tsx`
- Test: `spec/system/astryx_ui_spec.rb`

**Interfaces:**
- Changes: `submitDeletion(event: FormEvent<HTMLFormElement>): void`
- Preserves: the existing `useForm().delete(...)` submission and error focus

- [ ] **Step 1: Add a failing keyboard-submission system test**

Add a dedicated example to `spec/system/astryx_ui_spec.rb`:

```ruby
it "submits account deletion with Enter from the password field" do
  user = users(:one)
  sign_in_as user
  visit settings_profile_path

  click_on "Delete account"
  fill_in "Password", with: AuthenticationHelpers::System::PASSWORD
  find_field("Password").send_keys(:enter)

  expect(page).to have_current_path(root_path)
  expect(page).to have_text("Your account has been deleted")
  expect(User.exists?(user.id)).to be(false)
end
```

- [ ] **Step 2: Run the example and verify RED**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb \
  --example "submits account deletion with Enter"
```

Expected: FAIL because the dialog has no native form and Enter does not invoke
the deletion request.

- [ ] **Step 3: Implement semantic form submission**

In `app/javascript/components/delete-user.tsx`:

```tsx
import { type FormEvent, useRef, useState } from "react"

const submitDeletion = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  deletion.delete(users.destroy().url, {
    preserveScroll: true,
    onSuccess: closeDeletion,
    onError: () => passwordInput.current?.focus(),
  })
}
```

Wrap the existing dialog `Layout` in:

```tsx
<form onSubmit={submitDeletion} noValidate>
  <Layout ... />
</form>
```

Change the destructive action to:

```tsx
<Button
  type="submit"
  label="Delete account"
  variant="destructive"
  isDisabled={!deletion.data.password_challenge}
  isLoading={deletion.processing}
/>
```

Keep the Cancel button's default `type="button"` and remove the destructive
button's `onClick`.

- [ ] **Step 4: Run the focused example and verify GREEN**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb \
  --example "submits account deletion with Enter"
```

Expected: PASS, with redirect to root and user deletion confirmed.

- [ ] **Step 5: Run the complete Astryx system spec**

Run:

```bash
bin/rspec spec/system/astryx_ui_spec.rb
```

Expected: all examples pass.

- [ ] **Step 6: Commit the semantic form**

```bash
git add app/javascript/components/delete-user.tsx \
  spec/system/astryx_ui_spec.rb
git commit -m "fix: make account deletion a semantic form"
```

### Task 4: Full Verification

**Files:**
- Verify only

**Interfaces:**
- Confirms all Settings form changes work together.

- [ ] **Step 1: Run TypeScript and ESLint**

```bash
npm run check
npm run lint
```

Expected: both commands exit successfully with no warnings or errors.

- [ ] **Step 2: Run focused request and system specs**

```bash
bin/rspec spec/requests/settings \
  spec/system/profile_avatar_spec.rb \
  spec/system/astryx_ui_spec.rb
```

Expected: zero failures.

- [ ] **Step 3: Run formatting verification**

```bash
npm run format
```

Expected: all matched files use Prettier formatting.

- [ ] **Step 4: Inspect the final diff**

```bash
git status --short
git diff --check
git log -5 --oneline
```

Expected: no uncommitted implementation changes, no whitespace errors, and
the design plus three focused implementation commits are present.
