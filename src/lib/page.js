import { TRANSLATIONS, LANGS } from './i18n.js'
import {
  site, media, quoteUrl, waLink, localizedUrl,
  products, models, discViews, flaps, collections, blog, applications, regions, faq, glossary, trust, videosData, visibleVideos, productByHandle, modelBySlug, discByKey, flapByKey, articleBySlug, applicationBySlug
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
  // 文章页一律 index,follow：未译 slug 的路由已不再生成（mdArticles 只返回
  // 本语种自有译文），不存在「EN 克隆 + 外语 hreflang」的 duplicate content
  // 面，因此不再需要 per-slug 的 noindex 判定。
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
    // 语种切换器的合法目标：默认全部 42 语种；博客列表/分页/分类与文章详情
    // 的集合随该语种实际内容收缩，由页面显式传入。
    switcherLangs: ctx.switcherLangs ?? LANGS,
    robots: 'index,follow'
  }
}

export { LANGS }
