import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head } from "@inertiajs/react"
import { useState } from "react"

import TextLink from "@/components/text-link"
import AuthLayout from "@/layouts/auth-layout"
import { astryxStatus } from "@/lib/astryx"
import { identityPasswordResets, sessions } from "@/routes"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")

  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email to receive a password reset link"
    >
      <Head title="Forgot password" />
      <Form action={identityPasswordResets.create()}>
        {({ processing, errors }) => (
          <FormLayout>
            <TextInput
              label="Email address"
              type="email"
              htmlName="email"
              value={email}
              onChange={setEmail}
              isRequired
              hasAutoFocus
              autoComplete="off"
              placeholder="email@example.com"
              status={astryxStatus(errors.email)}
              width="100%"
            />
            <Button
              type="submit"
              label="Email password reset link"
              variant="primary"
              width="100%"
              isLoading={processing}
            />
            <Text type="supporting" as="p" justify="center">
              Or, return to{" "}
              <TextLink href={sessions.new().url}>log in</TextLink>
            </Text>
          </FormLayout>
        )}
      </Form>
    </AuthLayout>
  )
}
