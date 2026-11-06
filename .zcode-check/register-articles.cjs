/**
 * Register the long-form markdown articles (articles/<lang>/<slug>.md) into
 * the data + i18n shape the blog template consumes:
 *
 *   src/data/blog.json           — one entry per article (slug, categoryKey,
 *                                  titleKey, introKey, sections[], image, dates)
 *   src/i18n/<lang>.json         — blog.<slug>.title / .intro /
 *                                  .<section>.title / .<section>.body
 *
 * The blog template renders section titles as <h2>, so markdown `###` headings
 * become sections (the body string keeps its own **bold**, *italic*, [links]
 * and `- ` lists, rendered by components/Prose.astro).
 *
 * Usage:  node .zcode-check/register-articles.cjs [lang ...] [--dry-run]
 * Idempotent: re-running rewrites the same entries; slugs absent from disk are
 * left untouched so hand-registered short articles survive.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const ART = path.join(root, 'articles')
const BLOG = path.join(root, 'src', 'data', 'blog.json')
const I18N = path.join(root, 'src', 'i18n')

const dryRun = process.argv.includes('--dry-run')
const codes = process.argv.slice(2).filter((a) => !a.startsWith('--'))

/** Parse the YAML-ish frontmatter block of a markdown file (flat keys only). */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
    else v = v.replace(/^["']|["']$/g, '')
    fm[kv[1]] = v
  }
  return fm
}

/** Split the body into sections keyed by the H3/H4 headings they follow. */
function sectionsOf(body) {
  const lines = body.split(/\r?\n/)
  const secs = []
  let cur = null
  const key = (title, i) =>
    String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sec' + i
  lines.forEach((line) => {
    const h = /^#{3,4}\s+(.*)$/.exec(line)
    if (h) {
      cur = { key: key(h[1], secs.length), title: h[1].trim(), lines: [] }
      secs.push(cur)
      return
    }
    if (!cur) {
      // content before the first heading: its own lead section
      cur = { key: 'overview', title: null, lines: [] }
      secs.push(cur)
    }
    cur.lines.push(line)
  })
  return secs
    .map((s) => ({ key: s.key, title: s.title, body: s.lines.join('\n').trim() }))
    .filter((s) => s.body.length > 0)
}

function setDot(obj, dotted, value) {
  const parts = dotted.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (typeof cur[k] !== 'object' || cur[k] === null || Array.isArray(cur[k])) cur[k] = {}
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
}

const langs = codes.length ? codes : fs.readdirSync(ART).filter((d) => fs.statSync(path.join(ART, d)).isDirectory())
let totalEntries = 0

for (const lang of langs) {
  const dir = path.join(ART, lang)
  if (!fs.existsSync(dir)) continue
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
  const entries = []
  const i18nPatch = {}

  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8')
    const fm = frontmatter(raw)
    if (!fm || !fm.slug || !fm.title || !fm.category) { console.log(`${lang}/${f}: skipped (frontmatter)`); continue }
    const body = raw.slice(raw.indexOf('---', 3) + 3).trim()
    const secs = sectionsOf(body)
    if (!secs.length) { console.log(`${lang}/${f}: skipped (no body)`); continue }

    entries.push({
      slug: fm.slug,
      categoryKey: fm.category,
      titleKey: `blog.${fm.slug}.title`,
      introKey: `blog.${fm.slug}.intro`,
      sections: secs.map((s) => ({
        key: s.key,
        titleKey: `blog.${fm.slug}.${s.key}.title`,
        bodyKey: `blog.${fm.slug}.${s.key}.body`,
        // markdown-driven sections carry their own heading text; i18n only
        // needs the body. Store the title in the payload so other locales can
        // translate headings later without re-parsing the markdown.
        mdTitle: s.title
      })),
      image: fm.image || 'discs',
      datePublished: fm.datePublished,
      dateModified: fm.dateModified || fm.datePublished
    })

    setDot(i18nPatch, `blog.${fm.slug}.title`, fm.title)
    if (fm.intro) setDot(i18nPatch, `blog.${fm.slug}.intro`, fm.intro)
    if (fm.metaDescription) setDot(i18nPatch, `tdk.article.${fm.slug}`, {
      title: fm.title,
      description: fm.metaDescription,
      keywords: Array.isArray(fm.keywords) ? fm.keywords.join(', ') : fm.keywords
    })
    for (const s of secs) {
      if (s.title) setDot(i18nPatch, `blog.${fm.slug}.${s.key}.title`, s.title)
      setDot(i18nPatch, `blog.${fm.slug}.${s.key}.body`, s.body)
    }
  }

  if (!entries.length) continue
  totalEntries += entries.length

  const blogPath = path.join(I18N, lang + '.json')
  const blogJson = fs.existsSync(blogPath) ? JSON.parse(fs.readFileSync(blogPath, 'utf8')) : {}
  const existing = Array.isArray(blogJson.blog) ? blogJson.blog : []
  const bySlog = new Map(existing.map((e) => [e.slug, e]))
  for (const e of entries) bySlog.set(e.slug, e)
  const merged = [...bySlog.values()]

  if (dryRun) {
    console.log(`${lang}: would register ${entries.length} article(s) (blog.json ${existing.length} -> ${merged.length})`)
    continue
  }
  fs.writeFileSync(BLOG, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  fs.writeFileSync(blogPath, JSON.stringify(blogJson, null, 2) + '\n', 'utf8')
  console.log(`${lang}: registered ${entries.length} article(s); blog.json now ${merged.length}`)
}

// The i18n body text goes into src/i18n/<lang>.json, not the flat payload; the
// en values are written directly (deepMerge on other locales inherits en).
if (!dryRun && totalEntries) {
  console.log(`\n${totalEntries} article(s) registered from markdown.`)
  console.log('NOTE: run `node .zcode-check/key-parity.cjs` — other locales inherit en bodies by design.')
}
