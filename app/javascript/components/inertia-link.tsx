import { Link as InertiaLink } from "@inertiajs/react"
import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  forwardRef,
} from "react"

type AnchorProps = ComponentPropsWithoutRef<"a">

type AppLinkProps = Pick<
  AnchorProps,
  | "children"
  | "className"
  | "style"
  | "target"
  | "rel"
  | "referrerPolicy"
  | "id"
  | "title"
  | "tabIndex"
  | "aria-label"
  | "aria-current"
  | "aria-disabled"
> & {
  href?: string
  download?: string | boolean
  onClick?: (event: MouseEvent) => void
}

const browserOwnedDestination = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  function AppLink({ href = "", download, children, ...props }, ref) {
    const destination = href.toString()
    const isBrowserOwned =
      browserOwnedDestination.test(destination) || Boolean(download)

    if (isBrowserOwned) {
      return (
        <a ref={ref} href={destination} download={download} {...props}>
          {children}
        </a>
      )
    }

    return (
      <InertiaLink ref={ref} href={destination} {...props}>
        {children}
      </InertiaLink>
    )
  },
)
