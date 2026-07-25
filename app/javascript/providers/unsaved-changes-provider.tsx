import { router } from "@inertiajs/react"
import {
  type PropsWithChildren,
  createContext,
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

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
)

export function UnsavedChangesProvider({ children }: PropsWithChildren) {
  const [dirtyRegistrations, setDirtyRegistrations] = useState<
    ReadonlySet<string>
  >(() => new Set())

  const updateRegistration = useCallback((id: string, isDirty: boolean) => {
    setDirtyRegistrations((current) => {
      if (current.has(id) === isDirty) return current

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

  const value = useMemo(() => ({ updateRegistration }), [updateRegistration])

  return <UnsavedChangesContext value={value}>{children}</UnsavedChangesContext>
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
