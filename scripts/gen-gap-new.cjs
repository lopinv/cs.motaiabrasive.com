/**
 * Emit per-locale "gap" payloads for the text blocks added by the page
 * enrichment pass (quotePage / coltBuy / oem / clients).
 *
 *   node scripts/gen-gap-new.cjs [locale ...]
 *
 * Writes .zcode-check/tails/<locale>.new.gap.json — a flat map of dotted key
 * → English string, containing ONLY the keys that locale still lacks.
 * Array values (the coltBuy.<line>[i] FAQ pairs) are flattened to
 * `<key>[i].<field>` so they can be translated and merged back.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n', 'en.json'), 'utf8'))
const SCOPES = [/^quotePage\./, /^coltBuy/, /^oem\./, /^clients\./]
const inScope = (k) => SCOPES.some((re) => re.test(k))

/** Collect dotted leaf paths; arrays are flattened with [i] indices. */
function paths(o, p, acc) {
  for (const k of Object.keys(o)) {
    const np = p ? p + '.' + k : k
    const v = o[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) paths(v, np, acc)
    else if (Array.isArray(v)) {
      v.forEach(function (el, i) {
        const ip = np + '[' + i + ']'
        if (el && typeof el === 'object' && !Array.isArray(el)) paths(el, ip, acc)
        else acc.set(ip, el)
      })
    } else acc.set(np, v)
  }
  return acc
}

/** Resolve a dotted path that may contain [i] indices into the object. */
function val(k) {
  const parts = k.match(/[^.[\]]+|\[\d+\]/g) || []
  let cur = en
  for (const p of parts) {
    if (cur == null) return undefined
    cur = p[0] === '[' ? cur[p.slice(1, -1)] : cur[p]
  }
  return cur
}

const enMap = paths(en, '', new Map())

const locales = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(root, 'src', 'i18n'))
      .filter((f) => f.endsWith('.json') && f !== 'en.json')
      .map((f) => f.replace('.json', ''))

let total = 0
for (const loc of locales) {
  const cur = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', loc + '.json'), 'utf8'))
  const have = paths(cur, '', new Map())
  const out = {}
  for (const k of enMap.keys()) {
    if (!inScope(k) || have.has(k)) continue
    const v = val(k)
    if (typeof v !== 'string') continue
    out[k] = v
  }
  const dest = path.join(root, '.zcode-check', 'tails', loc + '.new.gap.json')
  fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n')
  total += Object.keys(out).length
  console.log(loc + ': ' + Object.keys(out).length + ' keys')
}
console.log('--- total: ' + total + ' ---')
