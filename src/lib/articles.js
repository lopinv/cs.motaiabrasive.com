/**
 * Unified article catalogue for the blog: two sources, one shape.
 *
 *  1. src/data/blog.json — the hand-written short articles whose
 *     title/intro/section bodies live in i18n JSON (blog.<slug>.*). Unchanged.
 *  2. Content collections articles-en / articles-i18n — the long-form corpus
 *     from the article pipeline (5000+ words each). Frontmatter carries the
 *     metadata; the markdown body holds the section text (H3/H4 headings).
 *
 * Both are normalised to the same record so the blog index and the [slug]
 * template render either source without branching. Locale selection: a md
 * entry for the active locale wins over the en fallback; blog.json slugs are
 * distinct publications and are never shadowed.
 */
import { getCollection } from 'astro:content'
import { TRANSLATIONS } from './i18n.js'

export const blogShort = (await import('../data/blog.json')).default

/** Split a markdown body into sections by its H3/H4 headings. */
export function sectionsOf(body) {
  const lines = String(body ?? '').split(/\r?\n/)
  const secs = []
  let cur = null
  const keyOf = (title, i) =>
    String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sec' + i
  for (const line of lines) {
    const h = /^#{3,4}\s+(.*)$/.exec(line)
    if (h) {
      cur = { key: keyOf(h[1], secs.length), title: h[1].trim(), lines: [] }
      secs.push(cur)
      continue
    }
    if (!cur) {
      cur = { key: 'overview', title: null, lines: [] }
      secs.push(cur)
    }
    cur.lines.push(line)
  }
  return secs
    .map((s) => ({ key: s.key, title: s.title, body: s.lines.join('\n').trim() }))
    .filter((s) => s.body.length > 0)
}

function str(v) {
  if (v == null) return undefined
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

function mdRecord(entry, lang) {
  const d = entry.data
  return {
    source: 'md',
    slug: d.slug,
    lang,
    categoryKey: d.category,
    title: d.title,
    intro: d.intro ?? '',
    metaDescription: d.metaDescription,
    keywords: Array.isArray(d.keywords) ? d.keywords.map(String) : (d.keywords ? String(d.keywords) : '').split(',').map((s) => s.trim()).filter(Boolean),
    image: d.image,
    datePublished: str(d.datePublished),
    dateModified: str(d.dateModified) ?? str(d.datePublished),
    // Sections carry `source: 'md'` so the template resolves title/body from
    // the record itself instead of the i18n pick() path.
    sections: sectionsOf(entry.body ?? '').map((s) => ({ ...s, source: 'md' }))
  }
}

/** md corpus for one locale: its own translations, else the en reference. */
export async function mdArticles(lang) {
  const [en, i18n] = await Promise.all([getCollection('articles-en'), getCollection('articles-i18n')])
  const bySlog = new Map()
  for (const e of en) bySlog.set(e.data.slug, mdRecord(e, 'en'))
  for (const e of i18n) {
    if (!e.id.startsWith(lang + '/')) continue
    bySlog.set(e.data.slug, mdRecord(e, lang))
  }
  return [...bySlog.values()]
}

/** i18n short articles (blog.json) resolved through the locale's strings. */
export function i18nArticles(lang) {
  const tr = TRANSLATIONS[lang] ?? TRANSLATIONS.en
  const pick = (path) => path.split('.').reduce((c, k) => (c ? c[k] : undefined), tr)
  return blogShort
    .map((b) => ({
      source: 'i18n',
      slug: b.slug,
      lang,
      categoryKey: b.categoryKey,
      title: pick(b.titleKey),
      intro: pick(b.introKey),
      datePublished: b.datePublished,
      dateModified: b.dateModified ?? b.datePublished,
      image: b.image,
      sections: b.sections ?? []
    }))
    .filter((a) => a.title)
}

/** All articles for a locale, newest first (md corpus + i18n short articles). */
export async function allArticles(lang) {
  const [md, short] = await Promise.all([mdArticles(lang), Promise.resolve(i18nArticles(lang))])
  return [...md, ...short].sort((a, b) => String(b.dateModified ?? '').localeCompare(String(a.dateModified ?? '')))
}

/** One article by slug for a locale, or undefined. */
export async function findArticle(lang, slug) {
  const all = await allArticles(lang)
  return all.find((a) => a.slug === slug)
}

/** Every slug the blog can route (union of md corpus and blog.json). */
export async function allSlugs() {
  const [en] = await Promise.all([getCollection('articles-en')])
  return [...new Set([...en.map((e) => e.data.slug), ...blogShort.map((b) => b.slug)])]
}
