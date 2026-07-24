import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head } from "@inertiajs/react"
import { useState } from "react"

import TextLink from "@/components/text-link"
import AuthLayout from "@/layouts/auth-layout"
import { astryxStatus } from "@/lib/astryx"
import { sessions, users } from "@/routes"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const clearPasswords = () => {
    setPassword("")
    setPasswordConfirmation("")
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Enter your details below to create your account"
    >
      <Head title="Register" />
      <Form
        action={users.create()}
        disableWhileProcessing
        onSuccess={clearPasswords}
      >
        {({ processing, errors }) => (
          <FormLayout>
            <TextInput
              label="Name"
              htmlName="name"
              value={name}
              onChange={setName}
              isRequired
              hasAutoFocus
              autoComplete="name"
              isDisabled={processing}
              placeholder="Full name"
              status={astryxStatus(errors.name)}
              width="100%"
            />
            <TextInput
              label="Email address"
              type="email"
              htmlName="email"
              value={email}
              onChange={setEmail}
              isRequired
              autoComplete="email"
              placeholder="email@example.com"
              status={astryxStatus(errors.email)}
              width="100%"
            />
            <TextInput
              label="Password"
              type="password"
              htmlName="password"
              value={password}
              onChange={setPassword}
              isRequired
              autoComplete="new-password"
              placeholder="Password"
              status={astryxStatus(errors.password)}
              width="100%"
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
              width="100%"
            />
            <Button
              type="submit"
              label="Create account"
              variant="primary"
              width="100%"
              isLoading={processing}
            />
            <Text type="supporting" as="p" justify="center">
              Already have an account?{" "}
              <TextLink href={sessions.new().url}>Log in</TextLink>
            </Text>
          </FormLayout>
        )}
      </Form>
    </AuthLayout>
  )
}
