import { Toolbar } from "@astryxdesign/core/Toolbar"

import { Breadcrumbs } from "@/components/breadcrumbs"
import type { BreadcrumbItem } from "@/types"

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  if (breadcrumbs.length === 0) return null

  return (
    <Toolbar
      label="Page context"
      size="sm"
      dividers={["bottom"]}
      startContent={<Breadcrumbs breadcrumbs={breadcrumbs} />}
    />
  )
}
