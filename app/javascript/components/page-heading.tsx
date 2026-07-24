import { VStack } from "@astryxdesign/core/Layout"
import { Heading, Text } from "@astryxdesign/core/Text"

interface PageHeadingProps {
  title: string
  description?: string
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <VStack gap={1}>
      <Heading level={2}>{title}</Heading>
      {description && (
        <Text type="supporting" as="p">
          {description}
        </Text>
      )}
    </VStack>
  )
}
