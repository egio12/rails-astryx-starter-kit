import { Banner } from "@astryxdesign/core/Banner"
import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head, router, usePage } from "@inertiajs/react"
import { useState } from "react"

import { PageHeading } from "@/components/page-heading"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { astryxStatus } from "@/lib/astryx"
import { identityEmailVerifications, settingsEmails } from "@/routes"
import type { BreadcrumbItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Email settings",
    href: settingsEmails.show().url,
  },
]

export default function Email() {
  const { auth } = usePage().props
  const [email, setEmail] = useState(auth.user.email)
  const [passwordChallenge, setPasswordChallenge] = useState("")

  const clearPasswordChallenge = () => setPasswordChallenge("")

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <VStack gap={6}>
          <PageHeading
            title="Update email"
            description="Update your email address and verify it"
          />

          {!auth.user.verified && (
            <Banner
              status="warning"
              title="Your email address is unverified."
              description="Verify your email address to keep your account secure."
              endContent={
                <Button
                  label="Resend verification email"
                  variant="ghost"
                  onClick={() =>
                    router.post(identityEmailVerifications.create().url)
                  }
                />
              }
            />
          )}

          <Form
            action={settingsEmails.update()}
            options={{
              preserveScroll: true,
            }}
            onSuccess={clearPasswordChallenge}
            onError={clearPasswordChallenge}
          >
            {({ errors, processing, recentlySuccessful }) => (
              <FormLayout>
                <TextInput
                  label="Email address"
                  type="email"
                  htmlName="email"
                  value={email}
                  onChange={setEmail}
                  isRequired
                  autoComplete="username"
                  placeholder="Email address"
                  status={astryxStatus(errors.email)}
                />
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
        </VStack>
      </SettingsLayout>
    </AppLayout>
  )
}
