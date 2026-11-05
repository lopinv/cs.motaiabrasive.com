/**
 * Merge a translated tail (.zcode-check/tails/<code>.tail.out.json) into the
 * head payload (.zcode-check/locales-v2/<code>.json) to produce a FULL locale.
 *
 *   node .zcode-check/merge-tail.cjs <code>
 *
 * Checks before writing:
 *   - tail JSON parses; every input key present; no extra keys
 *   - placeholder tokens preserved for every key that has them in English
 *   - the merged payload covers all 579 en leaf paths
 * Writes the merged payload back to locales-v2/<code>.json (flat dotted form,
 * same shape the generator consumes).
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const PAY = path.join(__dirname, 'locales-v2')
const TAILS = path.join(__dirname, 'tails')
const en = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'en.json'), 'utf8'))

function leafEntries(o, prefix = '', out = []) {
  for (const [k, v] of Object.entries(o)) {
    const np = prefix ? prefix + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) leafEntries(v, np, out)
    else out.push([np, v])
  }
  return out
}
const enLeaves = leafEntries(en)
const enSet = new Set(enLeaves.map(([k]) => k))
const TOK = /\{[a-z]+\}/g
const enTok = {}
for (const [k, v] of enLeaves) {
  if (typeof v === 'string' && TOK.test(v)) enTok[k] = [...v.match(TOK)]
}

const codes = process.argv.slice(2)
if (!codes.length) { console.log('usage: node merge-tail.cjs <code> [...]'); process.exit(2) }

let failed = 0
for (const code of codes) {
  const inPath = path.join(TAILS, code + '.tail.json')
  const outPath = path.join(TAILS, code + '.tail.out.json')
  const payPath = path.join(PAY, code + '.json')
  if (!fs.existsSync(outPath)) { console.log(`${code}: NO tail output (${path.basename(outPath)}) — skipped`); failed++; continue }

  const work = JSON.parse(fs.readFileSync(inPath, 'utf8'))
  const tail = JSON.parse(fs.readFileSync(outPath, 'utf8'))
  const head = JSON.parse(fs.readFileSync(payPath, 'utf8'))

  const missing = Object.keys(work).filter((k) => !(k in tail))
  const extra = Object.keys(tail).filter((k) => !(k in work))
  if (missing.length || extra.length) {
    console.log(`${code}: FAIL — tail missing ${missing.length}, extra ${extra.length}${missing.length ? ' e.g. ' + missing.slice(0, 3) : ''}`)
    failed++
    continue
  }

  // Deep-merge the tail over the head: a tail value may be an OBJECT
  // (e.g. "gloss.alum" = {def}) while the head holds the same key as an
  // object too — a shallow spread would keep the head's English inner
  // values and silently drop the translation. Merge leaf-wise so the
  // tail's translated leaves win.
  const deepMerge = (base, over) => {
    const out = { ...base }
    for (const [k, v] of Object.entries(over)) {
      const b = out[k]
      out[k] = (v && typeof v === 'object' && !Array.isArray(v) && b && typeof b === 'object' && !Array.isArray(b))
        ? deepMerge(b, v)
        : v
    }
    return out
  }
  const merged = deepMerge(head, tail)

  // placeholder survival across the merged result
  const tokFail = []
  for (const [k, toks] of Object.entries(enTok)) {
    if (!(k in merged)) continue
    const v = merged[k]
    if (typeof v !== 'string' || toks.some((t) => !v.includes(t))) tokFail.push(k)
  }
  if (tokFail.length) {
    console.log(`${code}: FAIL — placeholder lost on ${tokFail.length} key(s): ${tokFail.slice(0, 5).join(', ')}`)
    failed++
    continue
  }

  const covered = Object.keys(merged).filter((k) => enSet.has(k)).length
  const idKeys = ['code', 'name', 'codeLabel', 'htmlLang', 'ogLocale', 'rtl']
  const missingId = idKeys.filter((k) => !(k in merged))
  if (covered < enLeaves.length || missingId.length) {
    console.log(`${code}: FAIL — covers ${covered}/${enLeaves.length} en keys; missing id keys: ${missingId.join(',') || 'none'}`)
    failed++
    continue
  }

  fs.writeFileSync(payPath, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  console.log(`${code}: merged OK — ${Object.keys(merged).length} keys (head ${Object.keys(head).length} + tail ${Object.keys(tail).length}), covers ${covered}/${enLeaves.length} en paths`)
}
process.exit(failed ? 1 : 0)
