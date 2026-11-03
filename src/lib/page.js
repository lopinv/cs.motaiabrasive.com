import { TRANSLATIONS, LANGS } from './i18n.js'
import {
  site, media, quoteUrl, waLink, localizedUrl,
  products, models, discViews, flaps, collections, blog, applications, regions, faq, glossary, trust, videosData, productByHandle, modelBySlug, discByKey, flapByKey, articleBySlug, applicationBySlug
} from './utils.js'
import { tdkFor, orgJsonLd, faqJsonLd, itemlistJsonLd } from './tdk.js'

/** Shared helpers for every page body. */
export function usePage(lang) {
  const tr = TRANSLATIONS[lang]
  const pick = (path, root = tr) =>
    String(path).split('.').reduce((c, k) => (c ? c[k] : undefined), root)

  return {
    lang, tr, pick,
    media, quoteUrl,
    wa: (ctx, vars) => waLink(lang, ctx, vars),
    lu: (p) => localizedUrl(lang, p),
    localizedUrl,
    quoteUrlRaw: (o) => quoteUrl(o),
    site, products, models, discViews, flaps, collections, blog, applications, regions, faq, glossary, trust, videosData,
    productByHandle, modelBySlug, discByKey, flapByKey, articleBySlug, applicationBySlug,
    org: orgJsonLd()
  }
}

/** Compose the seo prop for <Shell> from tdkFor + extra jsonld. */
export function buildSeo(lang, pageId, ctx = {}, extraJsonLd = []) {
  const t = tdkFor(lang, pageId, ctx)
  const jsonld = [orgJsonLd(), ...(t.jsonldExtra ? [t.jsonldExtra] : []), ...extraJsonLd.filter(Boolean)]
  const ogType = ['product', 'model', 'disc', 'flap'].includes(pageId) ? 'product' : pageId === 'article' ? 'article' : 'website'
  return {
    lang,
    title: t.title,
    description: t.description,
    keywords: Array.isArray(t.keywords) ? t.keywords : String(t.keywords || '').split(',').map((s) => s.trim()),
    canonicalPath: t.canonicalPath,
    ogImage: t.ogImage,
    ogType,
    jsonld,
    robots: 'index,follow'
  }
}

export { LANGS }
