/**
 * Remove stale duplicate chunk outputs: a chunk file whose key set is a strict
 * SUPERSET of another chunk file's keys (e.g. the old 87-key th.p1.out.json
 * after the tail was re-split into th.p1a/th.p1b) would silently win the merge
 * and override the newer, smaller chunks.
 *
 * Usage: node .zcode-check/dedupe-chunks.cjs <code>
 */
const fs = require('fs')
const path = require('path')

const TAILS = path.join(__dirname, 'tails')
const code = process.argv[2]
if (!code) { console.log('usage: node dedupe-chunks.cjs <code>'); process.exit(2) }

const files = fs.readdirSync(TAILS).filter((f) => new RegExp('^' + code + '\\.p[0-9a-z]+\\.out\\.json$').test(f))
const sets = {}
for (const f of files) sets[f] = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(TAILS, f), 'utf8'))))

const stale = []
for (const f of files) {
  for (const g of files) {
    if (f === g) continue
    const gKeys = [...sets[g]]
    if (gKeys.length < sets[f].size && gKeys.every((k) => sets[f].has(k))) {
      // f covers everything g covers AND more -> f is the stale parent version
      stale.push({ file: f, supersedes: g, extra: sets[f].size - sets[g].size })
      break
    }
  }
}
if (!stale.length) {
  console.log(`${code}: no stale duplicate chunks`)
} else {
  for (const s of stale) {
    fs.unlinkSync(path.join(TAILS, s.file))
    console.log(`${code}: removed ${s.file} (covered ${s.supersedes} + ${s.extra} extra keys)`)
  }
}
console.log(`${code}: ${files.length - stale.length} chunk output(s) remain`)
