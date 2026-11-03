import fs from 'fs'
import path from 'path'

const root = 'D:/Code/shopify/motai-static'
const srcRoot = path.join(root, 'src')

function fix(file) {
  let c = fs.readFileSync(file, 'utf8')
  const rel = path.relative(srcRoot, path.dirname(file)).split(path.sep).filter(Boolean)
  const up = rel.map(() => '..').join('/')
  let changed = false
  const replaceSpec = (m, ups, target) => {
    const correct = (up ? up + '/' : '') + target + '/'
    if (ups === correct) return m
    changed = true
    return `from '${correct}`
  }
  c = c.replace(/from '(\.\.\/)+(lib|data|components|assets|styles|Shell\.astro|Header\.astro|Footer\.astro|FloatingContact\.astro|SeoMeta\.astro|ProductCard\.astro|CtaBand\.astro|Faq\.astro|SectionHeading\.astro|YouTubeEmbed\.astro|Home\.astro)(\/.*)?'/g, (m, ups, target, rest) => {
    const correct = target.endsWith('.astro')
      ? (up ? up + '/' : '') + 'components/' + target + (rest ?? '')
      : (up ? up + '/' : '') + target + '/' + (rest ?? '')
    if (`from '${ups}${target}${rest ?? ''}'` === m) return m
    changed = true
    return `from '${correct}'`
  })
  c = c.replace(/import\('(\.\.\/)+(lib|data)\//g, replaceSpec)
  if (changed) fs.writeFileSync(file, c)
  console.log(path.relative(root, file), 'up=' + up, changed ? 'fixed' : 'ok')
}

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory() && !f.name.startsWith('.')) walk(p)
    else if (f.name.endsWith('.astro')) fix(p)
  }
}
walk(path.join(srcRoot, 'pages'))
walk(path.join(srcRoot, 'components', 'pages'))
walk(path.join(srcRoot, 'components'))
