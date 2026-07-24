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
