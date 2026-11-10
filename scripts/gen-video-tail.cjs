/**
 * Write the English input payload for the video-page translation batch.
 *
 * Output: .zcode-check/tails/videos.tail.json — a flat map of dotted i18n key
 * → English string, the same shape the site's other key-level translations
 * use. An agent translates it into <locale>.videos.out.json and
 * apply-video-tail.cjs merges that into src/i18n/<locale>.json.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8'))
const out = {}

for (const [k, v] of Object.entries(en.videos)) {
  if (k !== 'clip') out[`videos.${k}`] = v
}
out['nav.videos'] = en.nav.videos
for (const [k, v] of Object.entries(en.tdk.videos)) out[`tdk.videos.${k}`] = v
for (const [k, v] of Object.entries(en.tdk.video)) out[`tdk.video.${k}`] = v
for (const [id, clip] of Object.entries(en.videos.clip)) {
  for (const [k, v] of Object.entries(clip)) out[`videos.clip.${id}.${k}`] = v
}

const dest = path.join(root, '.zcode-check', 'tails', 'videos.tail.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n')
console.log('wrote ' + dest + ' — ' + Object.keys(out).length + ' keys')
