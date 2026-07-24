import { HStack } from "@astryxdesign/core/Layout"
import { MobileNavToggle } from "@astryxdesign/core/MobileNav"
import { TopNav } from "@astryxdesign/core/TopNav"
import { usePage } from "@inertiajs/react"

import { Breadcrumbs } from "@/components/breadcrumbs"
import { UserMenuContent } from "@/components/user-menu-content"
import type { BreadcrumbItem } from "@/types"

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const { auth } = usePage().props

  return (
    <TopNav
      label="Application navigation"
      heading={
        <HStack gap={2} align="center">
          <MobileNavToggle label="Open navigation" />
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </HStack>
      }
      endContent={<UserMenuContent auth={auth} />}
    />
  )
}
