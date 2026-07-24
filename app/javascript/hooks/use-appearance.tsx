import {
  type PropsWithChildren,
  createContext,
  use,
  useCallback,
  useState,
} from "react"

import { isBrowser } from "@/lib/browser"
import * as storage from "@/lib/storage"

export type Appearance = "light" | "dark" | "system"

interface AppearanceContextValue {
  appearance: Appearance
  updateAppearance: (appearance: Appearance) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

function isAppearance(value: string | null): value is Appearance {
  return value === "light" || value === "dark" || value === "system"
}

function readAppearance(): Appearance {
  const savedAppearance = storage.getItem("appearance")
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
    storage.removeItem("appearance")
  } else {
    storage.setItem("appearance", appearance)
  }
}

export function initializeTheme() {
  syncDocumentAppearance(readAppearance())
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance)

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
