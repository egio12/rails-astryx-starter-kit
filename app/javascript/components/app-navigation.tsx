import { SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav"
import { usePage } from "@inertiajs/react"
import { BookOpen, Folder, LayoutGrid } from "lucide-react"
import { type ComponentPropsWithoutRef, forwardRef } from "react"

import { AppLink } from "@/components/inertia-link"
import { dashboard } from "@/routes"

const primaryNavigation = [
  {
    label: "Dashboard",
    href: dashboard.index().url,
    icon: LayoutGrid,
  },
]

const resourceNavigation = [
  {
    label: "Repository",
    href: "https://github.com/inertia-rails/react-starter-kit",
    icon: Folder,
  },
  {
    label: "Documentation",
    href: "https://inertia-rails.dev",
    icon: BookOpen,
  },
]

const ExternalLink = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<typeof AppLink>
>(function ExternalLink(props, ref) {
  return (
    <AppLink ref={ref} target="_blank" rel="noopener noreferrer" {...props} />
  )
})

export function PrimaryNavigation() {
  const { url } = usePage()

  return (
    <SideNavSection title="Application" isHeaderHidden>
      {primaryNavigation.map((item) => (
        <SideNavItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          isSelected={url.startsWith(item.href)}
        />
      ))}
    </SideNavSection>
  )
}

export function ResourceNavigation() {
  return (
    <SideNavSection title="Resources">
      {resourceNavigation.map((item) => (
        <SideNavItem
          key={item.href}
          as={ExternalLink}
          label={item.label}
          href={item.href}
          icon={item.icon}
        />
      ))}
    </SideNavSection>
  )
}

export function AppNavigation() {
  return (
    <>
      <PrimaryNavigation />
      <ResourceNavigation />
    </>
  )
}
