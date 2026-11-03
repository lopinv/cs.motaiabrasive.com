import fs from 'fs'
import path from 'path'

const root = 'D:/Code/shopify/motai-static/src'

const REPL = [
  // mangled by earlier scripts: '..libi18n.js' etc. (missing slash)
  ["from '..libi18n.js'", "from '../lib/i18n.js'"],
  ["from '..libutils.js'", "from '../lib/utils.js'"],
  ["from '..libpage.js'", "from '../lib/page.js'"],
  ["from '..libtdk.js'", "from '../lib/tdk.js'"],
  ["from '..libpaths.js'", "from '../lib/paths.js'"],
  // lib/paths.js lives next to i18n.js
  ["import { LANGS } from '..libi18n.js'", "import { LANGS } from './i18n.js'"],
  // Shell / Home in top-level pages
  ["import Shell from '../components/'", "import Shell from '../components/Shell.astro'"],
  ["import Home from '../components/pages/'", "import Home from '../components/pages/Home.astro'"],
  // CSS
  ["import '../styles/'", "import '../styles/global.css'"],
]

let n = 0
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { walk(p); continue }
    if (!/\.(astro|js|mjs)$/.test(f.name)) continue
    let c = fs.readFileSync(p, 'utf8')
    const orig = c
    for (const [a, b] of REPL) {
      if (c.includes(a)) {
        c = c.split(a).join(b)
        console.log('fix', JSON.stringify(a), '->', JSON.stringify(b), 'in', path.relative(root, p))
      }
    }
    if (c !== orig) { n++; fs.writeFileSync(p, c) }
  }
}
walk(root)
console.log('files changed:', n)
