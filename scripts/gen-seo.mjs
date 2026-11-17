/**
 * Build-time robots.txt + sitemap.xml generator (runs after `astro build`
 * via the postbuild hook).
 *
 * Writes directly into dist/ (the Cloudflare Pages publish dir) so the
 * Sitemap line and every URL use the SITE_URL the site was actually built
 * with — public/ files would be frozen at authoring time and can't track
 * the build variable. Zero Workers, zero server code: both are static
 * artifacts published with the site.
 *
 * Run via `npm run build` (postbuild) or `node scripts/gen-seo.mjs`.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => JSON.parse(readFileSync(path.join(root, 'src/data', rel), 'utf8'))

// Production domain (GitHub Pages + CNAME). SITE_URL is honoured for preview
// builds; the default must be the canonical domain so a plain `npm run build`
// never ships a sitemap/robots pointing at the obsolete pages.dev host.
const base = (process.env.SITE_URL || 'https://cs.motaiabrasive.com').replace(/\/$/, '')

/* ---------- robots.txt ---------- */
const robots = `# MoTai Abrasives — static showcase site
User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`
writeFileSync(path.join(root, 'dist/robots.txt'), robots)
/* ---------- sitemap.xml (standard urlset only) ---------- */
// GSC's parser rejects the Google image-sitemap extension ("Failed to
// parse QName 'image:'"), so the sitemap stays a plain sitemaps.org
// urlset. Product images are indexed via the Merchant feed's image_link
// column and each page's og:image instead.
// Read i18n dir to enumerate languages (mirrors src/lib/i18n.js glob at
// build time; keeping the node script dependency-free).
const i18nDir = path.join(root, 'src/i18n')
const langs = readdirSync(i18nDir)
  .map((f) => f.replace(/\.json$/, ''))
  .sort() // deterministic order, en last not required — keep alphabetical

// Static per-lang routes
// Static per-lang routes. '/blog' is excluded: the blog index is paginated,
// so its whole URL set (root + /page/<n> + /category/<key>[/page/<n>]) comes
// from blogIndexPaths below.
const staticRoutes = ['', '/about', '/factory', '/oem', '/applications', '/contact', '/privacy', '/terms', '/shipping', '/quote', '/clients', '/glossary']
const collections = ['abrasive-belts', 'sanding-discs', 'flap-discs', 'sanding-sponges', 'all']

// Data-driven routes
const products = read('products.json')
const models = read('models.json')
const discViews = read('disc-views.json')
const flaps = read('flap.json')
const sponges = read('sponges.json')
// 视频只收录 visibleVideos：hidden 剪辑刻意不进 sitemap（与站内链接及
// /videos/ 索引页 ItemList 的过滤口径一致，只允许直链访问）。
const visibleVideos = read('videos.json').filter((v) => !v.hidden)
const blog = read('blog.json')
const applications = read('applications.json')
// The long-form blog corpus lives in articles/<lang>/*.md and is registered
// through Astro content collections (see src/content.config.ts). The sitemap
// enumerates the same slug set from disk so build order doesn't matter: the
// union of blog.json slugs and every markdown slug under articles/.
const articlesDir = path.join(root, 'articles')
const mdSlugs = new Set()
// slug → dateModified（ISO yyyy-mm-dd）的 EN 基线索引；译文日期按 lang 覆盖。
const mdDates = new Map()
// 构建日（YYYY-MM-DD）：md 之外的 URL（产品/集合/公司页等）用构建日作
// lastmod —— 每次部署刷新，向 Google 传递「本批页面有更新」的抓取信号。
const siteBuildDate = new Date().toISOString().slice(0, 10)
// slug → dateModified（ISO yyyy-mm-dd）。EN 源作为基线，各语种译文若译了
// 该 slug 则用自己的日期（per-lang 于下方循环中查 articles/<lang>/<slug>.md）。
// md 之外的所有 URL 用构建日 siteBuildDate 作为 lastmod。
const readDate = (file) => {
  if (!existsSync(file)) return null
  const m = /^dateModified:\s*(.+)$/m.exec(readFileSync(file, 'utf8'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null
}
if (existsSync(articlesDir)) {
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) { if (e.name !== '.parts') walk(p) }
      else if (e.name.endsWith('.md')) {
        const slug = e.name.replace(/\.md$/, '')
        mdSlugs.add(slug)
        // 仅 en/ 的日期进基线；译文日期在下方按 lang × slug 取
        if (dir === path.join(articlesDir, 'en')) {
          const d = readDate(p)
          if (d) mdDates.set(slug, d)
        }
      }
    }
  }
  walk(articlesDir)
}
// 每语种实有译文的 slug 集合。md 路由已按「本语种自有译文」收口
// （src/lib/articles.js 的 mdArticles），sitemap 必须同口径：只列该语种
// 真有文件的 md slug + 全语种共有的 blog.json 短文；不再为未译 slug 生成
// 英文克隆 URL。gen-article-locales.mjs 已写 src/data/article-locales.json，
// 是同一判据（articles/<lang>/<slug>.md 存在）的单一事实源。
const mdSlugsByLang = read('article-locales.json').locales

