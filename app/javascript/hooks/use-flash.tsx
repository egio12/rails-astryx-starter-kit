import { useToast } from "@astryxdesign/core/Toast"
import { usePage } from "@inertiajs/react"
import { useEffect } from "react"

import type { FlashData } from "@/types"

function showFlash(
  flash: FlashData,
  showToast: ReturnType<typeof useToast>,
) {
  if (flash.alert) {
    showToast({
      body: flash.alert,
      type: "error",
      uniqueID: "rails-alert",
    })
  }

  if (flash.notice) {
    showToast({
      body: flash.notice,
      type: "info",
      uniqueID: "rails-notice",
    })
  }
}

export function useFlash() {
  const { flash } = usePage()
  const showToast = useToast()

  useEffect(() => {
    const timeout = window.setTimeout(() => showFlash(flash, showToast), 0)
    return () => window.clearTimeout(timeout)
  }, [flash, showToast])
}
