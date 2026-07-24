import { Button } from "@astryxdesign/core/Button"
import { FormLayout } from "@astryxdesign/core/FormLayout"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Form, Head } from "@inertiajs/react"
import { useState } from "react"

import AuthLayout from "@/layouts/auth-layout"
import { astryxStatus } from "@/lib/astryx"
import { identityPasswordResets } from "@/routes"

interface ResetPasswordProps {
  sid: string
  email: string
}

export default function ResetPassword({ sid, email }: ResetPasswordProps) {
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const clearPasswords = () => {
    setPassword("")
    setPasswordConfirmation("")
  }

  return (
    <AuthLayout
      title="Reset password"
      description="Please enter your new password below"
    >
      <Head title="Reset password" />
      <Form
        action={identityPasswordResets.update()}
        transform={(data) => ({ ...data, sid, email })}
        onSuccess={clearPasswords}
      >
        {({ processing, errors }) => (
          <FormLayout>
            <TextInput
              label="Email"
              type="email"
              htmlName="email"
              value={email}
              onChange={() => undefined}
              isRequired
              isDisabled
              disabledMessage="This email came from your password reset link."
              autoComplete="email"
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
              hasAutoFocus
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
              label="Reset password"
              variant="primary"
              width="100%"
              isLoading={processing}
            />
          </FormLayout>
        )}
      </Form>
    </AuthLayout>
  )
}
