import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const bad = []
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    const st = fs.statSync(p)
    if (st.isDirectory()) { walk(p); continue }
    if (!/\.(js|mjs|astro)$/.test(f)) continue
    const s = fs.readFileSync(p, 'utf8')
    const re = /from\s+['"]([^'"]+)['"]/g
    let m
    while ((m = re.exec(s))) {
      const spec = m[1]
      // flag specs that don't look like a clean relative or bare module
      const clean = /^\.\.?(?:\/[\w.-]+)+$/.test(spec) || /^[a-z@][\w./-]*$/.test(spec)
      if (!clean) bad.push(`${p}  ->  "${spec}"`)
    }
  }
}
walk(root)
console.log('--- suspicious import specs ---')
for (const b of bad) console.log(b)
console.log('total:', bad.length)
