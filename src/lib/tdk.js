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
 * B2B "request-a-quote" offer. The static site does not publish prices
 * (quote-driven wholesale), so the offer carries no price/priceCurrency —
 * a $0.00 or free badge must never render. PreSale signals a pre-order /
 * quote-request state. Merchant Center (b2b data source) reads the same
 * items from products.csv with availability=preorder.
 */
function b2bOffer(lang, path) {
  return {
    '@type': 'Offer',
    url: absUrl(lang, path),
    availability: 'https://schema.org/PreSale',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'MoTai Abrasives' }
  }
}

/**
 * TDK resolution with three-tier priority: page-level > collection-level > site default,
 * per the plan. Every tdk entry lives in i18n/<lang>.json under the "tdk" key;
 * fill-in placeholders are localized where useful.
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
    case 'quote':
    case 'clients':
    case 'glossary':
      return {
        title: pick(tdk[pageId]),
        description: tdk[pageId].description,
        keywords: kws(tdk[pageId].keywords),
        canonicalPath: `/${pageId}`
      }
    case 'collection': {
      const coltKey = { 'abrasive-belts': 'belts', 'sanding-discs': 'discs', 'flap-discs': 'flap', all: 'all' }[ctx.key]
      const c = tdk.colt[coltKey]
      return {
        title: c.title,
        description: c.description,
        keywords: kws(c.keywords),
        canonicalPath: `/collections/${ctx.key}`
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
        keywords: kws(tpl.keywords, { name }),
        canonicalPath: `/products/${ctx.handle}`,
        ogImage: p?.ogImage ? media(p.image) : media('belt-533-75'),
        jsonldExtra: buildProductJsonLd(lang, p)
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
        ogImage: media('belt-533-75'),
        jsonldExtra: buildModelJsonLd(lang, m)
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
        ogImage: media(d?.image ?? 'discs'),
        jsonldExtra: buildDiscJsonLd(lang, d)
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
        ogImage: media(f?.image ?? 'flap-fiberglass'),
        jsonldExtra: buildFlapJsonLd(lang, f)
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
export function orgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
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

function buildProductJsonLd(lang, p) {
  if (!p) return null
  const props = [
    { '@type': 'PropertyValue', name: 'Sizes', value: (p.sizes ?? []).join(', ') },
    { '@type': 'PropertyValue', name: 'Grits', value: (p.grits ?? []).join(', ') },
    { '@type': 'PropertyValue', name: 'Abrasive material', value: p.material ?? '' },
    { '@type': 'PropertyValue', name: 'Backing / attachment', value: p.backing ?? '' }
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: [media(p.image)],
    description: p.summary,
    brand: { '@type': 'Brand', name: 'MoTai Abrasives' },
    category: p.category,
    sku: p.handle,
    offers: b2bOffer(lang, `/products/${p.handle}`),
    additionalProperty: props
  }
}

function buildModelJsonLd(lang, m) {
  if (!m) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Abrasive belt model ${m.model}`,
    image: [media('belt-533-75')],
    description: m.source || `Reference belt model ${m.model} from the MoTai range; dimensions, grit and backing are settled with the quotation.`,
    brand: { '@type': 'Brand', name: 'MoTai Abrasives' },
    category: 'Abrasive Belts',
    sku: m.model,
    offers: b2bOffer(lang, `/model/${m.slug}`)
  }
}

function buildDiscJsonLd(lang, d) {
  if (!d) return null
  const props = [
    { '@type': 'PropertyValue', name: 'Holes', value: d.holes ?? '' },
    { '@type': 'PropertyValue', name: 'Diameter', value: d.diameter ?? '' },
    { '@type': 'PropertyValue', name: 'Abrasive', value: d.abrasive ?? '' },
    { '@type': 'PropertyValue', name: 'Attachment', value: d.attachment ?? '' },
    { '@type': 'PropertyValue', name: 'Grits', value: (d.grits ?? []).join(', ') }
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.title,
    image: [media(d.image)],
    description: d.title,
    brand: { '@type': 'Brand', name: 'MoTai Abrasives' },
    category: 'Sanding Discs',
    sku: d.key,
    offers: b2bOffer(lang, `/disc/${d.key}`),
    additionalProperty: props
  }
}

function buildFlapJsonLd(lang, f) {
  if (!f) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: f.name,
    image: [media(f.image)],
    description: f.summary,
    brand: { '@type': 'Brand', name: 'MoTai Abrasives' },
    category: 'Flap Discs',
    sku: f.key,
    offers: b2bOffer(lang, `/flap/${f.key}`),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Backing', value: f.backing },
      { '@type': 'PropertyValue', name: 'Color', value: f.color }
    ]
  }
}

/**
 * Product ItemList for collection pages: one ListItem per product shown on the
 * page, each linking to its localized detail URL. Google reads these as the
 * on-page product set (feeds the collection's rich result).
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
        '@type': 'Product',
        name: it.name,
        image: [media(it.image)],
        url: absUrl(lang, it.path),
        sku: it.sku,
        brand: { '@type': 'Brand', name: 'MoTai Abrasives' },
        category: it.category
      }
    }))
  }
}

function buildArticleJsonLd(lang, a) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.intro,
    image: [media(a.image)],
    author: { '@type': 'Organization', name: 'MoTai Abrasives' },
    publisher: { '@type': 'Organization', name: 'MoTai Abrasives' }
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
