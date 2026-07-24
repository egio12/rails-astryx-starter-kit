import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { HStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head } from "@inertiajs/react"
import { useState } from "react"

import TextLink from "@/components/text-link"
import AuthLayout from "@/layouts/auth-layout"
import { astryxStatus } from "@/lib/astryx"
import { identityPasswordResets, sessions, users } from "@/routes"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your email and password below to log in"
    >
      <Head title="Log in" />
      <Form action={sessions.create()} onSuccess={() => setPassword("")}>
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
              autoComplete="email"
              placeholder="email@example.com"
              status={astryxStatus(errors.email)}
              width="100%"
            />
            <HStack justify="end">
              <TextLink href={identityPasswordResets.new().url} isStandalone>
                Forgot password?
              </TextLink>
            </HStack>
            <TextInput
              label="Password"
              type="password"
              htmlName="password"
              value={password}
              onChange={setPassword}
              isRequired
              autoComplete="current-password"
              placeholder="Password"
              status={astryxStatus(errors.password)}
              width="100%"
            />
            <Button
              type="submit"
              label="Log in"
              variant="primary"
              width="100%"
              isLoading={processing}
            />
            <Text type="supporting" as="p" justify="center">
              Don&apos;t have an account?{" "}
              <TextLink href={users.new().url}>Sign up</TextLink>
            </Text>
          </FormLayout>
        )}
      </Form>
    </AuthLayout>
  )
}
