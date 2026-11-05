import { TRANSLATIONS } from './i18n.js'
import { products, models, discViews, flaps, media } from './utils.js'

/**
 * Absolute base used for JSON-LD absolute URLs (offer landing page, item
 * links). Matches astro.config `site` so hreflang/canonical stay consistent.
 */
const SITE_BASE = (typeof process !== 'undefined' && process.env?.SITE_URL) || 'https://motai-abrasives.pages.dev'

/**
 * Canonical absolute URL: directory-style trailing slash on every non-root
 * localized page (same convention as localizedUrl / canonicals / sitemap).
 * `path` is the trailing, no-lang part, e.g. '/products/x' or '' (home).
 */
function absUrl(lang, path) {
  const clean = String(path ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
  return clean ? `${SITE_BASE}/${lang}/${clean}/` : `${SITE_BASE}/${lang}/`
}

/**
 * TDK resolution with three-tier priority: page-level > collection-level > site default,
 * per the plan. Every tdk entry lives in i18n/<lang>.json under the "tdk" key;
 * fill-in placeholders are localized where useful.
 *
 * No on-page Product/Offer JSON-LD is emitted (GSC Product structured-data
 * validation requires price/priceCurrency or review/aggregateRating; this
 * B2B quote-driven site intentionally publishes neither — a $0.00 or free
 * badge must never render). Google shopping coverage comes from the
 * Merchant Center feed (dist/products.csv, availability=preorder, b2b tag),
 * not from page markup. Collection ItemList items use @type WebPage.
 */
/** Normalize keywords (array or comma string) to an array. */
function kws(v, fill = {}) {
  const base = Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean)
  return base.map((k) => Object.entries(fill).reduce((a, [key, val]) => a.replace(new RegExp(`{${key}}`, 'g'), val), k))
}

