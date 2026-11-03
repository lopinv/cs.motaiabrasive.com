const fs = require('fs')
const h = fs.readFileSync('C:\\Users\\admin\\AppData\\Local\\Temp\\motai\\flap-live.html', 'utf8')
const m = h.match(/<script type="application\/json" data-flap-catalog>(\[.*?\])<\/script>/s)
if (!m) { console.log('flap-catalog not found'); process.exit(1) }
const cat = JSON.parse(m[1])
const local = JSON.parse(fs.readFileSync('D:\\Code\\shopify\\motai-static\\src\\data\\flap.json', 'utf8'))
console.log('LIVE flaps:')
for (const f of cat) console.log(' ' + f.key + ' | ' + JSON.stringify(f.name) + ' | ' + f.backing + ' | ' + JSON.stringify(f.color) + ' | ' + (f.image || f.media || ''))
console.log('LOCAL flaps:')
for (const f of local) console.log(' ' + f.key + ' | ' + JSON.stringify(f.name) + ' | ' + f.backing + ' | ' + f.color + ' | ' + f.image)
const lk = new Set(cat.map((f) => f.key))
const lk2 = new Set(local.map((f) => f.key))
console.log('live-only:', [...lk].filter((x) => !lk2.has(x)).join(',') || '(none)')
console.log('local-only:', [...lk2].filter((x) => !lk.has(x)).join(',') || '(none)')
for (const f of cat) {
  const loc = local.find((x) => x.key === f.key)
  if (!loc) continue
  const diffs = []
  if (JSON.stringify(f.name) !== JSON.stringify(loc.name)) diffs.push('name: live=' + f.name + ' local=' + loc.name)
  if (String(f.backing).toLowerCase() !== String(loc.backing).toLowerCase()) diffs.push('backing: live=' + f.backing + ' local=' + loc.backing)
  if (String(f.color) !== String(loc.color)) diffs.push('color: live=' + JSON.stringify(f.color) + ' local=' + JSON.stringify(loc.color))
  console.log(f.key + ': ' + (diffs.length ? diffs.join(' ; ') : 'OK'))
}
