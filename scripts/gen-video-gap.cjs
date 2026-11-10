/**
 * Emit a per-locale "gap" payload: only the video-scope keys that locale still
 * lacks relative to en.json. Agents translate just these, and
 * apply-video-tail.cjs merges them into the existing file (idempotent — it only
 * fills keys that are undefined).
 *
 *   node scripts/gen-video-gap.cjs <locale>
 *
 * Writes .zcode-check/tails/<locale>.videos.gap.json
 */
const fs = require('fs')
const path = require('path')

const locale = process.argv[2]
if (!locale) {
  console.log('usage: gen-video-gap.cjs <locale>')
  process.exit(1)
}

const root = path.resolve(__dirname, '..')
const i18nDir = path.join(root, 'src', 'i18n')
const en = JSON.parse(fs.readFileSync(path.join(i18nDir, 'en.json'), 'utf8'))
const cur = JSON.parse(fs.readFileSync(path.join(i18nDir, locale + '.json'), 'utf8'))

function paths(o, p = '', out = new Set()) {
  for (const [k, v] of Object.entries(o)) {
    const n = p ? p + '.' + k : k
    if (v && typeof v === 'object' && !Array.isArray(v)) paths(v, n, out)
    else out.add(n)
  }
  return out
}

// The full video scope = en keys under videos.*, tdk.videos.*, tdk.video.*, nav.videos
const scope = [...paths(en)].filter((k) => /^videos\./.test(k) || /^tdk\.videos\./.test(k) || /^tdk\.video\./.test(k) || k === 'nav.videos')
const have = paths(cur)
const gap = scope.filter((k) => !have.has(k))

// Resolve each gap key to its en value.
const val = (k) => k.split('.').reduce((c, part) => (c ? c[part] : undefined), en)
const out = {}
for (const k of gap) out[k] = val(k)

const dest = path.join(root, '.zcode-check', 'tails', locale + '.videos.gap.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n')
console.log(locale + ': ' + gap.length + ' keys to translate -> ' + dest)
