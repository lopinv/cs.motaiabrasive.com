/**
 * Build-time Merchant Center feed generator.
 *
 * Emits a B2B "request a quote" products.csv (UTF-8 with BOM, the encoding
 * Google Merchant Center expects) into dist/ so Cloudflare Pages publishes
 * it alongside the site. Zero Workers, zero server code: the CSV is a plain
 * static artifact. Point the Merchant Center b2b data source at
 * <SITE_URL>/products.csv.
 *
 * Why "preorder" availability + no price: the catalog is quote-driven B2B —
 * every source product is price 0 / available false. The feed therefore
 * omits real prices and uses availability=preorder so Google shows items in
 * a quote-request state instead of rejecting them for a missing price. The
 * Merchant account MUST carry the b2b tag, otherwise preorder/price-less
 * items are flagged invalid.
 *
 * Run via `npm run build` (postbuild) or `node scripts/gen-feed.mjs` directly.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => JSON.parse(readFileSync(path.join(root, 'src/data', rel), 'utf8'))

const products = read('products.json')
const models = read('models.json')
const discViews = read('disc-views.json')
const flaps = read('flap.json')
const site = read('site.json')

// Production domain (GitHub Pages + CNAME); SITE_URL honoured for preview builds.
const base = (process.env.SITE_URL || 'https://cs.motaiabrasive.com').replace(/\/$/, '')
const mainLang = process.env.FEED_LANG || 'en'
// Every locale the site builds (mirrors src/lib/i18n.js glob + gen-seo).
const i18nDir = path.join(root, 'src/i18n')
const allLangs = readdirSync(i18nDir).map((f) => f.replace(/\.json$/, '')).filter(Boolean)
// Google's content_language / locale columns want a bare language code.
const short = (code) => code.slice(0, 2) // 'zh-Hant' -> 'zh', 'hi' -> 'hi'
// Shopify CDN cache-buster constant kept in lockstep with src/lib/utils.js media()
const media = (key) => `${site.mediaBase}/${key}.webp?v=183101063718712166531793254213`

/** CSV-safe: always quote, double any embedded quotes. */
const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

const COLS = [
  'id', 'title', 'description', 'link', 'image_link',
  'availability', 'item_condition', 'offer_condition', 'brand', 'product_type',
  'google_product_category', 'content_language', 'locale',
  'additional_item_attribute(sku)'
]

/** Build the 30-item row set for one language (link + language columns localized). */
function rowsFor(lang) {
  const contentLang = short(lang)
  const make = (id, title, description, itemPath, image, category) => [
    cell(id),
    cell(title),
    cell(description),
    cell(`${base}/${lang}${itemPath}/`),
    cell(media(image)),
    cell('preorder'),
    cell('new'),
    cell('new'),
    cell('MoTai Abrasives'),
    cell(category),
    // Google category ID for "Tools > Tool Accessories" — verify against the
    // Merchant Center category picker (IDs change occasionally).
    cell('222'),
    cell(contentLang),
    cell(contentLang),
    cell(id)
  ].join(',')

  const rows = []
  for (const p of products) {
    rows.push(make(p.handle, p.name, p.summary, `/products/${p.handle}`, p.image, p.category))
  }
  for (const m of models) {
    rows.push(make(m.model, `Abrasive belt model ${m.model}`, m.source || `Reference belt model ${m.model} from the MoTai abrasive range; dimensions, grit and backing are confirmed with the quotation.`, `/model/${m.slug}`, 'belt-533-75', 'Abrasive Belts'))
  }
  for (const d of discViews) {
    const spec = [d.diameter, d.abrasive, d.attachment, d.grits?.length ? `grits ${d.grits.join('/').replace(/^P/g, '')}` : ''].filter(Boolean).join(', ')
    rows.push(make(d.key, d.title, `${d.title}. ${spec}. Confirm grit, size and packaging with the quotation.`, `/disc/${d.key}`, d.image, 'Sanding Discs'))
  }
  for (const f of flaps) {
    rows.push(make(f.key, f.name, f.summary, `/flap/${f.key}`, f.image, 'Flap Discs'))
  }
  return rows
}

const csvOf = (rows) => COLS.join(',') + '\n' + rows.join('\n') + '\n'
const outDir = path.join(root, 'dist')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
// 0xFEFF = BOM; Google's CSV parser requires a BOM to detect UTF-8.
// csvOf prepends the header row and joins the item rows with newlines —
// passing the raw array here (previously) let JS join() it comma-separated,
// collapsing all 30 items onto one line (broke the line count).
const emit = (file, rows) => writeFileSync(path.join(outDir, file), '\uFEFF' + csvOf(rows), 'utf8')

// Primary feed (the Merchant b2b data source): products.csv, language = mainLang.
const primaryRows = rowsFor(mainLang)
emit('products.csv', primaryRows)
console.log(`[gen-feed] wrote dist/products.csv — ${primaryRows.length} items (availability=preorder, b2b, lang=${mainLang})`)

// Per-language feeds (products.<lang>.csv) for every other locale, so
// Merchant region-specific data sources can point at the matching file.
let extra = 0
for (const l of allLangs) {
  if (l === mainLang) continue
  emit(`products.${l}.csv`, rowsFor(l))
  extra++
}
console.log(`[gen-feed] wrote ${extra} per-language feeds (products.<lang>.csv, one per locale)`)
