/**
 * The site's pages for search engines and link previews. Each language has its own URL with its
 * text written into the HTML at build time (the root is Traditional Chinese, /en/ English), so
 * Google can index both, and every page carries its canonical URL, hreflang alternates, Open
 * Graph tags and structured data. Also the sitemap, robots.txt, 404 page and the English
 * manifest. Used by vite.config.ts; pure functions, so they are unit-tested.
 */
import { messagesFor, type Language, type MessageKey } from '../src/i18n.ts'

/** Where the site lives. */
export interface Site {
  /** Public URL of the Chinese (root) page, absolute, ending in "/": the canonical host. */
  url: string
  /** Path the build is served from, starting and ending in "/" (e.g. "/" or "/metronome/"). */
  base: string
}

interface PageInfo {
  /** Path of the page below the site root. */
  path: string
  /** Open Graph locale (language_TERRITORY). */
  ogLocale: string
  /** Name of the installed app (its short name is the page's appTitle message). */
  appName: string
}

export const PAGES: Readonly<Record<Language, PageInfo>> = {
  'zh-Hant': { path: '', ogLocale: 'zh_TW', appName: '節拍器 Metronome' },
  en: { path: 'en/', ogLocale: 'en_US', appName: 'Metronome' },
}

/** One name for the whole site (Google shows one site name per domain). */
export const SITE_NAME = '節拍器 Metronome'
export const OG_IMAGE = { file: 'og-image.png', width: 1200, height: 630 } as const
export const THEME_COLOR = '#172036'

const LANGUAGES = Object.keys(PAGES) as Language[]
/** Searchers whose language matches neither page get English. */
const X_DEFAULT: Language = 'en'

export const pageUrl = (site: Site, language: Language) => site.url + PAGES[language].path
export const pagePath = (site: Site, language: Language) => site.base + PAGES[language].path

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Set (or add) an attribute on one start tag. */
function setAttribute(tag: string, name: string, value: string): string {
  const attribute = new RegExp(`\\s${name}="[^"]*"`)
  const written = ` ${name}="${escapeHtml(value)}"`
  if (attribute.test(tag)) return tag.replace(attribute, written)
  return tag.replace(/\s*(\/?)>$/, `${written}$1>`)
}

function removeAttribute(tag: string, name: string): string {
  return tag.replace(new RegExp(`\\s${name}="[^"]*"`), '')
}

function message(messages: Readonly<Record<MessageKey, string>>, key: string): string {
  const text = messages[key as MessageKey]
  if (text === undefined) throw new Error(`index.html uses an unknown message key: ${key}`)
  return text
}

/** The page template (index.html) written out in one language. */
export function renderPage(template: string, language: Language, site: Site): string {
  const messages = messagesFor(language)
  let html = template
    .replace(/<html lang="[^"]*"/, `<html lang="${language}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(messages.pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(messages.pageDescription)}$2`)
    .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, `$1${escapeHtml(messages.appTitle)}$2`)
    // Text of elements marked data-i18n (they hold plain text only).
    .replace(/(<(\w+)\b[^>]*\sdata-i18n="([\w.]+)"[^>]*>)[^<]*(<\/\2>)/g, (_, open: string, _tag, key: string, close: string) =>
      `${open}${escapeHtml(message(messages, key))}${close}`,
    )
    .replace(/<[^>]*\sdata-i18n-label="([\w.]+)"[^>]*>/g, (tag, key: string) => setAttribute(tag, 'aria-label', message(messages, key)))
    .replace(/<[^>]*\sdata-i18n-title="([\w.]+)"[^>]*>/g, (tag, key: string) => setAttribute(tag, 'title', message(messages, key)))
    // The language switch: real links between the two pages, the current one marked.
    .replace(/<a\b[^>]*\sdata-language="([\w-]+)"[^>]*>/g, (tag, code: string) => {
      const target = LANGUAGES.find((candidate) => candidate === code)
      if (!target) throw new Error(`Unknown language link: ${code}`)
      const linked = setAttribute(tag, 'href', pagePath(site, target))
      return target === language ? setAttribute(linked, 'aria-current', 'page') : removeAttribute(linked, 'aria-current')
    })
  html = html.replace(/(\n[ \t]*)<\/head>/, (_, indent: string) => `\n${headTags(language, site)}${indent}</head>`)
  return html
}

/** Canonical, hreflang, link-preview tags and structured data for one page. */
export function headTags(language: Language, site: Site): string {
  const messages = messagesFor(language)
  const url = pageUrl(site, language)
  const image = site.url + OG_IMAGE.file
  const other = LANGUAGES.filter((code) => code !== language)
  const lines = [
    `<link rel="canonical" href="${url}" />`,
    ...LANGUAGES.map((code) => `<link rel="alternate" hreflang="${code}" href="${pageUrl(site, code)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(site, X_DEFAULT)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(messages.pageTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(messages.pageDescription)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${PAGES[language].ogLocale}" />`,
    ...other.map((code) => `<meta property="og:locale:alternate" content="${PAGES[code].ogLocale}" />`),
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(messages.ogImageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${jsonForScript(structuredData(language, site))}</script>`,
  ]
  return lines.map((line) => `    ${line}`).join('\n')
}

