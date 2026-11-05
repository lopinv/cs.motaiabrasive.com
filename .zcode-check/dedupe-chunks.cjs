/**
 * Remove chunk outputs that duplicate a re-split set.
 *
 * When a tail is re-split (e.g. th.p1 with 87 keys -> th.p1a + th.p1b),
 * the OLD combined output (th.p1.out.json) still covers the same keys with
 * slightly different wording. The merge takes the first file per key, so the
 * stale parent silently overrides the newer chunks. This removes any output
 * whose key set is a strict superset of another output's keys (i.e. a parent
 * of a re-split pair).
 *
 * Usage: node .zcode-check/dedupe-chunks.cjs <code>
 */
const fs = require('fs')
const path = require('path')

const TAILS = path.join(__dirname, 'tails')
const code = process.argv[2]
if (!code) { console.log('usage: node dedupe-chunks.cjs <code>'); process.exit(2) }

const re = new RegExp('^' + code + '\\.p[0-9a-z]+\\.out\\.json$')
const files = fs.readdirSync(TAILS).filter((f) => re.test(f))
const sets = {}
for (const f of files) sets[f] = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(TAILS, f), 'utf8'))))

// A file is stale when its keys are the union of the "lettered" chunks
// (p1a, p1b, ...) — i.e. every lettered chunk's keys are inside it — while
// the lettered chunks exist on disk.
const lettered = files.filter((f) => /[ab]\.out\.json$/.test(f))
const stale = []
for (const f of files) {
  if (/[ab]\.out\.json$/.test(f)) continue
  const covered = lettered.filter((g) => {
    const gk = [...sets[g]]
    return gk.length && gk.every((k) => sets[f].has(k))
  })
  if (covered.length && covered.reduce((n, g) => n + sets[g].size, 0) >= sets[f].size - 1) {
    stale.push({ file: f, covered: covered.map((g) => g.replace(code + '.', '').replace('.out.json', '')) })
  }
}
if (!stale.length) {
  console.log(`${code}: no stale duplicate chunks`)
} else {
  for (const s of stale) {
    fs.unlinkSync(path.join(TAILS, s.file))
    console.log(`${code}: removed ${s.file} (parent of ${s.covered.join(' + ')})`)
  }
}
console.log(`${code}: ${files.length - stale.length} chunk output(s) remain`)
