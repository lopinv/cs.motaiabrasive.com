/**
 * 文章翻译覆盖查询 —— noindex / hreflang / sitemap 三处的单一事实源。
 *
 * 数据来自 scripts/gen-article-locales.mjs 生成的
 * src/data/article-locales.json（build 链在 astro build 之前刷新）。
 *
 * 背景：未翻译语种的博客文章页此前会回退渲染 EN 正文（mdArticles 的
 * 兜底逻辑），却仍以 <lang> 路由 + 自指 canonical + 42 语种 hreflang
 * 互指 → Google 把 42 个内容相同的页面判为 duplicate content，
 * 非 en 站点被集体忽略。约 5444/5838 个文章 URL 属于此类。
 */
import locales from '../data/article-locales.json'

/** EN 源 slug 全集（路由集合）。 */
export const EN_SLUGS = locales.enSlugs

/** 该语种已翻译的 slug 集合。 */
export function translatedSlugs(lang) {
  return new Set(locales.locales[lang] ?? [])
}

/** 该语种是否译了某个 slug。 */
export function isTranslated(lang, slug) {
  // en 是源语种，恒视为已译
  if (lang === 'en') return true
  return translatedSlugs(lang).has(slug)
}

/**
 * 未译文条目：该 lang 下路由存在但 articles/<lang>/<slug>.md 不存在
 * （构建时会回退 EN 正文）。
 */
export function isFallback(lang, slug) {
  return !isTranslated(lang, slug)
}

/**
 * 参与 hreflang 互指的语种集合（针对某个 slug）。
 * 只有「确有该 slug 译文」的语种才互指；全部未译则只留 en + x-default。
 */
export function hreflangLangs(slug) {
  const set = new Set(['en'])
  for (const [lang, slugs] of Object.entries(locales.locales)) {
    if (lang !== 'en' && slugs.includes(slug)) set.add(lang)
  }
  return set
}