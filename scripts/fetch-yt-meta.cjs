/**
 * Fetch canonical metadata for every channel video from its YouTube watch page.
 *
 * The channel grid (ytInitialData) only yields id/title/thumbnail/duration
 * badge; publishDate, lengthSeconds, viewCount and description live on the
 * watch page. Writes scripts/data/yt-meta.json.
 */
const fs = require('fs')
const path = require('path')

const LIST = JSON.parse(fs.readFileSync(process.argv[2] || 'D:/Temp/yt-all.json', 'utf8'))
const OUT = path.join(__dirname, 'data', 'yt-meta.json')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const need = (s, re) => { const m = s.match(re); return m ? m[1] : '' }

async function one(v) {
  const r = await fetch('https://www.youtube.com/watch?v=' + v.id, { headers: { 'user-agent': UA } })
  const s = await r.text()
  const pick = (re) => { const m = s.match(re); return m ? m[1] : '' }
  const meta = {
    id: v.id,
    title: pick(/"title":"((?:[^"\\]|\\.)*)"/),
    lengthSeconds: pick(/"lengthSeconds":"(\d+)"/),
    publishDate: pick(/"publishDate":"([^"]+)"/),
    viewCount: pick(/"viewCount":"(\d+)"/),
    description: pick(/"shortDescription":"((?:[^"\\]|\\.)*)"/)
  }
  return { ...v, ...meta, watchOk: r.ok }
}

async function main() {
const out = []
for (const v of LIST) {
  try {
    const m = await one(v)
    if (m.title) m.title = JSON.parse('"' + m.title + '"')
    if (m.description) m.description = JSON.parse('"' + m.description + '"')
    out.push(m)
    console.log(m.id + '  ' + m.lengthSeconds + 's  ' + m.publishDate + '  ' + (m.title || '').slice(0, 60))
  } catch (e) {
    console.log(v.id + '  FAILED  ' + e.message)
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
console.log('wrote ' + OUT + ' (' + out.length + ' entries)')
}
main()
