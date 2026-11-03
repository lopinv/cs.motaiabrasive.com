import fs from 'fs'
import path from 'path'

const dir = 'D:/Code/shopify/motai-static/src/pages/[lang]'

function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name)
    if (f.isDirectory()) { walk(p); continue }
    if (!p.endsWith('.astro')) continue
    let c = fs.readFileSync(p, 'utf8')
    const orig = c
    // `const { lang, ctx } = Astro.props` -> `const { lang } = Astro.params; const ctx = Astro.params`
    c = c.replace(
      /const\s*\{\s*lang,\s*ctx\s*\}\s*=\s*Astro\.props/,
      'const { lang } = Astro.params\nconst ctx = Astro.params'
    )
    if (c !== orig) {
      fs.writeFileSync(p, c)
      console.log('fixed', path.relative(dir, p))
    }
  }
}
walk(dir)
console.log('done')