/**
 * schema.org description of the site and the app. Free, no ratings: the app has none, and
 * inventing them is against Google's guidelines (so no rating stars in results, by design).
 */
export function structuredData(language: Language, site: Site): object {
  const messages = messagesFor(language)
  const url = pageUrl(site, language)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site.url}#website`,
        url: site.url,
        name: SITE_NAME,
        alternateName: ['Metronome', '節拍器'],
        inLanguage: LANGUAGES,
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        url,
        name: PAGES[language].appName,
        description: messages.pageDescription,
        inLanguage: language,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript and the Web Audio API',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
        featureList: messages.featureList,
        image: site.url + OG_IMAGE.file,
        isPartOf: { '@id': `${site.url}#website` },
      },
    ],
  }
}

/** JSON that cannot end its <script> element early. */
function jsonForScript(value: object): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** Both pages, each listing every language version (hreflang must be reciprocal). */
export function sitemap(site: Site): string {
  const alternates = [
    ...LANGUAGES.map((code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${pageUrl(site, code)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(site, X_DEFAULT)}"/>`,
  ].join('\n')
  const urls = LANGUAGES.map((code) => `  <url>\n    <loc>${pageUrl(site, code)}</loc>\n${alternates}\n  </url>`)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/** Only read at the root of a host; under a sub-path (GitHub Pages project site) it is ignored. */
export function robots(site: Site): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.url}sitemap.xml\n`
}

/** The installed app for one language: the same app (one id), opening on that language's page. */
export function manifest(language: Language, site: Site) {
  const icon = (file: string) => site.base + file
  return {
    id: site.base,
    name: PAGES[language].appName,
    short_name: messagesFor(language).appTitle,
    description: messagesFor(language).pageDescription,
    lang: language === 'en' ? 'en' : 'zh-Hant-TW',
    start_url: pagePath(site, language),
    scope: site.base,
    display: 'standalone' as const,
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ['music', 'utilities', 'education'],
    icons: [
      { src: icon('pwa-64x64.png'), sizes: '64x64', type: 'image/png' },
      { src: icon('pwa-192x192.png'), sizes: '192x192', type: 'image/png' },
      { src: icon('pwa-512x512.png'), sizes: '512x512', type: 'image/png' },
      { src: icon('maskable-icon-512x512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

/** Served for unknown paths (GitHub Pages; Cloudflare with not_found_handling "404-page"). */
export function notFoundPage(site: Site): string {
  const zh = pagePath(site, 'zh-Hant')
  const en = pagePath(site, 'en')
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>找不到這個頁面 · Page not found</title>
    <link rel="icon" href="${site.base}favicon.ico" sizes="16x16 32x32 48x48" />
    <style>
      :root { color-scheme: dark light; --ground: #172036; --ink: #eceff6; --ink-2: #b4bdd2; --rule: #33405f; }
      @media (prefers-color-scheme: light) { :root { --ground: #f3f5f9; --ink: #172036; --ink-2: #44506c; --rule: #c6cddc; } }
      body { min-height: 100dvh; margin: 0; display: grid; place-items: center; background: var(--ground); color: var(--ink);
        font: 1rem/1.6 system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; }
      main { padding: 24px; text-align: center; }
      h1 { margin: 0 0 8px; font-size: 1.25rem; }
      p { margin: 0 0 24px; color: var(--ink-2); }
      nav { display: flex; gap: 12px; justify-content: center; }
      a { padding: 10px 18px; border: 1.5px solid var(--rule); border-radius: 999px; color: inherit; text-decoration: none; }
      a:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <h1>找不到這個頁面</h1>
      <p lang="en">Page not found</p>
      <nav>
        <a href="${zh}" hreflang="zh-Hant">回到節拍器</a>
        <a href="${en}" hreflang="en" lang="en">Open the metronome</a>
      </nav>
    </main>
  </body>
</html>
`
}
