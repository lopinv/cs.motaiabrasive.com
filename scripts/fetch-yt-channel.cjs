/**
 * Re-scrape the MoTai YouTube channel (@motaiabrasive) — videos tab and
 * shorts tab — and write the raw list to scripts/data/yt-scan.json.
 *
 * YouTube serves the grid inside `ytInitialData`; the object is extracted with
 * a paired-brace scan rather than a regex so nested braces in descriptions
 * cannot truncate it. The grid itself is the newer `lockupViewModel` shape.
 *
 * Usage: node scripts/fetch-yt-channel.cjs
 */
const fs = require('fs')
const path = require('path')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const OUT = path.join(__dirname, 'data', 'yt-scan.json')

/** Extract the complete JSON object assigned to ytInitialData. */
function extractYtData(html) {
  const i = html.indexOf('ytInitialData')
  if (i < 0) return null
  const start = html.indexOf('{', i)
  let depth = 0, inStr = false, esc = false
  for (let k = start; k < html.length; k++) {
    const c = html[k]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') { inStr = true; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return html.slice(start, k + 1) }
  }
  return null
}

/** Walk any JSON tree and collect lockupViewModel / shortsLockupViewModel items. */
function collect(root) {
  const out = []
  ;(function walk(o) {
    if (!o || typeof o !== 'object') return
    if (o.lockupViewModel && o.lockupViewModel.contentId) {
      const lv = o.lockupViewModel
      const id = lv.contentId
      const title = lv.metadata?.lockupMetadataViewModel?.title?.content
      const rows = (lv.metadata?.lockupMetadataViewModel?.metadata?.metadataRowViews || [])
        .flatMap((r) => (r.metadataParts || []).map((p) => p.text?.content)).filter(Boolean)
      const dur = (lv.contentImage?.thumbnailViewModel?.overlays || [])
        .flatMap((x) => x.thumbnailBottomOverlayViewModel?.badges || [])
        .map((b) => b.thumbnailBadgeViewModel?.text).find(Boolean)
      const thumb = lv.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url
      if (id && title) out.push({ id, title, dur: dur || '', rows, thumb: thumb || '', kind: 'video' })
    }
    if (o.shortsLockupViewModel) {
      const sl = o.shortsLockupViewModel
      const id = sl.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId
      const title = sl.overlayMetadata?.primaryText?.content
      if (id && title) out.push({ id, title, dur: '', rows: [], thumb: '', kind: 'short' })
    }
    for (const v of Object.values(o)) walk(v)
  })(root)
  return out
}

async function main() {
  const tabs = [
    { name: 'videos', url: 'https://www.youtube.com/@motaiabrasive/videos' },
    { name: 'shorts', url: 'https://www.youtube.com/@motaiabrasive/shorts' }
  ]
  const all = []
  for (const t of tabs) {
    const res = await fetch(t.url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' } })
    const html = await res.text()
    const raw = extractYtData(html)
    let n = 0
    if (raw) {
      const items = collect(JSON.parse(raw))
      for (const it of items) {
        if (!all.some((x) => x.id === it.id)) { all.push({ ...it, from: t.name }); n++ }
      }
    }
    console.log(t.name + ': HTTP ' + res.status + ', new items ' + n)
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(all, null, 1) + '\n')
  console.log('total unique: ' + all.length)
  console.log('  video: ' + all.filter((x) => x.kind === 'video').length + ', short: ' + all.filter((x) => x.kind === 'short').length)
  // Compare against the site data source.
  const local = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'videos.json'), 'utf8'))
  const known = new Set(local.map((v) => v.id))
  const fresh = all.filter((x) => !known.has(x.id))
  console.log('local: ' + local.length + ', NEW: ' + fresh.length)
  for (const f of fresh) console.log('  NEW ' + f.id + ' [' + f.kind + '] ' + (f.dur || '?') + ' ' + f.title)

  // Fetch full metadata for the new ids from their watch pages.
  const out = []
  for (const id of process.argv.slice(2)) {
    const item = all.find((x) => x.id === id)
    if (!item) { console.log(id + ': not in scan'); continue }
    try {
      const res = await fetch('https://www.youtube.com/watch?v=' + id, { headers: { 'user-agent': UA } })
      const t = await res.text()
      const pick = (re) => { const m = t.match(re); return m ? m[1] : '' }
      const unescape = (s) => { try { return JSON.parse('"' + s + '"') } catch (e) { return s } }
      // Keys appear both spaced ("lengthSeconds": "152") and tight
      // ("lengthSeconds":"152") depending on the payload build.
      const at = (key) => { const m = t.match(new RegExp('"' + key + '"\\s*:\\s*"([^"]*)"')); return m ? m[1] : '' }
      out.push({
        id,
        kind: item.kind,
        title: unescape(at('title')),
        lengthSeconds: at('lengthSeconds'),
        publishDate: at('publishDate'),
        viewCount: at('viewCount'),
        description: unescape(at('shortDescription'))
      })
      console.log(id + ' | ' + out[out.length - 1].lengthSeconds + 's | ' + out[out.length - 1].publishDate.slice(0, 10))
    } catch (e) { console.log(id + ' FAIL ' + e.message) }
  }
  const metaPath = path.join(__dirname, 'data', 'yt-new-meta.json')
  fs.writeFileSync(metaPath, JSON.stringify(out, null, 1) + '\n')
  console.log('wrote ' + metaPath + ' (' + out.length + ')')
}
main().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
