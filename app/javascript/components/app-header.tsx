import { LayoutHeader } from "@astryxdesign/core/Layout"

import { Breadcrumbs } from "@/components/breadcrumbs"
import type { BreadcrumbItem } from "@/types"

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  if (breadcrumbs.length === 0) return null

  return (
    <LayoutHeader hasDivider padding={2}>
      <Breadcrumbs breadcrumbs={breadcrumbs} />
    </LayoutHeader>
  )
}
