import { usePage } from "@inertiajs/react"
import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useState,
} from "react"

import { isBrowser } from "@/lib/browser"
import * as cookies from "@/lib/cookies"

export type Appearance = "light" | "dark" | "system"

interface AppearanceContextValue {
  appearance: Appearance
  updateAppearance: (appearance: Appearance) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function isAppearance(value: string | null): value is Appearance {
  return value === "light" || value === "dark" || value === "system"
}

// A cookie rather than localStorage: the server reads it to render SSR markup
// and the layout's data-theme with the mode the client will hydrate with.
function readAppearance(): Appearance {
  const savedAppearance = cookies.getCookie("appearance")
  return isAppearance(savedAppearance) ? savedAppearance : "system"
}

function syncDocumentAppearance(appearance: Appearance) {
  if (!isBrowser) return

  if (appearance === "system") {
    document.documentElement.removeAttribute("data-theme")
    document.documentElement.style.colorScheme = "light dark"
  } else {
    document.documentElement.setAttribute("data-theme", appearance)
    document.documentElement.style.colorScheme = appearance
  }
}

function persistAppearance(appearance: Appearance) {
  if (appearance === "system") {
    cookies.removeCookie("appearance")
  } else {
    cookies.setCookie("appearance", appearance)
  }
}

export function initializeTheme() {
  syncDocumentAppearance(readAppearance())
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const { appearance: sharedAppearance } = usePage().props
  const [appearance, setAppearance] = useState<Appearance>(() =>
    isBrowser ? readAppearance() : sharedAppearance,
  )

  const updateAppearance = useCallback((nextAppearance: Appearance) => {
    setAppearance(nextAppearance)
    persistAppearance(nextAppearance)
    syncDocumentAppearance(nextAppearance)
  }, [])

  return (
    <AppearanceContext value={{ appearance, updateAppearance }}>
      {children}
    </AppearanceContext>
  )
}

export function useAppearance() {
  const context = use(AppearanceContext)

  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider")
  }

  return context
}
