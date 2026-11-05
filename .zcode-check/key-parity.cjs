/**
 * i18n key-parity audit + build gate.
 *
 * Compares every locale file in src/i18n against en.json (the base of the
 * deepMerge in src/lib/i18n.js). Key presence is what matters: arrays are
 * treated atomically (prose/keyword arrays differ in length per locale by
 * design), so only object key paths are compared.
 *
 * Read-only for the locale files; exits 1 when any locale is missing an
 * en key (wired into `npm run build` as a gate). The 6 identifier keys
 * (code/name/codeLabel/htmlLang/ogLocale/rtl) exist in en.json too, so a
 * fully-par file reports missing=0 extra=0.
 */
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '..', 'src', 'i18n')

// Collect dotted key paths; recurse only into plain objects (arrays are
// atomic leaves).
function collectPaths(o, prefix, out) {
  for (const [k, v] of Object.entries(o)) {
    const p = prefix ? prefix + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) collectPaths(v, p, out)
    else out.add(p)
  }
  return out
}

const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'))
const enPaths = collectPaths(en, '', new Set())
console.log('en.json key paths: ' + enPaths.size)

let failures = 0
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  const locPaths = collectPaths(j, '', new Set())
  const missing = [...enPaths].filter((k) => !locPaths.has(k))
  const extra = [...locPaths].filter((k) => !enPaths.has(k))
  if (missing.length) failures++
  console.log(
    f + ' missing=' + missing.length + (missing.length ? ' [' + missing.slice(0, 12).join(', ') + ']' : '') +
    ' extra=' + extra.length + (extra.length ? ' [' + extra.slice(0, 8).join(', ') + ']' : '')
  )
}

if (failures) {
  console.log('KEY-PARITY FAIL: ' + failures + ' locale file(s) missing en keys')
  process.exit(1)
}
console.log('KEY PARITY OK')
