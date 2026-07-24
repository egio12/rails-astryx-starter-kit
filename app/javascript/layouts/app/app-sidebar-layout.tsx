import type { PropsWithChildren } from "react"

import { AppShell } from "@/components/app-shell"
import type { BreadcrumbItem } from "@/types"

export default function AppSidebarLayout({
  children,
  breadcrumbs = [],
}: PropsWithChildren<{
  breadcrumbs?: BreadcrumbItem[]
}>) {
  return <AppShell breadcrumbs={breadcrumbs}>{children}</AppShell>
}
