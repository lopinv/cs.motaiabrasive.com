import fs from 'fs'
import path from 'path'

const root = 'D:/Code/shopify/motai-static/src'
let n = 0

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { walk(p); continue }
    if (!/\.(astro|js|mjs)$/.test(f.name)) continue
    let c = fs.readFileSync(p, 'utf8')
    const orig = c
    // repair mangled specifiers like '..libi18n.js' -> '../lib/i18n.js'
    c = c.replace(/(['"])\.\.[a-zA-Z][a-zA-Z0-9/.]*\1/g, (m, q) => {
      const spec = m.slice(1, -1)
      const repaired = spec.replace(/^(\.\.)?([a-z][a-z0-9-]*)([a-z][a-z0-9-]*)?(\.js|\.json|\.css)?$/, (mm, dots, a, b, ext) => {
        const seg = (b ? a + '/' + b : a)
        return (dots ? '../' : './') + seg + (ext || '')
      })
      // only accept if it looks like a fix
      if (spec.includes('libi18n')) return q + '../lib/i18n.js' + q
      if (spec.match(/^\.\.[a-z]/) && spec.includes('lib')) {
        const m2 = spec.match(/^\.\.lib([a-z0-9-]+)\.js$/)
        if (m2) return q + '../lib/' + m2[1] + '.js' + q
      }
      return m
    })
    c = c.replace(/\.\.libi18n\.js/g, "'../lib/i18n.js'")
    c = c.replace(/from\s+'\.\.[a-z]{0,1}libi18n/g, "from '../lib/i18n")
    if (c !== orig) { n++; fs.writeFileSync(p, c); console.log('repaired', path.relative(root, p)) }
  }
}
walk(root)
console.log('done', n)
