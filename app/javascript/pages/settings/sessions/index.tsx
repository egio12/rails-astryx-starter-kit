import { Button } from "@astryxdesign/core/Button"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { List, ListItem } from "@astryxdesign/core/List"
import { StatusDot } from "@astryxdesign/core/StatusDot"
import { Heading, Text } from "@astryxdesign/core/Text"
import { Head, router, usePage } from "@inertiajs/react"

import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { sessions as sessionsRoutes, settingsSessions } from "@/routes"
import type { BreadcrumbItem, Session } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Sessions",
    href: settingsSessions.index().url,
  },
]

interface SessionsProps {
  sessions: Session[]
}

export default function Sessions({ sessions }: SessionsProps) {
  const { auth } = usePage().props

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <VStack gap={6}>
          <PageHeading
            title="Sessions"
            description="Manage your active sessions across devices"
          />

          <List
            hasDividers
            density="balanced"
            header={<Heading level={2}>Active sessions</Heading>}
          >
            {sessions.map((session) => {
              const isCurrentSession = session.id === auth.session.id

              return (
                <ListItem
                  key={session.id}
                  label={session.user_agent}
                  description={
                    <VStack gap={0.5}>
                      <Text type="supporting" as="p">
                        IP: {session.ip_address}
                      </Text>
                      <Text type="supporting" as="p">
                        Active since: {new Date(session.created_at).toLocaleString()}
                      </Text>
                    </VStack>
                  }
                  endContent={
                    isCurrentSession ? (
                      <HStack gap={1} vAlign="center">
                        <StatusDot variant="success" label="Current session" />
                        <Text type="supporting">Current</Text>
                      </HStack>
                    ) : (
                      <Button
                        label="Log out"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          router.delete(sessionsRoutes.destroy(session.id).url)
                        }
                      />
                    )
                  }
                />
              )
            })}
          </List>
        </VStack>
      </SettingsLayout>
    </AppLayout>
  )
}
