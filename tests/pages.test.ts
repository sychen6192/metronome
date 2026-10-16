import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  headTags,
  manifest,
  notFoundPage,
  pagePath,
  pageUrl,
  renderPage,
  robots,
  sitemap,
  structuredData,
  type Site,
} from '../build/pages'
import { messagesFor } from '../src/i18n'

const template = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')
const PROJECT_SITE: Site = { url: 'https://example.github.io/metronome/', base: '/metronome/' }
const ROOT_SITE: Site = { url: 'https://metronome.example/', base: '/' }

const CJK = /[　-〿㐀-鿿＀-￯]/
const attribute = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
const tags = (html: string, pattern: RegExp) => html.match(pattern) ?? []
const body = (html: string) => html.slice(html.indexOf('<body'), html.indexOf('</body>'))

/** The page's alternate links as {hreflang: href}. */
function alternates(html: string): Record<string, string> {
  return Object.fromEntries(
    tags(html, /<link rel="alternate"[^>]*>/g).map((tag) => [attribute(tag, 'hreflang'), attribute(tag, 'href')]),
  )
}

describe('page URLs', () => {
  it('puts Chinese at the root and English under en/', () => {
    expect(pageUrl(PROJECT_SITE, 'zh-Hant')).toBe('https://example.github.io/metronome/')
    expect(pageUrl(PROJECT_SITE, 'en')).toBe('https://example.github.io/metronome/en/')
    expect(pagePath(PROJECT_SITE, 'en')).toBe('/metronome/en/')
    expect(pagePath(ROOT_SITE, 'zh-Hant')).toBe('/')
  })
})

describe.each([PROJECT_SITE, ROOT_SITE])('renderPage on $url', (site) => {
  const zh = renderPage(template, 'zh-Hant', site)
  const en = renderPage(template, 'en', site)

  it('writes each page in its own language', () => {
    for (const [html, language] of [[zh, 'zh-Hant'], [en, 'en']] as const) {
      const messages = messagesFor(language)
      expect(html).toContain(`<html lang="${language}"`)
      expect(html).toContain(`<title>${messages.pageTitle}</title>`)
      expect(html).toContain(`<meta name="description" content="${messages.pageDescription}" />`)
      expect(html).toContain(`data-i18n="guideTitle">${messages.guideTitle}</h2>`)
      expect(html).toContain(`data-i18n="faqPatternA">${messages.faqPatternA}</p>`)
    }
  })

  it('leaves no Chinese on the English page but the link to the Chinese page', () => {
    const chineseLink = /<a\b[^>]*data-language="zh-Hant"[^>]*>中文<\/a>/
    expect(body(en)).toMatch(chineseLink)
    const rest = body(en).replace(chineseLink, '').replace(/<!--[\s\S]*?-->/g, '')
    expect(rest).not.toMatch(CJK)
    expect(en.slice(0, en.indexOf('<body'))).not.toMatch(/<title>[^<]*[㐀-鿿]/)
  })

  it('translates labels and tooltips too', () => {
    const labelled = tags(en, /<[^>]*\sdata-i18n-(?:label|title)="[^"]*"[^>]*>/g)
    expect(labelled.length).toBeGreaterThan(5)
    for (const tag of labelled) expect(tag).not.toMatch(CJK)
  })

  it('links the language switch to both pages and marks the current one', () => {
    for (const [html, current] of [[zh, 'zh-Hant'], [en, 'en']] as const) {
      const links = tags(html, /<a\b[^>]*\sdata-language="[^"]*"[^>]*>/g)
      expect(links).toHaveLength(2)
      for (const link of links) {
        const language = attribute(link, 'data-language') as 'zh-Hant' | 'en'
        expect(attribute(link, 'href')).toBe(pagePath(site, language))
        expect(attribute(link, 'aria-current')).toBe(language === current ? 'page' : undefined)
      }
    }
  })

  it('gives each page its own canonical and the same reciprocal hreflang set', () => {
    expect(zh).toContain(`<link rel="canonical" href="${site.url}" />`)
    expect(en).toContain(`<link rel="canonical" href="${site.url}en/" />`)
    const expected = { 'zh-Hant': site.url, en: `${site.url}en/`, 'x-default': `${site.url}en/` }
    expect(alternates(zh)).toEqual(expected)
    expect(alternates(en)).toEqual(expected)
  })

  it('puts the head tags inside <head>, once', () => {
    for (const html of [zh, en]) {
      expect(tags(html, /<link rel="canonical"/g)).toHaveLength(1)
      expect(html.indexOf('<link rel="canonical"')).toBeLessThan(html.indexOf('</head>'))
    }
  })
})

