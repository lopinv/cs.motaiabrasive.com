const fs = require('fs')
const path = require('path')
const root = 'D:\\Code\\shopify\\motai-static'
const hits = []
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(json|js|mjs|astro|md|css|html)$/.test(e.name)) {
      const c = fs.readFileSync(p, 'utf8')
      const m = c.match(/磨泰/g)
      if (m) hits.push([path.relative(root, p), m.length])
    }
  }
}
walk(root)
for (const [f, n] of hits) console.log(f + ' :: ' + n)
console.log('files with 磨泰:', hits.length)
