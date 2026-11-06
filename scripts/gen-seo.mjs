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
const staticRoutes = ['', '/about', '/factory', '/oem', '/applications', '/blog', '/contact', '/privacy', '/terms', '/shipping', '/quote', '/clients', '/glossary']
const collections = ['abrasive-belts', 'sanding-discs', 'flap-discs', 'all']

// Data-driven routes
const products = read('products.json')
const models = read('models.json')
const discViews = read('disc-views.json')
const flaps = read('flap.json')
const blog = read('blog.json')
const applications = read('applications.json')

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
  const push = (loc) => {
    xmlUrls.push(`  <url>\n    <loc>${loc}</loc>\n  </url>`)
  }
  for (const r of staticRoutes) push(r === '' ? p('') : p(r))
  for (const c of collections) push(p(`/collections/${c}`))
  for (const d of dataPaths) push(p(d))
}
// Root index (no lang prefix) renders SITE_LANG build default; list once.
// (the loop above only emits lang-prefixed URLs, so the root is never duplicated)
xmlUrls.unshift(
  `  <url>\n    <loc>${base}/</loc>\n  </url>`
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
// a useful human-readable index of the site's 1595 URLs.
const txtUrls = xmlUrls
  .map((u) => u.replace(/<[^>]*>/g, '').trim())
  .filter(Boolean)
if (txtUrls.length !== xmlUrls.length) {
  console.error(`[gen-seo] sitemap.txt URL count mismatch: ${txtUrls.length} vs ${xmlUrls.length}`)
  process.exit(1)
}
writeFileSync(path.join(root, 'dist/sitemap.txt'), txtUrls.join('\n') + '\n', 'utf8')

console.log(`[gen-seo] wrote dist/robots.txt + dist/sitemap.xml — ${xmlUrls.length} URLs across ${langs.length} langs, base=${base}`)
