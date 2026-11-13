import { LANGS, TRANSLATIONS } from './i18n.js'

export const site = (await import('../data/site.json')).default
export const products = (await import('../data/products.json')).default
export const models = (await import('../data/models.json')).default
export const discViews = (await import('../data/disc-views.json')).default
export const flaps = (await import('../data/flap.json')).default
export const sponges = (await import('../data/sponges.json')).default
export const collections = (await import('../data/collections.json')).default
export const blog = (await import('../data/blog.json')).default
export const applications = (await import('../data/applications.json')).default
export const regions = (await import('../data/regions.json')).default
export const faq = (await import('../data/faq.json')).default
// Related-article routes and per-product FAQ assembly for the product page
// (content aggregation: articles + FAQ), keyed by handle / product family.
export const relatedMap = (await import('../data/product-related.json')).default
export const faqMap = (await import('../data/product-faq.json')).default
export const glossary = (await import('../data/glossary.json')).default
export const trust = (await import('../data/trust.json')).default
export const videosData = (await import('../data/videos.json')).default
/** Videos shown on-site. `hidden` clips keep their URL working (direct visits
 *  still render) but are excluded from every internal link, list and
 *  structured-data surface. */
export const visibleVideos = videosData.filter((v) => !v.hidden)

export function productByHandle(handle) {
  return products.find((p) => p.handle === handle)
}
export function modelBySlug(slug) {
  return models.find((m) => m.slug === slug)
}
export function discByKey(key) {
  return discViews.find((d) => d.key === key)
}
export function flapByKey(key) {
  return flaps.find((f) => f.key === key)
}
export function spongeByKey(key) {
  return sponges.find((s) => s.key === key)
}
export function articleBySlug(slug) {
  return blog.find((b) => b.slug === slug)
}
export function applicationBySlug(slug) {
  return applications.find((a) => a.slug === slug)
}
export function videoById(id) {
  return videosData.find((v) => v.id === id)
}

/** Localized image URL (remote CDN, never downloaded).
 *  Short keys resolve against the team asset library; absolute http(s) URLs are
 *  passed through unchanged — flap-disc images exist only on the source
 *  Shopify CDN (see flap.json), so they must not get the asset-base prefix. */
export function media(key) {
  if (typeof key === 'string' && /^https?:\/\//.test(key)) return key
  return `${site.mediaBase}/${key}.webp?v=183101063718712166531793254213`
}

/** Original-site RFQ form URL with context params */
export function quoteUrl({ product, model, disc_key, request_type } = {}) {
  const extra = []
  if (product) extra.push(`product=${encodeURIComponent(product)}`)
  if (model) extra.push(`model=${encodeURIComponent(model)}`)
  if (disc_key) extra.push(`disc_key=${encodeURIComponent(disc_key)}`)
  if (request_type) extra.push(`request_type=${encodeURIComponent(request_type)}`)
  return extra.length ? `${site.quoteFormUrl}&${extra.join('&')}` : site.quoteFormUrl
}

/** Alias used by page templates. */
export const quoteUrlRaw = quoteUrl

/** WhatsApp contact button with localized, context-prefilled text */
export function waLink(lang, templateKey, vars = {}) {
  const tpl = TRANSLATIONS[lang]?.wa?.[templateKey] ?? TRANSLATIONS.en.wa[templateKey]
  const text = tpl
    .replace(/\{name\}/g, vars.name ?? '')
    .replace(/\{grits\}/g, vars.grits ?? '')
    .replace(/\{model\}/g, vars.model ?? '')
    .replace(/\{title\}/g, vars.title ?? '')
  return `${site.whatsapp}?text=${encodeURIComponent(text.trim())}`
}

export function langMeta(lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS.en
}

/**
 * Canonical URL convention: directory-style trailing slash on every non-root
 * localized page (/en/, /en/products/x/). Cloudflare Pages serves
 * <dir>/index.html only at <dir>/ — the no-slash form is auto-redirected —
 * so canonicals, links and JSON-LD must agree on the slashed form. The site
 * root (/) stays slash-free; its canonical points at /en/.
 */
export function localizedUrl(lang, path) {
  const clean = String(path ?? '').replace(/^\/+/, '').replace(/\/+$/, '')
  return clean ? `/${lang}/${clean}/` : `/${lang}/`
}
