import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Same colour as the icon tile, so the padded maskable/apple icons blend into a full-bleed square.
const tile = '#0f1115'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.2, resizeOptions: { background: tile } },
    apple: { ...minimal2023Preset.apple, padding: 0.2, resizeOptions: { background: tile } },
  },
  images: ['public/favicon.svg'],
})
