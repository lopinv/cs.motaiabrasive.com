/**
 * 文章翻译覆盖查询 —— hreflang 互指范围的单一事实源。
 *
 * 数据来自 scripts/gen-article-locales.mjs 生成的
 * src/data/article-locales.json（build 链在 astro build 之前刷新）。
 *
 * 背景：未翻译语种的博客文章页曾回退渲染 EN 正文，却仍以 <lang> 路由 +
 * 自指 canonical + 42 语种 hreflang 互指 → Google 把 42 个内容相同的页面
 * 判为 duplicate content（scaled content abuse）。约 5444/5838 个文章 URL
 * 属于此类。
 *
 * 2026-11-17 起改为**不生成这些路由**（mdArticles 只返回本语种自有译文），
 * 克隆面整体消失；本模块保留的唯一职责是让 hreflang 只互指确有该 slug 译文
 * 的语种——否则 hreflang 会指向一个已不存在的 404 页面。
 */
import locales from '../data/article-locales.json'
import blogShort from '../data/blog.json'
import { LANGS } from './i18n.js'

// blogShort 直接读 JSON 而不从 articles.js 引：后者在模块作用域 import
// 'astro:content'，只有页面/端上下文中可用；本模块被 SeoMeta 这类组件引用，
// 不能把 Astro 运行时依赖带进来。
const shortSlugs = new Set(blogShort.map((b) => b.slug))

/** EN 源 slug 全集（路由集合）。 */
export const EN_SLUGS = locales.enSlugs

/** 该语种已翻译的 slug 集合。 */
export function translatedSlugs(lang) {
  return new Set(locales.locales[lang] ?? [])
}

/** 该语种是否译了某个 slug。 */
export function isTranslated(lang, slug) {
  // en 是源语种，恒视为已译；blog.json 短文 42 语种全译
  if (lang === 'en') return true
  return translatedSlugs(lang).has(slug) || shortSlugs.has(slug)
}

/**
 * 未译文条目：该 lang 下路由已不存在（构建时不再回退 EN 正文）。
 * 仅供门禁/诊断使用；渲染侧不再需要它。blog.json 短文恒为已译。
 */
export function isFallback(lang, slug) {
  if (shortSlugs.has(slug)) return false
  return !isTranslated(lang, slug)
}

/**
 * 参与 hreflang 互指的语种集合（针对某个 slug）。
 *
 * blog.json 短文的正文存在 i18n 表里、42 语种全译，与 md 语料的「逐语种
 * 文件」判据不同——它们必须在每个语种都互指，否则 hreflang 会把 42 个
 * 已存在的译文页漏掉，只留下 en + x-default。
 */
export function hreflangLangs(slug) {
  const set = new Set(['en'])
  for (const [lang, slugs] of Object.entries(locales.locales)) {
    if (lang !== 'en' && slugs.includes(slug)) set.add(lang)
  }
  if (set.size === 1 && shortSlugs.has(slug)) {
    for (const lang of LANGS) set.add(lang)
  }
  return set
}