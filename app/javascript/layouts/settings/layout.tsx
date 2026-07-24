import { Button } from "@astryxdesign/core/Button"
import { Heading } from "@astryxdesign/core/Heading"
import { Icon } from "@astryxdesign/core/Icon"
import {
  Layout,
  LayoutContent,
  LayoutPanel,
  VStack,
} from "@astryxdesign/core/Layout"
import { List, ListItem } from "@astryxdesign/core/List"
import { Section } from "@astryxdesign/core/Section"
import { Text } from "@astryxdesign/core/Text"
import { Toolbar } from "@astryxdesign/core/Toolbar"
import { useMediaQuery } from "@astryxdesign/core/hooks"
import { usePage } from "@inertiajs/react"
import { ArrowLeft } from "lucide-react"
import { type PropsWithChildren, useState } from "react"

import {
  settingsAppearance,
  settingsEmails,
  settingsPasswords,
  settingsProfiles,
  settingsSessions,
} from "@/routes"

const settingsNavigation = [
  {
    label: "Profile",
    href: settingsProfiles.show().url,
  },
  {
    label: "Email",
    href: settingsEmails.show().url,
  },
  {
    label: "Password",
    href: settingsPasswords.show().url,
  },
  {
    label: "Sessions",
    href: settingsSessions.index().url,
  },
  {
    label: "Appearance",
    href: settingsAppearance().url,
  },
]

function SettingsHeading({ level }: { level: 1 | 2 }) {
  return (
    <VStack gap={1}>
      <Heading level={level}>Settings</Heading>
      <Text type="supporting" as="p">
        Manage your profile and account settings
      </Text>
    </VStack>
  )
}

function SettingsNavigation() {
  const { url } = usePage()

  return (
    <List
      density="balanced"
      header={<Text type="label">Account settings</Text>}
    >
      {settingsNavigation.map((item) => (
        <ListItem
          key={item.href}
          label={item.label}
          href={item.href}
          isSelected={url === item.href}
        />
      ))}
    </List>
  )
}

export default function SettingsLayout({ children }: PropsWithChildren) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isNavigationVisible, setIsNavigationVisible] = useState(false)

  if (isMobile) {
    return (
      <Section variant="transparent" padding={4} width="100%">
        {isNavigationVisible ? (
          <VStack gap={4}>
            <SettingsHeading level={1} />
            <SettingsNavigation />
          </VStack>
        ) : (
          <VStack gap={4}>
            <Toolbar
              label="Settings navigation"
              size="sm"
              dividers={["bottom"]}
              startContent={
                <Button
                  label="All settings"
                  variant="ghost"
                  icon={<Icon icon={ArrowLeft} size="sm" />}
                  onClick={() => setIsNavigationVisible(true)}
                />
              }
            />
            {children}
          </VStack>
        )}
      </Section>
    )
  }

  return (
    <Layout
      height="fill"
      padding={0}
      start={
        <LayoutPanel
          width={240}
          padding={4}
          hasDivider
          role="navigation"
          label="Settings"
        >
          <VStack gap={4}>
            <SettingsHeading level={2} />
            <SettingsNavigation />
          </VStack>
        </LayoutPanel>
      }
      content={
        <LayoutContent padding={4}>
          <VStack width="100%" maxWidth={720} gap={6}>
            {children}
          </VStack>
        </LayoutContent>
      }
    />
  )
}
