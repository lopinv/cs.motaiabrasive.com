/**
 * Structural gate for a translated video tail payload, before it is merged.
 *
 *   node scripts/check-video-tail.cjs <locale>
 *
 * Checks, per payload:
 *   1. parses as JSON, is a flat object
 *   2. key set and key count identical to videos.tail.json
 *   3. every value is a non-empty string
 *   4. placeholder tokens ({title},{line},{count},{name},{grits},{sizes},{desc})
 *      match the source exactly, per key
 *   5. no CJK characters in the output unless the locale is zh/zh-Hant/ja
 *   6. no value is identical to the English source (untranslated pass-through),
 *      except keys where English == the sanctioned token (e.g. "OEM")
 *
 * Exits non-zero on any failure so the merge step can be gated on it.
 */
const fs = require('fs')
const path = require('path')

const locale = process.argv[2]
if (!locale) {
  console.log('usage: check-video-tail.cjs <locale>')
  process.exit(1)
}

const root = path.resolve(__dirname, '..')
const tails = path.join(root, '.zcode-check', 'tails')
// Two payload shapes are supported:
//   gap  — <locale>.videos.gap.json   → <locale>.videos.gap.out.json
//   full — videos.tail.json           → <locale>.videos.out.json
// The checker validates whichever pair is present, so a gap translation is
// checked against its own (smaller) input and a full one against the full set.
const gapIn = path.join(tails, locale + '.videos.gap.json')
const gapOut = path.join(tails, locale + '.videos.gap.out.json')
const fullIn = path.join(tails, 'videos.tail.json')
const fullOut = path.join(tails, locale + '.videos.out.json')
let inPath, outPath
if (fs.existsSync(gapIn) && fs.existsSync(gapOut)) {
  inPath = gapIn
  outPath = gapOut
} else if (fs.existsSync(fullIn) && fs.existsSync(fullOut)) {
  inPath = fullIn
  outPath = fullOut
} else {
  console.log(locale + ': no payload pair found — run a translation first')
  process.exit(1)
}

const src = JSON.parse(fs.readFileSync(inPath, 'utf8'))
const fail = []
let out
try {
  out = JSON.parse(fs.readFileSync(outPath, 'utf8'))
} catch (e) {
  console.log(locale + ': PARSE FAIL — ' + e.message)
  process.exit(1)
}

const sk = Object.keys(src)
const ok = Object.keys(out)
if (sk.length !== ok.length) fail.push(`key count ${ok.length} != ${sk.length}`)
for (const k of sk) if (!(k in out)) fail.push('missing key ' + k)
for (const k of ok) if (!(k in src)) fail.push('extra key ' + k)

// CJK_OK: locales whose output legitimately contains CJK-family characters
// (Chinese, Japanese, Korean). For these, the check only flags cross-script
// leaks, not native script. 'ko' uses Hangul (\uac00-\ud7af) which the scan
// pattern matches, so it must be whitelisted like zh/ja.
const CJK_OK = new Set(['zh', 'zh-Hant', 'ja', 'ko'])
const TOK = /\{[a-z]+\}/g
let empty = 0, ph = 0, cjk = 0, same = 0
for (const k of sk) {
  const a = src[k]
  const b = out[k]
  if (typeof b !== 'string' || !b.trim()) { empty++; continue }
  const pa = [...String(a).matchAll(TOK)].map((m) => m[0]).sort()
  const pb = [...b.matchAll(TOK)].map((m) => m[0]).sort()
  if (JSON.stringify(pa) !== JSON.stringify(pb)) ph++
  if (!CJK_OK.has(locale) && /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(b)) cjk++
  if (b.trim() === String(a).trim()) same++
}

// "Video" is the correct word in da/fi/id/nl/no/sv and several others, so
// the identical-value check must exempt the keys whose English form is also the
// target-language form.
const SAME_OK = {
  'videos.videoLabel': new Set(['da', 'fi', 'id', 'nl', 'no', 'sv', 'de', 'es', 'fr', 'it', 'pt', 'pl', 'cs', 'sk', 'sl', 'hr', 'sr', 'hu', 'ro', 'et', 'lv', 'lt', 'tr', 'vi', 'ms', 'tl', 'en'])
}
const untranslated = sk.filter((k) => {
  if (typeof out[k] !== 'string') return false
  if (SAME_OK[k] && SAME_OK[k].has(locale)) return false
  // Chinese-source clips: the EN source is itself CJK, so keeping the value
  // (even identical) is correct, not an untranslated English pass-through.
  if (/[\u4e00-\u9fff]/.test(String(src[k]))) return false
  return out[k].trim() === String(src[k]).trim()
}).length

const TOKENS_OK = new Set(['OEM', 'PSA', 'mm', 'rpm', 'YouTube', 'Video', 'ASMR'])
const nonTextSame = sk.filter((k) => TOKENS_OK.has(String(src[k]).trim()) && typeof out[k] === 'string' && out[k].trim() === String(src[k]).trim()).length

if (empty) fail.push('empty values: ' + empty)
if (ph) fail.push('placeholder mismatches: ' + ph)
if (cjk) fail.push('CJK characters in non-CJK locale: ' + cjk)
if (untranslated) fail.push('untranslated (identical to English, exempt keys removed): ' + untranslated + ' (sanctioned-token matches: ' + nonTextSame + ')')

if (fail.length) {
  console.log(locale + ': FAIL (' + sk.length + ' keys)')
  fail.forEach((f) => console.log('  - ' + f))
  process.exit(1)
}
console.log(locale + ': OK — ' + sk.length + ' keys, placeholders/values/CJK all valid')
