import { Icon } from "@astryxdesign/core/Icon"
import { NavIcon } from "@astryxdesign/core/NavIcon"
import {
  SideNav,
  SideNavCollapseButton,
  SideNavHeading,
} from "@astryxdesign/core/SideNav"
import { usePage } from "@inertiajs/react"
import { useState } from "react"

import AppLogoIcon from "@/components/app-logo-icon"
import {
  PrimaryNavigation,
  ResourceNavigation,
} from "@/components/app-navigation"
import { UserMenuContent } from "@/components/user-menu-content"
import * as storage from "@/lib/storage"
import { dashboard } from "@/routes"

export function AppSidebar() {
  const { auth } = usePage().props
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
        <SideNavHeading
          icon={<NavIcon icon={<Icon icon={AppLogoIcon} size="sm" />} />}
          heading={import.meta.env.VITE_APP_NAME ?? "React Starter Kit"}
          headingHref={dashboard.index().url}
        />
      }
      footerIcons={
        <>
          <SideNavCollapseButton label="Collapse navigation" />
          <UserMenuContent auth={auth} />
        </>
      }
      collapsible={{
        isCollapsed,
        onCollapsedChange: handleCollapsedChange,
        hasButton: false,
      }}
    >
      <PrimaryNavigation />
      <ResourceNavigation />
    </SideNav>
  )
}
