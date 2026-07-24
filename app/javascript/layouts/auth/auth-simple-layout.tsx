import { Card } from "@astryxdesign/core/Card"
import { Center } from "@astryxdesign/core/Center"
import { Layout, LayoutContent, VStack } from "@astryxdesign/core/Layout"
import { Link } from "@astryxdesign/core/Link"
import { Heading, Text } from "@astryxdesign/core/Text"
import type { PropsWithChildren } from "react"

import AppLogo from "@/components/app-logo"
import { home } from "@/routes"

interface AuthLayoutProps {
  name?: string
  title?: string
  description?: string
}

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: PropsWithChildren<AuthLayoutProps>) {
  return (
    <Layout
      height="fill"
      contentWidth={640}
      content={
        <LayoutContent role="main" padding={4}>
          <Center width="100%" minHeight="calc(100svh - var(--spacing-8))">
            <VStack width="100%" maxWidth={420} gap={4} align="center">
              <Link href={home.index().url} label="Back to home">
                <AppLogo />
              </Link>
              <Card width="100%" maxWidth={420} padding={6}>
                <VStack gap={6}>
                  <VStack gap={1} align="center">
                    <Heading level={1} justify="center">
                      {title}
                    </Heading>
                    <Text type="supporting" as="p" justify="center">
                      {description}
                    </Text>
                  </VStack>
                  {children}
                </VStack>
              </Card>
            </VStack>
          </Center>
        </LayoutContent>
      }
    />
  )
}
