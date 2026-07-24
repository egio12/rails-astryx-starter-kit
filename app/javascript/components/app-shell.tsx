import { AppShell as AstryxAppShell } from "@astryxdesign/core/AppShell"

import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import type { BreadcrumbItem } from "@/types"

interface AppShellProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export function AppShell({ children, breadcrumbs = [] }: AppShellProps) {
  return (
    <AstryxAppShell
      variant="elevated"
      height="fill"
      contentPadding={0}
      sideNav={<AppSidebar />}
      mobileNav={{ breakpoint: "md" }}
    >
      <AppHeader breadcrumbs={breadcrumbs} />
      {children}
    </AstryxAppShell>
  )
}
