import fs from 'fs'
import path from 'path'

const root = 'D:/Code/shopify/motai-static/src'
let n = 0

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) {
      walk(p)
      continue
    }
    if (!/\.(astro|js|mjs)$/.test(f.name)) continue
    let c = fs.readFileSync(p, 'utf8')
    const orig = c
    // collapse repeated slashes in relative import specifiers: ../../../lib//utils.js -> ../../../lib/utils.js
    c = c.replace(/(['"])(\.{1,2}(\/[A-Za-z0-9_-]+)+)(\/+)([^'"]*)\1/g, (m, q, a, slashes, rest) => {
      return q + a + '/' + rest + q
    })
    c = c.replace(/(['"])(\.{1,2}\/)([^'"]*?)\1/g, (m, q, dot, rest) => {
      // collapse any double slashes inside the specifier
      const fixed = rest.replace(/\/{2,}/g, '/')
      return q + dot + fixed + q
    })
    if (c !== orig) {
      n++
      fs.writeFileSync(p, c)
      console.log('cleaned', path.relative(root, p))
    }
  }
}
walk(root)
console.log('total cleaned:', n)
