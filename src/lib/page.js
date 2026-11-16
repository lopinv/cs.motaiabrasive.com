import { TRANSLATIONS, LANGS } from './i18n.js'
import {
  site, media, quoteUrl, waLink, localizedUrl,
  products, models, discViews, flaps, collections, blog, applications, regions, faq, glossary, trust, videosData, visibleVideos, productByHandle, modelBySlug, discByKey, flapByKey, articleBySlug, applicationBySlug
} from './utils.js'
import { tdkFor, orgJsonLd, faqJsonLd, itemlistJsonLd } from './tdk.js'
import { isFallback } from './article-locales.js'

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
    site, products, models, discViews, flaps, collections, blog, applications, regions, faq, glossary, trust, videosData, visibleVideos,
    productByHandle, modelBySlug, discByKey, flapByKey, articleBySlug, applicationBySlug,
    org: orgJsonLd()
  }
}

/** Compose the seo prop for <Shell> from tdkFor + extra jsonld. */
export function buildSeo(lang, pageId, ctx = {}, extraJsonLd = []) {
  const t = tdkFor(lang, pageId, ctx)
  const jsonld = [orgJsonLd(), ...(t.jsonldExtra ? [t.jsonldExtra] : []), ...extraJsonLd.filter(Boolean)]
  // og:type：只有 /products/<handle>/ 真商品页用 product（配 og:image，
// 价格经 Merchant feed 承载）；model/disc/flap/sponge/collections 是
// 规格参考页而非电商商品，标 product 会让 FB/LinkedIn 抓价格/库存失败
// 而降级卡片，故一律 website；文章页 article。
const ogType = pageId === 'product' ? 'product' : pageId === 'article' ? 'article' : 'website'
  // 未翻译的文章条目：构建时会回退渲染 EN 正文，若仍 index,follow +
  // 42 语种 hreflang 互指，Google 会判定为 duplicate content（非 en 站
  // 被整体忽略）。对这类条目改 noindex,follow：URL 仍可访问，只是不参与
  // 索引与互指。en 是源语种，恒 index。
  const robots = pageId === 'article' && ctx.article?.slug && isFallback(lang, ctx.article.slug)
    ? 'noindex,follow'
    : 'index,follow'
  return {
    lang,
    title: t.title,
    description: t.description,
    keywords: Array.isArray(t.keywords) ? t.keywords : String(t.keywords || '').split(',').map((s) => s.trim()),
    canonicalPath: t.canonicalPath,
    ogImage: t.ogImage,
    ogType,
    jsonld,
    // 文章 slug 透传给 SeoMeta，用于收窄 hreflang 互指范围
    articleSlug: pageId === 'article' ? (ctx.article?.slug ?? '') : '',
    robots
  }
}

export { LANGS }
