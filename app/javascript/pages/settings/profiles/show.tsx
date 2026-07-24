import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head, usePage } from "@inertiajs/react"
import { useState } from "react"

import DeleteUser from "@/components/delete-user"
import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { astryxStatus } from "@/lib/astryx"
import { settingsProfiles } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Profile settings",
    href: settingsProfiles.show().url,
  },
]

export default function Profile() {
  const { auth } = usePage().props
  const [name, setName] = useState(auth.user.name)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <VStack gap={6}>
          <PageHeading
            title="Profile information"
            description="Update your name"
          />

          <Form
            action={settingsProfiles.update()}
            options={{
              preserveScroll: true,
            }}
          >
            {({ errors, processing, recentlySuccessful }) => (
              <FormLayout>
                <TextInput
                  label="Name"
                  htmlName="name"
                  value={name}
                  onChange={setName}
                  isRequired
                  autoComplete="name"
                  placeholder="Full name"
                  status={astryxStatus(errors.name)}
                />
                <HStack gap={4} vAlign="center">
                  <Button
                    type="submit"
                    label="Save"
                    variant="primary"
                    isLoading={processing}
                  />
                  {recentlySuccessful && <Text type="supporting">Saved</Text>}
                </HStack>
              </FormLayout>
            )}
          </Form>

          <DeleteUser />
        </VStack>
      </SettingsLayout>
    </AppLayout>
  )
}
