import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl"

import { type Appearance, useAppearance } from "@/hooks/use-appearance"

const appearanceOptions: {
  value: Appearance
  label: string
}[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

export default function AppearanceControl() {
  const { appearance, updateAppearance } = useAppearance()

  return (
    <SegmentedControl
      label="Appearance"
      value={appearance}
      onChange={(value) => updateAppearance(value as Appearance)}
      layout="fill"
    >
      {appearanceOptions.map((option) => (
        <SegmentedControlItem
          key={option.value}
          value={option.value}
          label={option.label}
        />
      ))}
    </SegmentedControl>
  )
}
