import { AppShell as AstryxAppShell } from "@astryxdesign/core/AppShell"
import { MobileNav } from "@astryxdesign/core/MobileNav"

import { AppHeader } from "@/components/app-header"
import AppLogo from "@/components/app-logo"
import { AppNavigation } from "@/components/app-navigation"
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
      topNav={<AppHeader breadcrumbs={breadcrumbs} />}
      sideNav={<AppSidebar />}
      mobileNav={
        <MobileNav
          header={<AppLogo />}
          label="Application navigation"
          side="start"
        >
          <AppNavigation />
        </MobileNav>
      }
    >
      {children}
    </AstryxAppShell>
  )
}
