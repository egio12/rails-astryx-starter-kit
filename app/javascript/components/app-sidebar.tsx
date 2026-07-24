import { SideNav } from "@astryxdesign/core/SideNav"
import { useState } from "react"

import AppLogo from "@/components/app-logo"
import {
  PrimaryNavigation,
  ResourceNavigation,
} from "@/components/app-navigation"
import { AppLink } from "@/components/inertia-link"
import * as storage from "@/lib/storage"
import { dashboard } from "@/routes"

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(
    () => storage.getItem("sidebar") === "false",
  )

  const handleCollapsedChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    storage.setItem("sidebar", String(!collapsed))
  }

  return (
    <SideNav
      header={
        <AppLink href={dashboard.index().url} aria-label="Dashboard">
          <AppLogo />
        </AppLink>
      }
      footer={<ResourceNavigation />}
      collapsible={{
        isCollapsed,
        onCollapsedChange: handleCollapsedChange,
        buttonLabel: "Collapse navigation",
      }}
    >
      <PrimaryNavigation />
    </SideNav>
  )
}
