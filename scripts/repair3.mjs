import fs from 'fs'
import path from 'path'

const root = 'D:/Code/shopify/motai-static/src'

const REPAIRS = [
  // [brokenSubstr, correct, appliesToFileSubstr]
  ["'..libi18n.js'", "'../lib/i18n.js'", 'components/'],
  ["'..libi18n.js'", "'../lib/i18n.js'", 'pages/404'],
  ["'..libi18n.js'", "'../lib/i18n.js'", 'pages/index'],
  ["'..libi18n.js'", "'./i18n.js'", 'lib/paths'],
  ["'../lib/'", "'../lib/utils.js'", 'components/'],
  ["'../lib/'", "'../lib/page.js'", 'pages/'],
  ["'../../lib/'", "'../../lib/page.js'", 'pages/[lang]'],
  ["'../data/'", "'../data/',", 'lib/utils'],
  ["'../styles/'", "'../styles/global.css'", 'components/Shell'],
  ["'../components/'", "'../components/Shell.astro'", 'pages/'],
]

let n = 0
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { walk(p); continue }
    if (!/\.(astro|js|mjs)$/.test(f.name)) continue
    const rel = path.relative(root, p)
    let c = fs.readFileSync(p, 'utf8')
    const orig = c
    for (const [broken, correct, fileCtx] of REPAIRS) {
      if (rel.includes(fileCtx) && c.includes(broken)) {
        c = c.split(broken).join(correct)
        console.log('replaced', broken, '->', correct, 'in', rel)
      }
    }
    if (c !== orig) { n++; fs.writeFileSync(p, c) }
  }
}
walk(root)
console.log('files changed:', n)
