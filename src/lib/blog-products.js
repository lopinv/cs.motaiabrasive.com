/**
 * Blog → product mapping for the blog sidebar.
 *
 * The sidebar answers "which product does this article talk about?" without
 * the reader leaving the page. Ranking, most specific first:
 *
 *  1. handles linked from the article body (`/products/<handle>` links) —
 *     the corpus's own cross-reference, so the strongest signal;
 *  2. handles whose exact product name appears in the article text;
 *  3. handles whose product page lists this article as related (the reverse
 *     reading of the curated product-page related map).
 *
 * The generic `default` bucket is deliberately dropped: a sidebar showing the
 * same products under every article is noise. Callers supply their own
 * fallback for articles where nothing specific applies.
 *
 * Kept free of Astro-only imports (no `astro:content`, no `import.meta.glob`)
 * so the mapping can be unit-tested under plain Node.
 */
import { products, relatedMap } from './utils.js'

const handleSet = new Set(products.map((p) => p.handle))
const byHandle = (h) => products.find((p) => p.handle === h)

/**
 * i18n bodyKey → localized text, filled by the page template (which already
 * holds the translation table). Keeps this module Astro-independent and
 * testable while still letting the i18n short articles contribute links.
 */
const resolvedBodies = new Map()
export function registerBodies(entries) {
  for (const [key, text] of entries) resolvedBodies.set(key, text)
}

/**
 * 把文章的 sections 展开成纯正文字符串数组：md 语料的 body 已是文本，
 * i18n 短文章的 bodyKey 由调用方（页面组件持有 tr）预先解析成 body，
 * 因此这里只做 concat，不依赖 i18n 表。
 */
function bodyText(sections) {
  return (sections ?? [])
    .map((s) => [s.body, s.bodyKey && resolvedBodies.get(s.bodyKey)].filter(Boolean).join(' '))
    .join(' ')
}

/** Product handles linked from the article body, in first-appearance order. */
function linkedHandles(sections) {
  const out = []
  for (const m of bodyText(sections).matchAll(/\/products\/([a-z0-9-]+)/g)) {
    if (handleSet.has(m[1])) out.push(m[1])
  }
  return [...new Set(out)]
}

/** Product handles named verbatim in the article text, in catalogue order. */
function mentionedHandles(sections) {
  const text = bodyText(sections)
  return products.filter((p) => text.includes(p.name)).map((p) => p.handle)
}

/**
 * Handles whose product page lists this article as related — the reverse
 * reading of the curated product-page map. Only exact handle/category keys
 * match; the generic `default` bucket (identical for every article) is
 * skipped so it cannot dilute the ranking.
 */
function curatedHandles(article) {
  const slug = article?.slug
  if (!slug) return []
  const out = []
  for (const [handle, slugs] of Object.entries(relatedMap.byHandle ?? {})) {
    if (handleSet.has(handle) && slugs.includes(slug)) out.push(handle)
  }
  for (const [category, slugs] of Object.entries(relatedMap.byCategory ?? {})) {
    if (!slugs.includes(slug)) continue
    for (const p of products) {
      if ((p.category ?? '').toLowerCase() === category && !out.includes(p.handle)) out.push(p.handle)
    }
  }
  return out
}

/**
 * Up to `limit` products ordered by signal strength. Top up with same-family
 * products when the article only links or names one, so the module never
 * renders a lone card — but the linked product always leads.
 */
export function sidebarProducts(article, limit = 3) {
  if (!article) return []
  const ranked = []
  const add = (handles, score) => {
    handles.forEach((h, i) => {
      if (ranked.some((r) => r.handle === h)) return
      ranked.push({ handle: h, score: score - i })
    })
  }
  const linked = linkedHandles(article.sections)
  add(linked, 30)
  add(mentionedHandles(article.sections), 12)
  add(curatedHandles(article), 6)

  const chosen = ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => byHandle(r.handle))

  // Top up from the first linked product's category: a sanding-disc article
  // stays about sanding discs even when it names one specific size.
  for (const seed of linked.map(byHandle).filter(Boolean)) {
    if (chosen.length >= limit) break
    for (const p of products) {
      if (chosen.length >= limit) break
      if (p.category === seed.category && !chosen.some((c) => c.handle === p.handle)) chosen.push(p)
    }
  }
  return chosen
}

/** Neutral fallback: one per catalogue family (discs, belts, flap discs). */
export const defaultProducts = () => [
  byHandle('hook-loop-sanding-discs'),
  byHandle('533x75-abrasive-belt'),
  byHandle('4-inch-psa-sanding-disc')
].filter(Boolean)

/**
 * Video → sidebar products, mirroring sidebarProducts()'s ranking so the
 * video page and the article page present the same style of hand-off:
 *
 *  1. handles listed in videos.json `related` (curated, strongest);
 *  2. handles named verbatim in the clip copy (localized title + body).
 *
 * `clip` is the resolved localized copy ({title, body}); the raw video record
 * is passed alongside because it carries `related`/`line`, which live in
 * videos.json only.
 */
export function videoSidebarProducts(video, clip, limit = 3) {
  if (!video) return []
  const ranked = []
  const add = (handles, score) => {
    handles.forEach((h, i) => {
      if (ranked.some((r) => r.handle === h)) return
      ranked.push({ handle: h, score: score - i })
    })
  }
  // 1) curated `related`; "flap.steel" style entries resolve to /flap/<key>,
  // which the sidebar does not link to, so they are dropped here.
  add((video.related ?? []).filter((h) => handleSet.has(h)), 30)
  // 2) handles named in the clip copy.
  const text = [clip?.title, clip?.body].filter(Boolean).join(' ')
  add(products.filter((p) => text.includes(p.name)).map((p) => p.handle), 12)

  const chosen = ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => byHandle(r.handle))
    .filter(Boolean)

  // Top up to `limit` from the first pick's family so the block never renders
  // a lone card. Written without for-of: the callback form survives the
  // production build unchanged, while the same for-of in this file was
  // dropped by the bundler and silently skipped the top-up.
  const seed = ranked.length ? byHandle(ranked[0].handle) : null
  if (seed && chosen.length < limit) {
    products.forEach((p) => {
      if (chosen.length >= limit) return
      if (p.category === seed.category && !chosen.some((c) => c.handle === p.handle)) chosen.push(p)
    })
  }
  return chosen
}
