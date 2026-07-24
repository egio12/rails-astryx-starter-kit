import {
  BreadcrumbItem,
  Breadcrumbs as AstryxBreadcrumbs,
} from "@astryxdesign/core/Breadcrumbs"

import type { BreadcrumbItem as BreadcrumbItemType } from "@/types"

export function Breadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs: BreadcrumbItemType[]
}) {
  if (breadcrumbs.length === 0) return null

  return (
    <AstryxBreadcrumbs variant="supporting">
      {breadcrumbs.map((item, index) => {
        const isCurrent = index === breadcrumbs.length - 1

        return (
          <BreadcrumbItem
            key={item.href}
            href={isCurrent ? undefined : item.href}
            isCurrent={isCurrent}
          >
            {item.title}
          </BreadcrumbItem>
        )
      })}
    </AstryxBreadcrumbs>
  )
}
