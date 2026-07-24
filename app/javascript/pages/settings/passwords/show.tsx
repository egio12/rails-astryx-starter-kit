import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head } from "@inertiajs/react"
import { useState } from "react"

import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { astryxStatus } from "@/lib/astryx"
import { settingsPasswords } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Password settings",
    href: settingsPasswords.show().url,
  },
]

export default function Password() {
  const [passwordChallenge, setPasswordChallenge] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const clearPasswords = () => {
    setPasswordChallenge("")
    setPassword("")
    setPasswordConfirmation("")
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <VStack gap={6}>
          <PageHeading
            title="Update password"
            description="Ensure your account is using a long, random password to stay secure"
          />

          <Form
            action={settingsPasswords.update()}
            options={{
              preserveScroll: true,
            }}
            onSuccess={clearPasswords}
            onError={clearPasswords}
          >
            {({ errors, processing, recentlySuccessful }) => (
              <FormLayout>
                <TextInput
                  label="Current password"
                  type="password"
                  htmlName="password_challenge"
                  value={passwordChallenge}
                  onChange={setPasswordChallenge}
                  isRequired
                  autoComplete="current-password"
                  placeholder="Current password"
                  status={astryxStatus(errors.password_challenge)}
                />
                <TextInput
                  label="New password"
                  type="password"
                  htmlName="password"
                  value={password}
                  onChange={setPassword}
                  isRequired
                  autoComplete="new-password"
                  placeholder="New password"
                  status={astryxStatus(errors.password)}
                />
                <TextInput
                  label="Confirm password"
                  type="password"
                  htmlName="password_confirmation"
                  value={passwordConfirmation}
                  onChange={setPasswordConfirmation}
                  isRequired
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  status={astryxStatus(errors.password_confirmation)}
                />
                <HStack gap={4} vAlign="center">
                  <Button
                    type="submit"
                    label="Save password"
                    variant="primary"
                    isLoading={processing}
                  />
                  {recentlySuccessful && <Text type="supporting">Saved</Text>}
                </HStack>
              </FormLayout>
            )}
          </Form>
        </VStack>
      </SettingsLayout>
    </AppLayout>
  )
}
