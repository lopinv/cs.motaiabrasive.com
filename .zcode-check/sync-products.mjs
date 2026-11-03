/**
 * Product sync check between the live source site and this static build.
 * Usage:
 *   node .zcode-check\sync-products.mjs fetch   # refresh live snapshot
 *   node .zcode-check\sync-products.mjs diff    # diff cached snapshot vs local data + dist
 * Exits 1 on any out-of-sync finding so it can gate a deploy.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const TMP = path.join(process.env.TEMP || 'C:\\Temp', 'motai-products-live.json')

const norm = (x) => String(x).toLowerCase().replace(/×/g, 'x').replace(/\s+/g, ' ')
const parseText = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const sizesOf = (txt) => {
  const m = txt.match(/Sizes:\s*(.+?)\.\s*Grits:/i)
  return m ? m[1].split(',').map((s) => s.trim()) : []
}
const gritsOf = (txt) => {
  const m = txt.match(/Grits:\s*(.+?)\.\s*(Wholesale|Specifications|MOQ)/i)
  return m ? m[1].split(',').map((s) => s.trim()) : []
}

const cmd = process.argv[2] || 'diff'
if (cmd === 'fetch') {
  const res = await fetch('https://www.motaiabrasive.com/products.json?limit=250', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) moTai-static-sync-check' }
  })
  if (!res.ok) {
    console.error('products.json fetch failed: HTTP ' + res.status)
    process.exit(2)
  }
  const data = await res.json()
  fs.writeFileSync(TMP, JSON.stringify(data, null, 2))
  console.log('fetched ' + data.products.length + ' live products -> ' + TMP)
  process.exit(0)
}

if (!fs.existsSync(TMP)) {
  console.error('no live snapshot: run "node .zcode-check\\sync-products.mjs fetch" first')
  process.exit(2)
}
const liveJson = JSON.parse(fs.readFileSync(TMP, 'utf8'))
const live = liveJson.products

const local = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'products.json'), 'utf8'))
const localByHandle = Object.fromEntries(local.map((p) => [p.handle, p]))
let problems = 0
const fail = (msg) => { console.log('  OUT-OF-SYNC :: ' + msg); problems++ }

console.log('--- handle sets ---')
const liveHandles = live.map((p) => p.handle).sort()
const localHandles = local.map((p) => p.handle).sort()
for (const h of liveHandles) if (!localHandles.includes(h)) fail('live handle missing locally: ' + h)
for (const h of localHandles) if (!liveHandles.includes(h)) fail('stale local handle (deleted upstream): ' + h)

console.log('--- sizes / grits diff (normalized) ---')
for (const p of live) {
  const txt = parseText(p.body_html)
  const lSizes = sizesOf(txt).map(norm)
  const lGrits = gritsOf(txt).map(norm)
  const loc = localByHandle[p.handle]
  if (!loc) continue
  if (JSON.stringify(lSizes) !== JSON.stringify((loc.sizes ?? []).map(norm)))
    fail(p.handle + ' sizes: live=' + JSON.stringify(lSizes) + ' local=' + JSON.stringify((loc.sizes ?? []).map(norm)))
  if (JSON.stringify(lGrits) !== JSON.stringify((loc.grits ?? []).map(norm)))
    fail(p.handle + ' grits: live=' + JSON.stringify(lGrits) + ' local=' + JSON.stringify((loc.grits ?? []).map(norm)))
}

console.log('--- dist coverage ---')
const distDir = path.join(root, 'dist')
if (fs.existsSync(distDir)) {
  let ok = 0
  for (const h of liveHandles) {
    const page = path.join(distDir, 'en', 'products', h, 'index.html')
    if (fs.existsSync(page)) ok++
    else fail('missing dist page: /en/products/' + h)
  }
  console.log('  dist pages for live handles: ' + ok + '/' + liveHandles.length)
} else {
  console.log('  dist/ not built yet — run npm run build, then re-check')
}

console.log(problems === 0
  ? 'SYNC OK — live source and static site product sets match (' + localHandles.length + ' products, sizes/grits aligned)'
  : problems + ' out-of-sync issue(s) found')
process.exit(problems === 0 ? 0 : 1)
