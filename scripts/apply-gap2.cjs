/**
 * Check + merge a translated gap payload for the two enrichment batches
 * (page-enrichment keys + sponge products).
 *
 *   node scripts/apply-gap2.cjs <locale>
 *
 * Input : .zcode-check/tails/<locale>.gap2.json        (English, gap)
 *         .zcode-check/tails/<locale>.gap2.out.json    (translated, gap)
 * Output: src/i18n/<locale>.json                       (merged, in place)
 *
 * Checks, before merging:
 *   1. parses and is a flat object
 *   2. key set identical to the gap input
 *   3. every value is a non-empty string
 *   4. placeholder tokens ({title},{count},{line} …) match the source per key
 *   5. no CJK in a non-CJK locale
 *   6. no value identical to the English source, unless that source is itself
 *      CJK or a sanctioned token
 *   7. no Cyrillic homoglyphs in a non-Cyrillic locale
 *
 * A key the locale already carries is left alone, so a re-run is safe.
 */
const fs = require('fs')
const path = require('path')

const locale = process.argv[2]
if (!locale) {
  console.log('usage: apply-gap2.cjs <locale>')
  process.exit(1)
}

const root = path.resolve(__dirname, '..')
const tails = path.join(root, '.zcode-check', 'tails')
const srcPath = path.join(tails, locale + '.gap2.json')
const outPath = path.join(tails, locale + '.gap2.out.json')
const destPath = path.join(root, 'src', 'i18n', locale + '.json')

const fail = []
const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
let out
try {
  out = JSON.parse(fs.readFileSync(outPath, 'utf8'))
} catch (e) {
  console.log(locale + ': PARSE FAIL — ' + e.message)
  process.exit(1)
}

const sk = Object.keys(src)
const ok = Object.keys(out)
if (sk.length !== ok.length) fail.push('key count ' + ok.length + ' != ' + sk.length)
for (const k of sk) if (!(k in out)) fail.push('missing key ' + k)
for (const k of ok) if (!(k in src)) fail.push('extra key ' + k)

const CJK_OK = new Set(['zh', 'zh-Hant', 'ja', 'ko'])
const CYR_OK = new Set(['ru', 'uk', 'sr', 'bg'])
const SAME_OK = new Set(['OEM', 'PSA', 'mm', 'rpm', 'YouTube', 'Video', 'ASMR', 'FEPA', 'ISO 848'])
const TOK = /\{[a-z]+\}/g
let empty = 0, ph = 0, cjk = 0, same = 0, cyr = 0

for (const k of sk) {
  const a = src[k]
  const b = out[k]
  if (typeof b !== 'string' || !b.trim()) { empty++; continue }
  const pa = [...String(a).matchAll(TOK)].map((m) => m[0]).sort().join(',')
  const pb = [...b.matchAll(TOK)].map((m) => m[0]).sort().join(',')
  if (pa !== pb) ph++
  if (!CJK_OK.has(locale) && /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(b)) cjk++
  if (!CYR_OK.has(locale) && /[\u0400-\u04FF]/.test(b)) cyr++
  if (b.trim() === String(a).trim() && !SAME_OK.has(String(a).trim()) && !/[\u4e00-\u9fff]/.test(String(a))) same++
}

if (empty) fail.push('empty values: ' + empty)
if (ph) fail.push('placeholder mismatches: ' + ph)
if (cjk) fail.push('CJK characters in non-CJK locale: ' + cjk)
if (cyr) fail.push('Cyrillic characters in non-Cyrillic locale: ' + cyr)
if (same) fail.push('untranslated (identical to English): ' + same)

if (fail.length) {
  console.log(locale + ': FAIL (' + sk.length + ' keys)')
  fail.forEach((f) => console.log('  - ' + f))
  process.exit(1)
}

// ---- merge into the locale file ------------------------------------------
// Path segments come in two shapes: `foo` (object key) and `[0]` (array index).
// An index segment must land on an array, never an object keyed "0", otherwise
// the merged structure no longer matches en.json and key-parity reports
// spurious missing/extra pairs.
const raw = fs.readFileSync(destPath, 'utf8')
const obj = JSON.parse(raw)
const crlf = raw.includes('\r\n') && !/(?<!\r)\n/.test(raw)
let set = 0
let kept = 0
for (const [dotted, value] of Object.entries(out)) {
  const segs = dotted.match(/[^.[\]]+|\[\d+\]/g) || []
  let node = obj
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    const next = segs[i + 1]
    const wantArray = next[0] === '['
    const key = seg[0] === '[' ? seg.slice(1, -1) : seg
    if (node[key] === undefined) node[key] = wantArray ? [] : {}
    // Repair an object-keyed-by-index left by an earlier bad merge.
    if (wantArray && !Array.isArray(node[key])) {
      const fix = []
      for (const k of Object.keys(node[key]).sort((a, b) => Number(a) - Number(b))) fix.push(node[key][k])
      node[key] = fix
    }
    if (!wantArray && Array.isArray(node[key])) node[key] = Object.assign({}, node[key])
    node = node[key]
  }
  const leaf = segs[segs.length - 1]
  const leafKey = leaf[0] === '[' ? leaf.slice(1, -1) : leaf
  if (node[leafKey] === undefined) {
    node[leafKey] = value
    set++
  } else {
    kept++
  }
}
let text = JSON.stringify(obj, null, 2) + '\n'
if (crlf) text = text.replace(/\n/g, '\r\n')
fs.writeFileSync(destPath, text)
console.log(locale + ': OK — ' + sk.length + ' keys checked, merged set=' + set + ' kept=' + kept)
