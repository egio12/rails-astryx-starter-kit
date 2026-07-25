import { Icon } from "@astryxdesign/core/Icon"
import { HStack } from "@astryxdesign/core/Layout"
import { Text } from "@astryxdesign/core/Text"

import AppLogoIcon from "./app-logo-icon"

export default function AppLogo() {
  return (
    <HStack gap={2} align="center">
      <Icon icon={AppLogoIcon} size="lg" />
      <Text type="label" maxLines={1}>
        {import.meta.env.VITE_APP_NAME ?? "Rails Astryx Starter Kit"}
      </Text>
    </HStack>
  )
}
