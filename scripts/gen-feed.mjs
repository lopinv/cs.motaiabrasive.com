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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => JSON.parse(readFileSync(path.join(root, 'src/data', rel), 'utf8'))

const products = read('products.json')
const models = read('models.json')
const discViews = read('disc-views.json')
const flaps = read('flap.json')
const site = read('site.json')

const base = (process.env.SITE_URL || 'https://motai-abrasives.pages.dev').replace(/\/$/, '')
const lang = process.env.FEED_LANG || 'en'
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

function row(p) {
  const id = p.id
  return [
    cell(id),
    cell(p.title),
    cell(p.description),
    cell(`${base}/${lang}${p.path}/`),
    cell(media(p.image)),
    cell('preorder'),
    cell('new'),
    cell('new'),
    cell('MoTai Abrasives'),
    cell(p.category),
    // Google category ID for "Tools > Tool Accessories" — verify against the
    // Merchant Center category picker (IDs change occasionally).
    cell('222'),
    cell('en'),
    cell('en'),
    cell(id)
  ].join(',')
}

const rows = []
for (const p of products) {
  rows.push(row({
    id: p.handle,
    title: p.name,
    description: p.summary,
    path: `/products/${p.handle}`,
    image: p.image,
    category: p.category
  }))
}
for (const m of models) {
  rows.push(row({
    id: m.model,
    title: `Abrasive belt model ${m.model}`,
    description: m.source || `Reference belt model ${m.model} from the MoTai abrasive range; dimensions, grit and backing are confirmed with the quotation.`,
    path: `/model/${m.slug}`,
    image: 'belt-533-75',
    category: 'Abrasive Belts'
  }))
}
for (const d of discViews) {
  const spec = [d.diameter, d.abrasive, d.attachment, d.grits?.length ? `grits ${d.grits.join('/').replace(/^P/g, '')}` : ''].filter(Boolean).join(', ')
  rows.push(row({
    id: d.key,
    title: d.title,
    description: `${d.title}. ${spec}. Confirm grit, size and packaging with the quotation.`,
    path: `/disc/${d.key}`,
    image: d.image,
    category: 'Sanding Discs'
  }))
}
for (const f of flaps) {
  rows.push(row({
    id: f.key,
    title: f.name,
    description: f.summary,
    path: `/flap/${f.key}`,
    image: f.image,
    category: 'Flap Discs'
  }))
}

const csv = COLS.join(',') + '\n' + rows.join('\n') + '\n'
const outDir = path.join(root, 'dist')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
// 0xFEFF = BOM; Google's CSV parser requires a BOM to detect UTF-8.
writeFileSync(path.join(outDir, 'products.csv'), '\uFEFF' + csv)
console.log(`[gen-feed] wrote dist/products.csv — ${rows.length} items (availability=preorder, b2b)`)
