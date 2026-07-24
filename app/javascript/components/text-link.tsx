import { Link as AstryxLink, type LinkProps } from "@astryxdesign/core/Link"

import { AppLink } from "@/components/inertia-link"

type TextLinkProps = Omit<LinkProps, "as">

export default function TextLink(props: TextLinkProps) {
  return <AstryxLink as={AppLink} hasUnderline type="inherit" {...props} />
}
