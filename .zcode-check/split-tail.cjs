/**
 * Split a tail worklist into N chunks so a translation agent can write each
 * chunk as its own small file (big single-file writes get cut off).
 *
 * Usage: node .zcode-check/split-tail.cjs <code> [chunks]
 * Output: .zcode-check/tails/<code>.p1.json ... .pN.json
 */
const fs = require('fs')
const path = require('path')

const code = process.argv[2]
const chunks = Number(process.argv[3] || 4)
if (!code) { console.log('usage: node split-tail.cjs <code> [chunks]'); process.exit(2) }

const TAILS = path.join(__dirname, 'tails')
const src = path.join(TAILS, code + '.tail.json')
if (!fs.existsSync(src)) { console.log(code + ': no worklist'); process.exit(1) }

const work = JSON.parse(fs.readFileSync(src, 'utf8'))
const keys = Object.keys(work)
// Group by top-level block so a chunk stays coherent (e.g. all of "blog.*").
const groups = []
for (const k of keys) {
  const g = k.split('.')[0]
  let bucket = groups.find((x) => x[0] === g)
  if (!bucket) { bucket = [g, []]; groups.push(bucket) }
  bucket[1].push(k)
}
// Distribute groups round-robin into N balanced chunks.
const parts = Array.from({ length: chunks }, () => [])
let sizes = parts.map(() => 0)
for (const [g, ks] of groups) {
  let best = 0
  for (let i = 1; i < chunks; i++) if (sizes[i] < sizes[best]) best = i
  parts[best].push(...ks)
  sizes[best] += ks.length
}
parts.forEach((ks, i) => {
  const out = {}
  for (const k of ks) out[k] = work[k]
  const p = path.join(TAILS, `${code}.p${i + 1}.json`)
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log(`${code}.p${i + 1}: ${ks.length} key(s) -> ${path.basename(p)}`)
})
console.log(`${code}: ${keys.length} keys in ${chunks} chunks`)
