/**
 * Verify a locale payload / file against en.json:
 *  - JSON-parseable
 *  - every en key path present (no missing)
 *  - placeholder tokens {name}{grits}{model}{title}{desc}{sizes}{material}{category}{backing}
 *    preserved wherever en has them
 *  - 6 identifier keys present and sane
 * Usage: node .zcode-check/verify-locale.cjs <file.json>
 */
const fs = require('fs')
const path = require('path')

const file = process.argv[2]
if (!file) { console.log('usage: node verify-locale.cjs <locale.json>'); process.exit(2) }
const dir = path.join(__dirname, '..', 'src', 'i18n')
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'))
const obj = JSON.parse(fs.readFileSync(file, 'utf8'))

function paths(o, p = '', out = []) {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) paths(v, np, out)
    else out.push(np)
  }
  return out
}
const enP = new Set(paths(en))
const me = paths(obj)
const missing = [...enP].filter((k) => !new Set(me).has(k))
const extra = me.filter((k) => !enP.has(k))

// placeholder preservation: for every en path whose value contains {tok},
// the locale value must contain the same {tok}.
const TOK = /\{[a-z]+\}/g
const enMap = {}
const walk = (o, p = '') => {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) walk(v, np)
    else if (typeof v === 'string' && TOK.test(v)) enMap[np] = [...v.match(TOK)]
  }
}
walk(en)
const tokFail = []
const get = (o, pth) => pth.split('.').reduce((c, k) => (c ? c[k] : undefined), o)
for (const [np, toks] of Object.entries(enMap)) {
  const lv = get(obj, np)
  if (typeof lv !== 'string' || toks.some((t) => !lv.includes(t))) tokFail.push(np + ' (en:' + toks.join(',') + ' got:' + JSON.stringify(lv)?.slice(0, 60) + ')')
}

const ids = ['code', 'name', 'codeLabel', 'htmlLang', 'ogLocale', 'rtl']
const idMissing = ids.filter((k) => obj[k] === undefined)
// code must match the filename
const wantCode = path.basename(file).replace(/\.json$/, '')

console.log('file:', file)
console.log('  missing keys:', missing.length, missing.length ? JSON.stringify(missing.slice(0, 10)) : '')
console.log('  extra keys:  ', extra.length, extra.length ? JSON.stringify(extra.slice(0, 10)) : '')
console.log('  placeholder token failures:', tokFail.length, tokFail.length ? JSON.stringify(tokFail.slice(0, 5), null, 1) : '')
console.log('  id key failures:', idMissing.length ? JSON.stringify(idMissing) : 'none', '| code=', obj.code, '(want', wantCode + ')', '| htmlLang=', obj.htmlLang, '| ogLocale=', obj.ogLocale, '| rtl=', obj.rtl)
const bad = missing.length || extra.length || tokFail.length || idMissing.length || obj.code !== wantCode
console.log(bad ? '  VERIFY FAIL' : '  VERIFY OK')
process.exit(bad ? 1 : 0)
