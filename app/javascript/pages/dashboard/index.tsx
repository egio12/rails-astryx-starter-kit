import { Card } from "@astryxdesign/core/Card"
import { Grid } from "@astryxdesign/core/Grid"
import { VStack } from "@astryxdesign/core/Layout"
import { Section } from "@astryxdesign/core/Section"
import { Heading, Text } from "@astryxdesign/core/Text"
import { Head } from "@inertiajs/react"

import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import { dashboard } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: dashboard.index().url,
  },
]

const starterWidgets = [
  "Workspace overview",
  "Recent activity",
  "Next steps",
]

export default function Dashboard() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <Section variant="transparent" padding={4} width="100%">
        <VStack gap={6}>
          <PageHeading
            title="Dashboard"
            description="An overview of your workspace."
          />

          <VStack gap={4}>
            <Heading level={2}>Starter widgets</Heading>
            <Grid columns={{ minWidth: 280, max: 3 }} gap={4}>
              {starterWidgets.map((title) => (
                <Card key={title} padding={4}>
                  <VStack gap={2}>
                    <Heading level={3}>{title}</Heading>
                    <Text color="secondary">
                      Replace this content with an application-specific metric.
                    </Text>
                  </VStack>
                </Card>
              ))}
            </Grid>
          </VStack>

          <Section>
            <VStack gap={2}>
              <Heading level={2}>Primary content</Heading>
              <Text color="secondary">
                Add your most important workspace information here.
              </Text>
            </VStack>
          </Section>
        </VStack>
      </Section>
    </AppLayout>
  )
}
