import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from '@tamagui/core'

export const config = createTamagui({
  ...(defaultConfig as any),
})