describe('renderPage', () => {
  it('rejects a message key the dictionary lacks', () => {
    const broken = template.replace('data-i18n="guideTitle"', 'data-i18n="noSuchKey"')
    expect(() => renderPage(broken, 'en', ROOT_SITE)).toThrow(/noSuchKey/)
  })
})

describe('headTags', () => {
  const head = headTags('en', PROJECT_SITE)
  const meta = (property: string) => new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(head)?.[1]

  it('describes the page for link previews', () => {
    const messages = messagesFor('en')
    expect(meta('og:url')).toBe('https://example.github.io/metronome/en/')
    expect(meta('og:title')).toBe(messages.pageTitle)
    expect(meta('og:locale')).toBe('en_US')
    expect(meta('og:locale:alternate')).toBe('zh_TW')
    expect(meta('og:image')).toBe('https://example.github.io/metronome/og-image.png')
    expect(meta('og:image:width')).toBe('1200')
    expect(meta('og:image:height')).toBe('630')
    expect(meta('og:image:alt')).toBe(messages.ogImageAlt)
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })

  it('embeds structured data that parses back', () => {
    const json = /<script type="application\/ld\+json">([^<]*)<\/script>/.exec(head)?.[1]
    expect(JSON.parse(json ?? '')).toEqual(structuredData('en', PROJECT_SITE))
  })
})

describe('structuredData', () => {
  it('describes the site and a free web app, with no ratings', () => {
    const data = structuredData('zh-Hant', ROOT_SITE) as { '@graph': Array<Record<string, unknown>> }
    const [site, app] = data['@graph']
    expect(site).toMatchObject({ '@type': 'WebSite', url: ROOT_SITE.url })
    expect(app).toMatchObject({
      '@type': 'WebApplication',
      url: ROOT_SITE.url,
      inLanguage: 'zh-Hant',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0' },
      isPartOf: { '@id': site?.['@id'] },
    })
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review/i)
  })
})

describe('sitemap', () => {
  const xml = sitemap(PROJECT_SITE)

  it('lists both pages, each with every language version', () => {
    const urls = tags(xml, /<url>[\s\S]*?<\/url>/g)
    expect(urls.map((url) => /<loc>([^<]*)<\/loc>/.exec(url)?.[1])).toEqual([
      'https://example.github.io/metronome/',
      'https://example.github.io/metronome/en/',
    ])
    for (const url of urls) {
      expect(tags(url, /hreflang="([^"]*)"/g)).toEqual(['hreflang="zh-Hant"', 'hreflang="en"', 'hreflang="x-default"'])
    }
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset /)
  })
})

describe('robots', () => {
  it('allows everything and names the sitemap', () => {
    expect(robots(ROOT_SITE)).toBe('User-agent: *\nAllow: /\n\nSitemap: https://metronome.example/sitemap.xml\n')
  })
})

describe('manifest', () => {
  it('is one app (one id) that opens on the language page it was installed from', () => {
    const zh = manifest('zh-Hant', PROJECT_SITE)
    const en = manifest('en', PROJECT_SITE)
    expect(zh.id).toBe(en.id)
    expect(zh.start_url).toBe('/metronome/')
    expect(en.start_url).toBe('/metronome/en/')
    expect(en.scope).toBe('/metronome/')
    expect(en.name).toBe('Metronome')
    expect(en.lang).toBe('en')
    for (const icon of en.icons) expect(icon.src.startsWith('/metronome/')).toBe(true)
  })
})

describe('notFoundPage', () => {
  it('is not indexed and links to both pages', () => {
    const html = notFoundPage(PROJECT_SITE)
    expect(html).toContain('<meta name="robots" content="noindex" />')
    expect(html).toContain('href="/metronome/"')
    expect(html).toContain('href="/metronome/en/"')
  })
})
