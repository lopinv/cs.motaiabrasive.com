/**
 * Emit the "tail" worklist for head-only locale payloads: every en leaf key
 * path the payload does NOT yet translate, paired with the English source
 * value. The agent translates this list; the result is merged back over the
 * head payload to produce a full 579-key locale.
 *
 * Output: .zcode-check/tails/<code>.tail.json  = { "<dotted.path>": "<en value>" }
 * Usage: node .zcode-check/make-tail.cjs [code ...]
 */
const fs = require('fs')
const path = require('path')

const I18N = path.join(__dirname, '..', 'src', 'i18n')
const PAY = path.join(__dirname, 'locales-v2')
const OUT = path.join(__dirname, 'tails')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

const en = JSON.parse(fs.readFileSync(path.join(I18N, 'en.json'), 'utf8'))

function leafEntries(o, prefix = '', out = []) {
  for (const [k, v] of Object.entries(o)) {
    const np = prefix ? prefix + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) leafEntries(v, np, out)
    else out.push([np, v])
  }
  return out
}
const enLeaves = leafEntries(en)

const codes = process.argv.slice(2)
if (!codes.length) {
  // default: every locale that is still head-only OR missing any en key
  for (const f of fs.readdirSync(PAY)) {
    const code = f.replace(/\.json$/, '')
    const payload = JSON.parse(fs.readFileSync(path.join(PAY, f), 'utf8'))
    const have = new Set(Object.keys(payload))
    const missing = enLeaves.filter(([k]) => !have.has(k))
    if (Object.keys(payload).length < 500 || missing.length) codes.push(code)
  }
}

for (const code of codes) {
  const p = path.join(PAY, code + '.json')
  if (!fs.existsSync(p)) { console.log(code + ': payload missing'); continue }
  const payload = JSON.parse(fs.readFileSync(p, 'utf8'))
  const have = new Set(Object.keys(payload))
  const missing = enLeaves.filter(([k]) => !have.has(k))
  const tail = {}
  for (const [k, v] of missing) tail[k] = v
  const out = path.join(OUT, code + '.tail.json')
  fs.writeFileSync(out, JSON.stringify(tail, null, 2) + '\n', 'utf8')
  console.log(`${code}: ${missing.length} key(s) to translate -> ${path.relative(path.join(__dirname, '..'), out)}`)
}
