import { isBrowser } from "./browser"

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60

export function getCookie(name: string): string | null {
  if (!isBrowser) return null

  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export function setCookie(name: string, value: string): void {
  if (!isBrowser) return

  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${ONE_YEAR_IN_SECONDS};SameSite=Lax`
}

export function removeCookie(name: string): void {
  if (!isBrowser) return

  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`
}
