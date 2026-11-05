/**
 * Generate the 13 new locale files (hi/zh-Hant/sv/da/no/fi/th/vi/id/ms/pl/cs/sk)
 * under src/i18n/ from en.json + a per-language override data file in
 * .zcode-check/locales-v2/.
 *
 * Why a generator instead of hand-authoring 579-key files:
 *   - deep-clones en.json so the NEW file's key tree is byte-identical to en
 *     (guarantees `.zcode-check/key-parity.cjs` reports 0 missing — it is now a
 *     build gate)
 *   - applies only the translated subset from locales-v2/<code>.json (flat
 *     dotted-key overrides); any key not overridden falls back to the English
 *     value, exactly like the existing 10 locales' deepMerge behavior.
 *
 * The override data files are the machine-translation payload ("机翻 + 待母语
 * 审校", same convention as the pre-existing non-en content). A full re-run is
 * idempotent: it always rebuilds the 13 files from en + data.
 *
 * Id keys (code/name/codeLabel/htmlLang/ogLocale/rtl) must be present in the
 * data file; the generator fails a language if they are missing (a missing
 * htmlLang would silently inherit "en" and create a duplicate hreflang).
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const I18N = path.join(root, 'src', 'i18n')
const DATA = path.join(__dirname, 'locales-v2')
const en = JSON.parse(fs.readFileSync(path.join(I18N, 'en.json'), 'utf8'))

const CODES = ['hi', 'zh-Hant', 'sv', 'da', 'no', 'fi', 'th', 'vi', 'id', 'ms', 'pl', 'cs', 'sk']
const ID_KEYS = ['code', 'name', 'codeLabel', 'htmlLang', 'ogLocale', 'rtl']

// Recursively apply a payload (either flat dotted-key or nested-block JSON)
// onto a deep clone of en. Objects recurse, arrays/scalars assign (replacing
// the en value at that path). A payload key absent from en is created (safe —
// the clone still carries every en key, so key-parity stays 0).
// (Retained for completeness; the main loop uses setDot, which handles both
// payload shapes.)
function applyClone(base, payload) {
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      if (base[k] === null || typeof base[k] !== 'object' || Array.isArray(base[k])) base[k] = {}
      applyClone(base[k], v)
    } else {
      base[k] = v
    }
  }
  return base
}

// Set a dotted key path on the en clone. Handles both flat (dotted-key) and
// nested payloads: a key with no dots (e.g. "meta", "nav", "code") replaces
// that whole block; a dotted key (e.g. "tdk.home.title") walks deep. Arrays
// assign whole (replace the en array). Every en path still exists in the
// clone, so key-parity stays 0 regardless of which override style a payload
// uses.
function setDot(obj, dotted, value) {
  const parts = dotted.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (cur[k] === undefined || typeof cur[k] !== 'object' || Array.isArray(cur[k])) cur[k] = {}
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
}

for (const code of CODES) {
  const dataPath = path.join(DATA, code + '.json')
  if (!fs.existsSync(dataPath)) {
    console.log(`${code}: DATA MISSING (${dataPath}) — skipped`)
    continue
  }
  const ov = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  // Id keys are mandatory; a missing one would inherit en and break hreflang.
  const missingId = ID_KEYS.filter((k) => !(k in ov))
  if (missingId.length) {
    console.log(`${code}: FAIL — missing id keys: ${missingId.join(', ')}`)
    continue
  }
  // Clone en, apply overrides, write.
  const out = JSON.parse(JSON.stringify(en))
  for (const [k, v] of Object.entries(ov)) setDot(out, k, v)

  const target = path.join(I18N, code + '.json')
  const body = JSON.stringify(out, null, 2) + '\n'
  fs.writeFileSync(target, body, 'utf8')
  console.log(`${code}: wrote ${path.relative(root, target)} (${body.length} bytes, ${Object.keys(ov).length} overrides)`)
}
