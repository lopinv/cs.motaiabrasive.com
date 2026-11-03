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
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => JSON.parse(readFileSync(path.join(root, 'src/data', rel), 'utf8'))
const site = read('site.json')

const base = (process.env.SITE_URL || 'https://motai-abrasives.pages.dev').replace(/\/$/, '')

/* ---------- robots.txt ---------- */
const robots = `# MoTai Abrasives — static showcase site
User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`
writeFileSync(path.join(root, 'dist/robots.txt'), robots)

/* ---------- sitemap.xml (with image:image) ---------- */
// Read i18n dir to enumerate languages (mirrors src/lib/i18n.js glob at
// build time; keeping the node script dependency-free).
const i18nDir = path.join(root, 'src/i18n')
const langs = readdirSync(i18nDir)
  .map((f) => f.replace(/\.json$/, ''))
  .sort() // deterministic order, en last not required — keep alphabetical

// Remote CDN image URL — must stay in lockstep with src/lib/utils.js media()
// (cache-buster query included: Google's image sitemaps require the same
// absolute URL the page actually serves).
const media = (key) => `${site.mediaBase}/${key}.webp?v=183101063718712166531793254213`

// Static per-lang routes
const staticRoutes = ['', '/about', '/factory', '/oem', '/applications', '/blog', '/contact', '/privacy', '/quote', '/clients', '/glossary']
const collections = ['abrasive-belts', 'sanding-discs', 'flap-discs', 'all']

// Data-driven routes
const products = read('products.json')
const models = read('models.json')
const discViews = read('disc-views.json')
const flaps = read('flap.json')
const blog = read('blog.json')
const applications = read('applications.json')

// One representative image per product-listed page type (the page's main
// image, same key the page renders). Model pages all show the 533×75 belt.
const productImgs = new Map()
for (const p of products) productImgs.set(`/products/${p.handle}`, p.image)
for (const m of models) productImgs.set(`/model/${m.slug}`, 'belt-533-75')
for (const d of discViews) productImgs.set(`/disc/${d.key}`, d.image)
for (const f of flaps) productImgs.set(`/flap/${f.key}`, f.image)
const blogImgs = new Map(blog.map((a) => [a.slug, a.image]))

const dataPaths = [
  ...products.map((p) => `/products/${p.handle}`),
  ...models.map((m) => `/model/${m.slug}`),
  ...discViews.map((d) => `/disc/${d.key}`),
  ...flaps.map((f) => `/flap/${f.key}`),
  ...blog.map((a) => `/blog/${a.slug}`),
  ...applications.map((a) => `/applications/${a.slug}`)
]

const xmlUrls = []
for (const lang of langs) {
  // Canonical convention: directory-style trailing slash for every non-root
  // page (Pages serves <dir>/index.html only at <dir>/, no-slash 308s).
  const p = (tail) => `${base}/${lang}${tail}/`
  const push = (loc, imageKey) => {
    const img = imageKey ? media(imageKey) : null
    xmlUrls.push(
      `  <url>\n` +
        `    <loc>${loc}</loc>\n` +
        (img ? `    <image:>\n      <image:loc>${img}</image:loc>\n    </image:>\n` : '') +
        `  </url>`
    )
  }
  for (const r of staticRoutes) push(r === '' ? p('') : p(r))
  for (const c of collections) push(p(`/collections/${c}`))
  for (const d of dataPaths) {
    const key = d.replace(/^\//, '')
    const imgKey = key.startsWith('blog/') ? blogImgs.get(key.slice(5)) : productImgs.get(d)
    push(p(d), imgKey)
  }
}
// Root index (no lang prefix) renders SITE_LANG build default; list once.
// (the loop above only emits lang-prefixed URLs, so the root is never duplicated)
xmlUrls.unshift(
  `  <url>\n    <loc>${base}/</loc>\n  </url>`
)

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
  `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.0">\n` +
  xmlUrls.join('\n') + '\n' +
  '</urlset>\n'

writeFileSync(path.join(root, 'dist/sitemap.xml'), xml)
const imgCount = (xml.match(/<image:loc>/g) || []).length
console.log(`[gen-seo] wrote dist/robots.txt + dist/sitemap.xml — ${xmlUrls.length} URLs across ${langs.length} langs (${imgCount} image entries), base=${base}`)
