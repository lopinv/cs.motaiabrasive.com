/**
 * Insert a translated flat-key block (tails/<code>.tail.out.json) directly
 * into a NESTED locale file (src/i18n/<code>.json), recreating the nested
 * structure from the dotted paths. Used for the legacy locales that have no
 * locales-v2 payload: their shipping keys must be added in place.
 *
 *   node .zcode-check/apply-legacy-tail.cjs <code> ...
 *
 * Idempotent: re-running rewrites the same values. Never touches other keys
 * (deep clone first, setDot only on translated paths).
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const I18N = path.join(root, 'src', 'i18n')
const TAILS = path.join(__dirname, 'tails')

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

const codes = process.argv.slice(2)
if (!codes.length) { console.log('usage: node apply-legacy-tail.cjs <code> [...]'); process.exit(2) }

let failed = 0
for (const code of codes) {
  const tailPath = path.join(TAILS, code + '.tail.out.json')
  const locPath = path.join(I18N, code + '.json')
  if (!fs.existsSync(tailPath)) { console.log(`${code}: no tail output — skipped`); failed++; continue }
  const tail = JSON.parse(fs.readFileSync(tailPath, 'utf8'))
  const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'))
  const nested = {}
  for (const [k, v] of Object.entries(tail)) setDot(nested, k, v)
  // order: shipping block after terms (page-order feel), tdk.shipping last in tdk
  if (nested.shipping) {
    const out = {}
    for (const [k, v] of Object.entries(loc)) {
      out[k] = v
      if (k === 'terms') out.shipping = nested.shipping
    }
    if (!('shipping' in out)) out.shipping = nested.shipping
    if (nested.tdk?.shipping) out.tdk = { ...loc.tdk, shipping: nested.tdk.shipping }
    if (nested.footer?.shipping) out.footer = { ...loc.footer, shipping: nested.footer.shipping }
    fs.writeFileSync(locPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
    console.log(`${code}: applied ${Object.keys(tail).length} keys (shipping ${Object.keys(nested.shipping).length} + tdk/footer)`)
  } else { console.log(`${code}: tail has no shipping block — skipped`); failed++ }
}
process.exit(failed ? 1 : 0)
