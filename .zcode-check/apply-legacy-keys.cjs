/**
 * Insert a translated flat-key tail (.zcode-check/tails/<code>.tail.out.json)
 * into a NESTED legacy locale file (src/i18n/<code>.json) at the dotted paths,
 * deep-inserting intermediate objects. Idempotent; never touches other keys.
 *
 *   node .zcode-check/apply-legacy-keys.cjs <code> ...
 *
 * Unlike apply-legacy-tail.cjs (which special-cased the shipping page), this
 * handles any i18n payload keys — pfq.*, relArticles.* etc.
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
if (!codes.length) { console.log('usage: node apply-legacy-keys.cjs <code> [...]'); process.exit(2) }

let failed = 0
for (const code of codes) {
  const tailPath = path.join(TAILS, code + '.tail.out.json')
  const locPath = path.join(I18N, code + '.json')
  if (!fs.existsSync(tailPath)) { console.log(`${code}: no tail output — skipped`); failed++; continue }
  const tail = JSON.parse(fs.readFileSync(tailPath, 'utf8'))
  if (!Object.keys(tail).some((k) => /^(pfq|relArticles)\./.test(k))) { console.log(`${code}: tail has no pfq/relArticles keys — skipped`); failed++; continue }
  const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'))
  const before = JSON.stringify(loc)
  let n = 0
  for (const [k, v] of Object.entries(tail)) {
    if (!/^(pfq|relArticles)\./.test(k)) continue // shipping keys already applied
    setDot(loc, k, v)
    n++
  }
  const after = JSON.stringify(loc)
  if (n === 0 || after === before) { console.log(`${code}: nothing applied`); failed++; continue }
  fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + '\n', 'utf8')
  console.log(`${code}: applied ${n} keys`)
}
process.exit(failed ? 1 : 0)
