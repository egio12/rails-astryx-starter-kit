import type { PropsWithChildren } from "react"

import { AstryxProvider } from "@/providers/astryx-provider"

export default function PersistentLayout({ children }: PropsWithChildren) {
  return <AstryxProvider>{children}</AstryxProvider>
}
