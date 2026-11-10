/**
 * Merge a translated video tail payload into src/i18n/<locale>.json.
 *
 * Input : .zcode-check/tails/<locale>.videos.gap.out.json (preferred) or
 *         .zcode-check/tails/<locale>.videos.out.json
 * Output: src/i18n/<locale>.json
 *
 * A key the locale already carries is left untouched, so re-running never
 * clobbers a reviewed translation. Line endings follow the target file:
 * en.json is CRLF, the other locales are LF, and JSON.stringify emits LF.
 *
 * usage: node scripts/apply-video-tail.cjs <locale> [--force]
 */
const fs = require('fs')
const path = require('path')

const locale = process.argv[2]
const force = process.argv.includes('--force')
if (!locale) {
  console.log('usage: apply-video-tail.cjs <locale> [--force]')
  process.exit(1)
}

const root = path.resolve(__dirname, '..')
// Gap payload (only the keys still missing) is preferred; fall back to a
// full-scope payload. Both are flat dotted-key → text maps.
const candidates = [locale + '.videos.gap.out.json', locale + '.videos.out.json']
const srcPath = candidates.map((n) => path.join(root, '.zcode-check', 'tails', n))
  .find((p) => fs.existsSync(p))
const destPath = path.join(root, 'src', 'i18n', locale + '.json')

if (!srcPath) {
  console.error('no translation payload found: ' + candidates.map((n) => root + '/.zcode-check/tails/' + n).join(' | '))
  process.exit(1)
}

const flat = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
const raw = fs.readFileSync(destPath, 'utf8')
const obj = JSON.parse(raw)

let set = 0
let kept = 0
for (const [dotted, value] of Object.entries(flat)) {
  const parts = dotted.split('.')
  let node = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (node[parts[i]] === undefined) node[parts[i]] = {}
    node = node[parts[i]]
  }
  const leaf = parts[parts.length - 1]
  if (node[leaf] === undefined || force) {
    node[leaf] = value
    set++
  } else {
    kept++
  }
}

const out = JSON.stringify(obj, null, 2) + '\n'
// en.json is CRLF; every other locale file is LF. Match the target.
const payload = /\r\n/.test(raw) && !/(?<!\r)\n/.test(raw) ? out.replace(/\n/g, '\r\n') : out
fs.writeFileSync(destPath, payload)

console.log(`${locale}: set ${set}, kept existing ${kept}`)
