import { Banner } from "@astryxdesign/core/Banner"
import { Button } from "@astryxdesign/core/Button"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from "@astryxdesign/core/Layout"
import { Heading, Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useForm } from "@inertiajs/react"
import { type FormEvent, useRef, useState } from "react"

import { astryxStatus } from "@/lib/astryx"
import { users } from "@/routes"

export default function DeleteUser() {
  const [isOpen, setIsOpen] = useState(false)
  const deletion = useForm({ password_challenge: "" })
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const closeDeletion = () => {
    deletion.reset()
    deletion.clearErrors()
    setIsOpen(false)
  }

  const updateDeletionOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsOpen(true)
    } else {
      closeDeletion()
    }
  }

  const submitDeletion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    deletion.delete(users.destroy().url, {
      preserveScroll: true,
      onSuccess: closeDeletion,
      onError: () => passwordInputRef.current?.focus(),
    })
  }

  return (
    <>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>Delete account</Heading>
          <Text type="supporting" color="secondary">
            Delete your account and all of its resources
          </Text>
        </VStack>

        <Banner
          status="error"
          title="Warning"
          description="Please proceed with caution, this cannot be undone."
          endContent={
            <Button
              label="Delete account"
              variant="destructive"
              onClick={() => updateDeletionOpen(true)}
            />
          }
        />
      </VStack>

      <Dialog
        isOpen={isOpen}
        onOpenChange={updateDeletionOpen}
        purpose="form"
        width={480}
      >
        <form onSubmit={submitDeletion} noValidate>
          <Layout
            header={
              <DialogHeader
                title="Delete account?"
                subtitle="This action cannot be undone."
                onOpenChange={updateDeletionOpen}
              />
            }
            content={
              <LayoutContent>
                <VStack gap={4}>
                  <Text type="body" as="p">
                    Enter your password to permanently delete your account and
                    all associated data.
                  </Text>
                  <TextInput
                    label="Password"
                    type="password"
                    ref={passwordInputRef}
                    value={deletion.data.password_challenge}
                    onChange={(value) =>
                      deletion.setData("password_challenge", value)
                    }
                    status={astryxStatus(deletion.errors.password_challenge)}
                    isRequired
                    hasAutoFocus
                    autoComplete="current-password"
                  />
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack gap={2} hAlign="end">
                  <Button
                    type="button"
                    label="Cancel"
                    variant="secondary"
                    onClick={closeDeletion}
                  />
                  <Button
                    type="submit"
                    label="Delete account"
                    variant="destructive"
                    isDisabled={!deletion.data.password_challenge}
                    isLoading={deletion.processing}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </form>
      </Dialog>
    </>
  )
}