// Blog index pagination: the flat /blog index is split into 24-card pages at
// /blog/page/<n>/ (page 1 stays at /blog/), plus one chain per article
// category at /blog/category/<key>/page/<n>/. Mirrors BLOG_PAGE_SIZE in
// src/lib/blog-pager.js — keep the two in sync when either changes.
// 每语种独立计算：路由集合 = 该语种自有 md 译文 + 全语种 blog.json 短文，
// 与 allArticles(lang) 同口径（未译文种不再摊到 133 篇的英文克隆集）。
const BLOG_PAGE_SIZE = 24
const CATEGORIES = ['selection-guide', 'buyer-resources', 'application-notes', 'oem-guide']
const shortByCat = {}
for (const b of blog) {
  const c = b.categoryKey ?? 'selection-guide'
  shortByCat[c] = (shortByCat[c] ?? 0) + 1
}
// 分类计数同样按语种：md 译文的分类来自 frontmatter，逐语种读取。
const langSlugSet = (lang) => (lang === 'en' ? mdSlugs : new Set(mdSlugsByLang[lang] ?? []))
const langSlugCount = (lang) => blog.length + langSlugSet(lang).size
const catCountByLang = (lang) => {
  const counts = { ...shortByCat }
  for (const slug of langSlugSet(lang)) {
    const f = path.join(articlesDir, lang, slug + '.md')
    if (!existsSync(f)) continue
    const m = /^category:\s*(.+)$/m.exec(readFileSync(f, 'utf8'))
    if (m) {
      const c = m[1].trim()
      if (CATEGORIES.includes(c)) counts[c] = (counts[c] ?? 0) + 1
    }
  }
  return counts
}

const dataPaths = [
  ...products.map((p) => `/products/${p.handle}`),
  ...models.map((m) => `/model/${m.slug}`),
  ...discViews.map((d) => `/disc/${d.key}`),
  ...flaps.map((f) => `/flap/${f.key}`),
  ...sponges.map((s) => `/sponge/${s.key}`),
  // 只收录 visibleVideos（与站内链接/index ItemList 一致；hidden 剪辑
  // 刻意不进 sitemap，只允许直链访问）
  ...visibleVideos.map((v) => `/videos/${v.id}`),
  ...applications.map((a) => `/applications/${a.slug}`)
]

const xmlUrls = []
for (const lang of langs) {
  // Canonical convention: directory-style trailing slash for every non-root
  // page (Pages serves <dir>/index.html only at <dir>/, no-slash 308s).
  const p = (tail) => `${base}/${lang}${tail}/`
  // lastmod：md 文章页用译文（或 EN 源）的 dateModified；其它 URL 用构建日。
  const lastmodOf = (tail) => {
    const m = /^\/blog\/([^/]+)$/.exec(tail)
    if (m) {
      const d = readDate(path.join(articlesDir, lang, m[1] + '.md')) ?? mdDates.get(m[1]) ?? siteBuildDate
      return d
    }
    return siteBuildDate
  }
  const push = (tail) => {
    const loc = tail === '' ? p('') : p(tail)
    xmlUrls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmodOf(tail)}</lastmod>\n  </url>`)
  }
  for (const r of staticRoutes) push(r)
  for (const c of collections) push(`/collections/${c}`)
  for (const d of dataPaths) push(d)
  // 文章详情：本语种自有 md 译文 + 全语种 blog.json 短文。未译 slug 不再
  // 出现在任何语种的路由/sitemap（原 42×133 的英文克隆面已整体移除）。
  const slugs = langSlugSet(lang)
  for (const s of slugs) push(`/blog/${s}`)
  for (const b of blog) push(`/blog/${b.slug}`)
  // 博客索引分页链：每语种按自身文章数独立算页数（与 allArticles(lang) 同口径）。
  const total = langSlugCount(lang)
  const blogPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE))
  push('/blog')
  for (let n = 2; n <= blogPages; n++) push(`/blog/page/${n}`)
  const catCounts = catCountByLang(lang)
  for (const c of CATEGORIES) {
    const pages = Math.max(1, Math.ceil((catCounts[c] ?? 0) / BLOG_PAGE_SIZE))
    push(`/blog/category/${c}`)
    for (let n = 2; n <= pages; n++) push(`/blog/category/${c}/page/${n}`)
  }
}
// Root index (no lang prefix) renders SITE_LANG build default; list once.
// (the loop above only emits lang-prefixed URLs, so the root is never duplicated)
xmlUrls.unshift(
  `  <url>\n    <loc>${base}/</loc>\n    <lastmod>${siteBuildDate}</lastmod>\n  </url>`
)

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  xmlUrls.join('\n') + '\n' +
  '</urlset>\n'

writeFileSync(path.join(root, 'dist/sitemap.xml'), xml)

/* ---------- sitemap.txt (one URL per line) ---------- */
// Text sitemap: same URL set as the XML, one <loc> per line. Some crawlers
// and third-party SEO tools read the plain-text variant directly, and it is
// a useful human-readable index of the site's URLs.
// 只提取 <loc>（xmlUrls 现在含 <lastmod>，简单剥标签会把日期也变成一行，
// 破坏与 sitemap.xml 的一一对应）。
const txtUrls = []
for (const u of xmlUrls) {
  const m = /<loc>([^<]+)<\/loc>/.exec(u)
  if (m) txtUrls.push(m[1])
}
if (txtUrls.length !== xmlUrls.length) {
  console.error(`[gen-seo] sitemap.txt URL count mismatch: ${txtUrls.length} vs ${xmlUrls.length}`)
  process.exit(1)
}
writeFileSync(path.join(root, 'dist/sitemap.txt'), txtUrls.join('\n') + '\n', 'utf8')

console.log(`[gen-seo] wrote dist/robots.txt + dist/sitemap.xml — ${xmlUrls.length} URLs across ${langs.length} langs, base=${base}`)