export function tdkFor(lang, pageId, ctx = {}) {
  const tdk = TRANSLATIONS[lang]?.tdk ?? TRANSLATIONS.en.tdk
  const pick = (o) => (o ? o.title : undefined)

  switch (pageId) {
    case 'home':
      return {
        title: pick(tdk.home),
        description: tdk.home.description,
        keywords: tdk.home.keywords,
        canonicalPath: '',
        ogImage: media('belt-533-75')
      }
    case 'about':
    case 'factory':
    case 'oem':
    case 'applications':
    case 'blog':
    case 'contact':
    case 'privacy':
    case 'terms':
    case 'quote':
    case 'clients':
    case 'glossary': {
      // Brand-default OG image so social cards don't fall back to the small
      // logo (and twitter:card can be summary_large_image). Remote CDN only.
      const og = { about: 'belt-1520-630', factory: 'belt-1520-630', oem: 'belt-1520-630', contact: 'belt-533-75', clients: 'belt-533-75', quote: 'belt-533-75', applications: 'belt-533-75' }[pageId]
      return {
        title: pick(tdk[pageId]),
        description: tdk[pageId].description,
        keywords: kws(tdk[pageId].keywords),
        canonicalPath: `/${pageId}`,
        ...(og ? { ogImage: media(og) } : {})
      }
    }
    case 'collection': {
      const coltKey = { 'abrasive-belts': 'belts', 'sanding-discs': 'discs', 'flap-discs': 'flap', all: 'all' }[ctx.key]
      const c = tdk.colt[coltKey]
      const colOg = { 'abrasive-belts': 'belt-533-75', 'sanding-discs': 'discs', 'flap-discs': 'flap-fiberglass', all: 'belt-533-75' }[ctx.key]
      return {
        title: c.title,
        description: c.description,
        keywords: kws(c.keywords),
        canonicalPath: `/collections/${ctx.key}`,
        ...(colOg ? { ogImage: media(colOg) } : {})
      }
    }
    case 'application': {
      // Per-slug TDK for /applications/<slug>; falls back to the hub copy
      // when a locale file has no tdk.application entry (deepMerge inherits
      // the en values, so en is always present).
      const a = tdk.application?.[ctx.slug] ?? tdk.applications
      return {
        title: a.title,
        description: a.description,
        keywords: kws(a.keywords),
        canonicalPath: `/applications/${ctx.slug}`
      }
    }
    case 'product': {
      const p = products.find((x) => x.handle === ctx.handle)
      const tpl = tdk.product
      const name = p?.name ?? ctx.handle
      return {
        title: tpl.title.replace('{name}', name),
        description: (p?.metaDescription ?? tpl.description)
          .replace('{name}', name)
          .replace('{desc}', p?.summary ?? '')
          .replace('{sizes}', (p?.sizes ?? []).join(', '))
          .replace('{grits}', (p?.grits ?? []).join(', ')),
        keywords: kws(tpl.keywords, { name, category: p?.category ?? 'abrasive', material: p?.material ?? 'abrasive' }),
        canonicalPath: `/products/${ctx.handle}`,
        ogImage: p?.ogImage ? media(p.image) : media('belt-533-75')
      }
    }
    case 'model': {
      const m = models.find((x) => x.slug === ctx.slug)
      const tpl = tdk.model
      return {
        title: tpl.title.replace('{model}', m?.model ?? ctx.slug),
        description: tpl.description.replace('{model}', m?.model ?? ctx.slug),
        keywords: kws(tpl.keywords, { model: m?.model ?? ctx.slug }),
        canonicalPath: `/model/${ctx.slug}`,
        ogImage: media('belt-533-75')
      }
    }
    case 'disc': {
      const d = discViews.find((x) => x.key === ctx.key)
      const tpl = tdk.disc
      return {
        title: tpl.title.replace('{title}', d?.title ?? ctx.key),
        description: tpl.description.replace('{title}', d?.title ?? ctx.key),
        keywords: kws(tpl.keywords),
        canonicalPath: `/disc/${ctx.key}`,
        ogImage: media(d?.image ?? 'discs')
      }
    }
    case 'flap': {
      const f = flaps.find((x) => x.key === ctx.key)
      const tpl = tdk.flap
      return {
        title: tpl.title.replace('{name}', f?.name ?? ctx.key).replace('{backing}', f?.backing ?? ''),
        description: tpl.description
          .replace('{name}', f?.name ?? ctx.key)
          .replace('{backing}', f?.backing ?? ''),
        keywords: kws(tpl.keywords, { backing: f?.backing ?? '' }),
        canonicalPath: `/flap/${ctx.key}`,
        ogImage: media(f?.image ?? 'flap-fiberglass')
      }
    }
    case 'article': {
      const a = ctx.article
      const t = a.title
      return {
        title: `${t} — MoTai buyer resources`,
        description: a.intro,
        keywords: ['abrasive guide', 'grit selection', 'MoTai'],
        canonicalPath: `/blog/${a.slug}`,
        ogImage: media(a.image),
        jsonldExtra: buildArticleJsonLd(lang, a)
      }
    }
    default:
      return {
        title: pick(tdk.home),
        description: tdk.home.description,
        keywords: tdk.home.keywords,
        canonicalPath: ''
      }
  }
}

/** Standard JSON-LD objects shared by all pages. */

/**
 * Stable @id so other JSON-LD nodes (Article author/publisher, AboutPage,
 * ContactPage) can reference the canonical Organization instead of re-declaring
 * a bare, unlinked copy. Resolves to the site root (#organization).
 */
export const ORG_ID = `${SITE_BASE}/#organization`

export function orgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Hubei MoTai Abrasives Materials Co., Ltd.',
    url: 'https://www.motaiabrasive.com',
    logo: 'https://www.motaiabrasive.com/cdn/shop/t/23/assets/logo-charcoal-v18.webp',
    email: 'motai-01@motaiabrasive.com',
    telephone: '+8618118635597',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 88 Yuli Avenue, Junshui Town, Tongcheng County',
      addressLocality: 'Xianning',
      addressRegion: 'Hubei',
      addressCountry: 'CN'
    },
    sameAs: [
      'https://www.motaiabrasive.com',
      'https://www.facebook.com/profile.php?id=61595012045510',
      'https://www.instagram.com/motai_1/'
    ]
  }
}

