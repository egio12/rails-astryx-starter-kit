import type { PropsWithChildren } from "react"

import { AstryxProvider } from "@/providers/astryx-provider"
import { UnsavedChangesProvider } from "@/providers/unsaved-changes-provider"

export default function PersistentLayout({ children }: PropsWithChildren) {
  return (
    <AstryxProvider>
      <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
    </AstryxProvider>
  )
}
