import { VStack } from "@astryxdesign/core/Layout"
import { Section } from "@astryxdesign/core/Section"
import { Head } from "@inertiajs/react"

import AppearanceControl from "@/components/appearance-control"
import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { settingsAppearance } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Appearance settings",
    href: settingsAppearance().url,
  },
]

export default function Appearance() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <Section>
          <VStack gap={4}>
            <PageHeading
              title="Appearance settings"
              description="Update your account's appearance settings"
            />
            <AppearanceControl />
          </VStack>
        </Section>
      </SettingsLayout>
    </AppLayout>
  )
}