export function breadcrumbJsonLd(lang, items) {
  const tr = TRANSLATIONS[lang]
  const home = { name: tr.nav.home, path: '' }
  // Callers pass paths either lang-prefixed (`/${lang}/quote`) or bare
  // (`/collections/all`); normalize to a lang-relative trailing-slash path
  // so every breadcrumb URL matches the canonical convention.
  const norm = (raw) => {
    let c = String(raw ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
    const langPrefix = `${lang}/`
    if (c.startsWith(langPrefix)) c = c.slice(langPrefix.length)
    else if (c === lang) c = ''
    return c
  }
  const url = (p) => {
    const c = norm(p)
    return c ? `${SITE_BASE}/${lang}/${c}/` : `${SITE_BASE}/${lang}/`
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [home, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: url(it.path)
    }))
  }
}

/**
 * Collection ItemList: one ListItem per page shown on the collection.
 * Items are @type WebPage — not Product. Google's Product rich result
 * requires price or review data on-page (see the note above); linking
 * the page set as WebPage keeps the ItemList valid without claiming
 * product structured data the page can't back up.
 */
export function collectionItemListJsonLd(lang, items) {
  if (!items?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MoTai Abrasives product collection',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'WebPage',
        name: it.name,
        image: [media(it.image)],
        url: absUrl(lang, it.path)
      }
    }))
  }
}

function buildArticleJsonLd(lang, a) {
  // Author/publisher link the Organization node to the /about entity (org
  // credentials page) so the byline is an E-E-A-T signal, not a bare copy.
  const org = { '@id': ORG_ID, '@type': 'Organization', name: 'MoTai Abrasives', url: absUrl(lang, '/about') }
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.intro,
    image: [media(a.image)],
    author: org,
    publisher: org,
    ...(a.datePublished && { datePublished: a.datePublished }),
    ...(a.dateModified && { dateModified: a.dateModified }),
    mainEntityOfPage: absUrl(lang, `/blog/${a.slug}`)
  }
}

/**
 * AboutPage JSON-LD: the about page describes the company, so link its
 * mainEntity back to the canonical Organization node (trust / E-E-A-T).
 */
export function aboutPageJsonLd(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: { '@id': ORG_ID, '@type': 'Organization', name: 'MoTai Abrasives' },
    url: absUrl(lang, '/about')
  }
}

/** WebSite JSON-LD: names the site and ties it to the Organization node.
 * No SearchAction — the static site has no search feature. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MoTai Abrasives',
    url: SITE_BASE + '/',
    publisher: { '@id': ORG_ID, '@type': 'Organization', name: 'MoTai Abrasives' }
  }
}

/**
 * ContactPage + ContactPoint JSON-LD: surfaces real contact channels
 * (email / phone / WhatsApp, worldwide) so Google shows a rich contact box.
 * All values come from site.json (via orgJsonLd constants).
 */
export function contactPageJsonLd(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: absUrl(lang, '/contact'),
    name: 'MoTai Abrasives — contact',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales or support',
        email: 'motai-01@motaiabrasive.com',
        telephone: '+8618118635597',
        availableLanguage: ['en'],
        areaServed: 'Worldwide'
      }
    ]
  }
}

/** Terms / legal-notice page (no extra type; Organization + Breadcrumb suffice). */
export function termsPageJsonLd(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Use — MoTai Abrasives',
    url: absUrl(lang, '/terms'),
    about: { '@id': ORG_ID }
  }
}

/** FAQPage JSON-LD from i18n faq keys. */
export function faqJsonLd(lang, items) {
  const tr = TRANSLATIONS[lang]
  const pick = (path) => path.split('.').reduce((c, k) => (c ? c[k] : undefined), tr)
  const mainEntity = items
    .map((it) => ({
      '@type': 'Question',
      name: pick(it.qKey) ?? it.q,
      acceptedAnswer: { '@type': 'Answer', text: pick(it.aKey) ?? it.a }
    }))
    .filter((q) => q.name)
  if (!mainEntity.length) return null
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity }
}

/** Glossary ItemList JSON-LD. */
export function itemlistJsonLd(lang, items) {
  const tr = TRANSLATIONS[lang]
  const pick = (path) => path.split('.').reduce((c, k) => (c ? c[k] : undefined), tr)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Abrasives glossary',
    itemListElement: items.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.term,
      item: { '@type': 'DefinedTerm', name: g.term, inDefinedTermSet: 'MoTai abrasives glossary' }
    }))
  }
}
