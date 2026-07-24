export * from "@/types/serializers"

export interface BreadcrumbItem {
  title: string
  href: string
}

export interface NavItem {
  title: string
  href: string
  isActive?: boolean
}

export interface FlashData {
  alert?: string
  notice?: string
}
