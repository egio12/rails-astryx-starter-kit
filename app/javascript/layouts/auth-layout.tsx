import type { ReactNode } from "react"

import AuthSimpleLayout from "@/layouts/auth/auth-simple-layout"

export default function AuthLayout({
  children,
  title,
  description,
  ...props
}: {
  children: ReactNode
  title: string
  description: string
}) {
  return (
    <AuthSimpleLayout title={title} description={description} {...props}>
      {children}
    </AuthSimpleLayout>
  )
}
