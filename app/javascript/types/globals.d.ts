import type { ComponentProps } from "react"

import type { FlashData, SharedProps } from "@/types"

declare module "@astryxdesign/core/TextInput" {
  interface TextInputProps {
    autoComplete?: ComponentProps<"input">["autoComplete"]
  }
}

declare module "@inertiajs/core" {
  export interface InertiaConfig {
    sharedPageProps: SharedProps
    flashDataType: FlashData
    errorValueType: string[]
  }
}
