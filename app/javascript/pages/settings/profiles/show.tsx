import { Avatar } from "@astryxdesign/core/Avatar"
import { Button } from "@astryxdesign/core/Button"
import { Divider } from "@astryxdesign/core/Divider"
import { FileInput } from "@astryxdesign/core/FileInput"
import { HStack, VStack } from "@astryxdesign/core/Layout"
import { StatusDot } from "@astryxdesign/core/StatusDot"
import { Heading, Text } from "@astryxdesign/core/Text"
import { TextInput } from "@astryxdesign/core/TextInput"
import { Head, useForm, usePage } from "@inertiajs/react"
import { type FormEvent, useEffect, useMemo } from "react"

import DeleteUser from "@/components/delete-user"
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

// Mirrors User::AVATAR_CONTENT_TYPES and User::AVATAR_MAX_BYTE_SIZE. The server
// stays the authority; these only spare the user a round trip.
const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp"
const AVATAR_MAX_BYTES = 5 * 1024 * 1024

export default function Profile() {
  const { auth } = usePage().props
  const user = auth.user

  const form = useForm({
    name: user.name,
    avatar: null as File | null,
    removeAvatar: false,
  })
  const { avatar } = form.data

  // Derived rather than stored in state: the effect only has to hand the object
  // URL back to the browser once it is no longer on screen.
  const preview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : null),
    [avatar],
  )

  useEffect(() => {
    if (!preview) return

    return () => URL.revokeObjectURL(preview)
  }, [preview])

  // A picked photo lives only in the browser until Save, and reloading the page
  // drops it silently. Inertia's client-side visits do not fire this, so the
  // form's own submit is never intercepted.
  useEffect(() => {
    if (!form.isDirty) return

    const confirmLeave = (event: BeforeUnloadEvent) => event.preventDefault()

    window.addEventListener("beforeunload", confirmLeave)

    return () => window.removeEventListener("beforeunload", confirmLeave)
  }, [form.isDirty])

  // The pending upload wins, then the removal the user armed, then what is stored.
  const avatarSrc =
    preview ??
    (form.data.removeAvatar ? undefined : (user.avatar_url ?? undefined))

  const selectAvatar = (files: File | File[] | null) => {
    form.setData((data) => ({
      ...data,
      avatar: Array.isArray(files) ? (files[0] ?? null) : files,
      removeAvatar: false,
    }))
  }

  const removeAvatar = () => {
    form.setData((data) => ({ ...data, avatar: null, removeAvatar: true }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()

    // Sent only when set, so a plain rename stays a JSON request instead of
    // becoming a multipart one.
    form.transform((data) => ({
      name: data.name,
      ...(data.avatar ? { avatar: data.avatar } : {}),
      ...(data.removeAvatar ? { remove_avatar: "1" } : {}),
    }))

    form.patch(settingsProfiles.update().url, {
      preserveScroll: true,
      onSuccess: () => {
        // Drop the transient upload state, then make what was just saved the
        // new baseline so the form stops reporting itself as dirty. setData
        // must come first: argless setDefaults reads the form's live data.
        form.setData((data) => ({ ...data, avatar: null, removeAvatar: false }))
        form.setDefaults()
      },
    })
  }

  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={breadcrumbs[breadcrumbs.length - 1].title} />

      <SettingsLayout>
        <VStack gap={6}>
          <HStack gap={4} vAlign="center">
            <Avatar src={avatarSrc} name={user.name} size="xl" />
            <VStack gap={1}>
              <Heading level={1}>{user.name}</Heading>
              <HStack gap={2} vAlign="center">
                <StatusDot
                  variant={user.verified ? "success" : "warning"}
                  label={user.verified ? "Verified" : "Unverified"}
                />
                <Text type="supporting" color="secondary">
                  {user.email} · {user.verified ? "Verified" : "Unverified"}
                </Text>
              </HStack>
              <Text type="supporting" color="secondary">
                Member since {memberSince}
              </Text>
            </VStack>
          </HStack>

          <Divider />

          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2}>Profile information</Heading>
              <Text type="supporting" color="secondary">
                Update the photo and display name other people see.
              </Text>
            </VStack>

            <form onSubmit={submit} noValidate>
              <VStack gap={4}>
                <FileInput
                  label="Photo"
                  mode="dropzone"
                  accept={AVATAR_ACCEPT}
                  maxSize={AVATAR_MAX_BYTES}
                  description="PNG, JPEG or WebP, up to 5 MB."
                  placeholder="Drop an image or choose a file"
                  value={form.data.avatar}
                  onChange={selectAvatar}
                  isOptional
                  status={astryxStatus(form.errors.avatar)}
                />

                {avatarSrc && (
                  <HStack>
                    <Button
                      label="Remove photo"
                      variant="ghost"
                      onClick={removeAvatar}
                    />
                  </HStack>
                )}

                <TextInput
                  label="Name"
                  htmlName="name"
                  value={form.data.name}
                  onChange={(value) => form.setData("name", value)}
                  isRequired
                  autoComplete="name"
                  placeholder="Full name"
                  status={astryxStatus(form.errors.name)}
                />

                <HStack gap={4} vAlign="center">
                  <Button
                    type="submit"
                    label="Save"
                    variant="primary"
                    isLoading={form.processing}
                    isDisabled={!form.isDirty}
                  />
                  {form.isDirty ? (
                    <HStack gap={2} vAlign="center">
                      <StatusDot variant="warning" label="Unsaved changes" />
                      <Text type="supporting">
                        Unsaved changes — select Save to apply them.
                      </Text>
                    </HStack>
                  ) : (
                    form.recentlySuccessful && (
                      <Text type="supporting">Saved</Text>
                    )
                  )}
                </HStack>
              </VStack>
            </form>
          </VStack>

          <Divider />

          <DeleteUser />
        </VStack>
      </SettingsLayout>
    </AppLayout>
  )
}
