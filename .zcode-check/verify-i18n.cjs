/**
 * Validate every src/i18n/*.json (incl. new locales) in one pass:
 *  - JSON parses
 *  - key tree == en.json (0 missing, 0 extra; arrays are atomic)
 *  - placeholder tokens {name}{model}{title}{backing}{sizes}{grits}{desc}
 *    {material}{category}{date} preserved wherever en has them
 *  - 6 id keys present; code matches filename; htmlLang sane (no "en" leak)
 *  - diacritics spot-check: latin locales (de/fr/it/es/pt/ru/pl/cs/sk/sv/da/no)
 *    must have at least a few non-ASCII chars (guards against an English-only
 *    file shipped under a new code)
 * Exits 1 on any failure. Read-only.
 */
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'i18n')
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'))

// dotted key paths; arrays atomic
function paths(o, p = '', out = new Set()) {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) paths(v, np, out)
    else out.add(np)
  }
  return out
}
const enPaths = paths(en)

// placeholder-bearing en paths
const TOK = /\{[a-z]+\}/g
const enTok = {}
;(function walk(o, p) {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) walk(v, np)
    else if (typeof v === 'string' && TOK.test(v)) enTok[np] = [...v.match(TOK)]
  }
})(en)

const nonAscii = (s) => /[^ -~]/.test(s)
// Codes expected to contain diacritics in their own locale text.
const DIACRITIC_REQUIRED = new Set(['de', 'fr', 'it', 'es', 'pt', 'ru', 'pl', 'cs', 'sk', 'sv', 'da', 'no', 'tr', 'lt', 'lv', 'et', 'sl', 'hr', 'ca', 'ro', 'hu', 'bg', 'sr', 'uk', 'el', 'bn'])

let failures = 0
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8')
  let obj
  try { obj = JSON.parse(raw) } catch (e) { console.log(f + ': JSON PARSE FAIL ' + e.message); failures++; continue }

  const code = f.replace(/\.json$/, '')
  const me = paths(obj)
  const missing = [...enPaths].filter((k) => !me.has(k))
  const extra = [...me].filter((k) => !enPaths.has(k))

  const tokFail = []
  for (const [np, toks] of Object.entries(enTok)) {
    const get = (o, pth) => pth.split('.').reduce((c, k) => (c ? c[k] : undefined), o)
    const lv = get(obj, np)
    if (typeof lv !== 'string' || toks.some((t) => !lv.includes(t))) tokFail.push(np + ' [en:' + toks.join('') + ' got:' + JSON.stringify(lv)?.slice(0, 40) + ']')
  }

  const ids = ['code', 'name', 'codeLabel', 'htmlLang', 'ogLocale', 'rtl']
  const idMissing = ids.filter((k) => obj[k] === undefined)
  const codeOk = obj.code === code
  const htmlLangLeak = code !== 'en' && obj.htmlLang === 'en'
  const htmlLangOk = !DIACRITIC_REQUIRED.has(code) ? true : nonAscii(JSON.stringify(obj))

  const bad = missing.length || extra.length || tokFail.length || idMissing.length || !codeOk || htmlLangLeak || !htmlLangOk
  if (bad) failures++

  console.log(
    f + ' missing=' + missing.length + (missing.length ? ' [' + missing.slice(0, 8).join(',') + ']' : '') +
    ' extra=' + extra.length + (extra.length ? ' [' + extra.slice(0, 8).join(',') + ']' : '') +
    ' tokfail=' + tokFail.length + (tokFail.length ? ' [' + tokFail.slice(0, 3).join(' | ') + ']' : '') +
    ' idmiss=' + idMissing.length + (idMissing.length ? ' [' + idMissing.join(',') + ']' : '') +
    (codeOk ? '' : ' CODE-MISMATCH') +
    (htmlLangLeak ? ' HTMLLANG-EN-LEAK' : '') +
    (!htmlLangOk && DIACRITIC_REQUIRED.has(code) ? ' NO-DIACRITICS' : '')
  )
}

console.log('--- ' + files.length + ' locale files scanned')
console.log(failures ? `I18N VALIDATION FAIL: ${failures} file(s)` : 'I18N VALIDATION OK')
process.exit(failures ? 1 : 0)
