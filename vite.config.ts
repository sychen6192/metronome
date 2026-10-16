/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { manifest, notFoundPage, renderPage, robots, sitemap, type Site } from './build/pages.ts'

const root = fileURLToPath(new URL('.', import.meta.url))
// GitHub Pages serves the app from /<repo>/, so the deploy workflow sets BASE_PATH.
const base = process.env.BASE_PATH ?? '/'
const withSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`)
const { homepage } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { homepage: string }
/**
 * The canonical public URL, package.json "homepage" (SITE_URL overrides it). Every build, on any
 * host, points search engines there, so a second host never competes with it.
 */
const site: Site = { url: withSlash(process.env.SITE_URL ?? homepage), base }

const englishPage = resolve(root, 'en/index.html')

/**
 * One page per language: index.html is the Chinese page and the template for en/index.html, both
 * written out with their own text and search tags (build/pages.ts). Also emits the sitemap,
 * robots.txt, the 404 page and the English manifest.
 */
function languagePages(): Plugin[] {
  const isEnglish = (filename: string) => resolve(filename) === englishPage
  return [
    {
      name: 'metronome:language-pages',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          if (!isEnglish(ctx.filename)) return renderPage(html, 'zh-Hant', site)
          return renderPage(readFileSync(resolve(root, 'index.html'), 'utf8'), 'en', site)
        },
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots(site) })
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(site) })
        this.emitFile({ type: 'asset', fileName: '404.html', source: notFoundPage(site) })
        this.emitFile({ type: 'asset', fileName: 'en/manifest.webmanifest', source: JSON.stringify(manifest('en', site)) })
      },
    },
    {
      // After vite-plugin-pwa has linked its (Chinese) manifest into every page.
      name: 'metronome:english-manifest',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          if (!isEnglish(ctx.filename)) return html
          return html.replace(`href="${base}manifest.webmanifest"`, `href="${base}en/manifest.webmanifest"`)
        },
      },
    },
  ]
}

const [pages, englishManifest] = languagePages()

export default defineConfig({
  base,
  build: {
    target: 'es2022',
    rolldownOptions: {
      input: { main: resolve(root, 'index.html'), en: englishPage },
    },
  },
  plugins: [
    pages!,
    VitePWA({
      // "prompt" instead of "autoUpdate": never reload the page while the metronome is playing.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      includeManifestIcons: false,
      manifest: manifest('zh-Hant', site),
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        globIgnores: ['404.html', 'og-image.png'],
        cleanupOutdatedCaches: true,
        // Navigations to /en/ are answered by the precached en/index.html; anything else gets the root.
        navigateFallback: 'index.html',
      },
    }),
    englishManifest!,
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
