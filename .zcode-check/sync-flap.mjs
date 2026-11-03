/**
 * Flap catalog diff: pull the source flap-discs collection page, extract its
 * data-flap-catalog JSON and compare against src/data/flap.json.
 */
import fs from 'node:fs'
import path from 'node:path'

const page = await fetch('https://www.motaiabrasive.com/collections/flap-discs', {
  headers: { 'user-agent': 'Mozilla/5.0' }
}).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text() })

const m = page.match(/<script type="application\/json" data-flap-catalog>(\[.*?\])<\/script>/s)
if (!m) { console.log('data-flap-catalog JSON not found in page'); process.exit(2) }
const cat = JSON.parse(m[1])
if (!Array.isArray(cat)) { console.log('flap catalog is not an array:', JSON.stringify(cat).slice(0, 300)); process.exit(2) }

const local = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'data', 'flap.json'), 'utf8')
)
const byKey = (arr) => new Map(arr.map((x) => [x.key, x]))
const lc = byKey(cat)
const ll = byKey(local)

console.log('live flaps:', cat.map((f) => f.key).join(', '))
console.log('local flaps:', local.map((f) => f.key).join(', '))
let problems = 0
for (const f of cat) {
  const l = ll.get(f.key)
  if (!l) { console.log('  MISSING locally: ' + f.key + ' ' + JSON.stringify(f).slice(0, 200)); problems++; continue }
  const diffs = []
  if (String(f.name) !== String(l.name)) diffs.push('name: live=' + f.name + ' local=' + l.name)
  if (String(f.backing) !== String(l.backing)) diffs.push('backing: live=' + f.backing + ' local=' + l.backing)
  // color: live uses colors[{key,name}] swatches; local uses a single primary color string
  const liveColors = (f.colors || []).map((c) => c.name)
  if (liveColors.length && !liveColors.includes(l.color))
    diffs.push('color: live=' + liveColors.join('/') + ' local=' + l.color)
  if (diffs.length) { console.log('  DIFF ' + f.key + ' :: ' + diffs.join(' ; ')); problems++ }
  else console.log('  OK  ' + f.key + ' (' + f.name + ')')
}
const stale = [...ll.keys()].filter((k) => !lc.has(k))
if (stale.length) { console.log('  STALE locally (deleted upstream):', stale.join(', ')); problems++ }
console.log(problems ? 'FLAP OUT-OF-SYNC (' + problems + ')' : 'FLAP SYNC OK')
process.exit(problems ? 1 : 0)
