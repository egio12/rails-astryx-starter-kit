import { Center } from "@astryxdesign/core/Center"
import { Layout, LayoutContent, VStack } from "@astryxdesign/core/Layout"
import { Link } from "@astryxdesign/core/Link"
import { Section } from "@astryxdesign/core/Section"
import { Heading, Text } from "@astryxdesign/core/Text"
import { TopNav } from "@astryxdesign/core/TopNav"
import { Head, usePage } from "@inertiajs/react"

import AppLogo from "@/components/app-logo"
import { dashboard, sessions } from "@/routes"

const resources = [
  {
    label: "Inertia Rails documentation",
    href: "https://inertia-rails.dev",
  },
  {
    label: "Astryx component library",
    href: "https://astryx.design",
  },
  {
    label: "React documentation",
    href: "https://react.dev",
  },
  {
    label: "Rails guides",
    href: "https://guides.rubyonrails.org",
  },
]

export default function Welcome() {
  const { auth } = usePage().props
  const destination = auth.user ? dashboard.index().url : sessions.new().url
  const destinationLabel = auth.user ? "Dashboard" : "Log in"

  return (
    <>
      <Head title="Welcome">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
          rel="stylesheet"
        />
      </Head>

      <Layout
        height="fill"
        contentWidth={960}
        header={
          <TopNav
            label="Public navigation"
            heading={<AppLogo />}
            endContent={
              <Link href={destination} isStandalone>
                {destinationLabel}
              </Link>
            }
          />
        }
        content={
          <LayoutContent role="main" padding={6}>
            <Center
              width="100%"
              minHeight="calc(100svh - var(--spacing-12) - var(--spacing-12))"
            >
              <Section variant="transparent" maxWidth={720} padding={8}>
                <VStack gap={6}>
                  <VStack gap={2}>
                    <Heading level={1} type="display-2">
                      Build ambitious Rails applications with a coherent design
                      system.
                    </Heading>
                    <Text type="large" color="secondary" as="p">
                      Rails, Inertia.js, React, and Astryx are wired together so
                      you can start with product work instead of interface
                      plumbing.
                    </Text>
                  </VStack>
                  <VStack gap={2}>
                    <Heading level={2}>Start exploring</Heading>
                    {resources.map((resource) => (
                      <Link
                        key={resource.href}
                        href={resource.href}
                        isExternalLink
                        isStandalone
                      >
                        {resource.label}
                      </Link>
                    ))}
                  </VStack>
                </VStack>
              </Section>
            </Center>
          </LayoutContent>
        }
      />
    </>
  )
}
