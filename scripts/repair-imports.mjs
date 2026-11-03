import fs from 'fs'
import path from 'path'

const root = 'D:/Code/shopify/motai-static/src'

// known exports -> file map
const exportMap = {
  i18n: {
    TRANSLATIONS: 'i18n.js', LANGS: 'i18n.js', defaultLang: 'i18n.js', t: 'i18n.js'
  },
  lib: {
    TRANSLATIONS: 'i18n.js', LANGS: 'i18n.js', defaultLang: 'i18n.js', t: 'i18n.js',
    site: 'utils.js', products: 'utils.js', models: 'utils.js', discViews: 'utils.js',
    flaps: 'utils.js', collections: 'utils.js', blog: 'utils.js', applications: 'utils.js',
    regions: 'utils.js', faq: 'utils.js', glossary: 'utils.js', trust: 'utils.js',
    videosData: 'utils.js', productByHandle: 'utils.js', modelBySlug: 'utils.js',
    discByKey: 'utils.js', flapByKey: 'utils.js', articleBySlug: 'utils.js',
    applicationBySlug: 'utils.js', media: 'utils.js', quoteUrl: 'utils.js',
    waLink: 'utils.js', langMeta: 'utils.js', localizedUrl: 'utils.js',
    usePage: 'page.js', buildSeo: 'page.js',
    tdkFor: 'tdk.js', orgJsonLd: 'tdk.js', breadcrumbJsonLd: 'tdk.js',
    faqJsonLd: 'tdk.js', itemlistJsonLd: 'tdk.js',
    langPaths: 'paths.js'
  }
}

function guessFile(named) {
  for (const [, map] of Object.entries(exportMap)) {
    for (const name of named) {
      if (map[name]) return map[name]
    }
  }
  return null
}

let n = 0
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { walk(p); continue }
    if (!/\.(astro|js|mjs)$/.test(f.name)) continue
    let c = fs.readFileSync(p, 'utf8')
    const orig = c
    // import { A, B } from '../lib/'  -> resolve target file
    c = c.replace(/import\s*(\{[^}]+\})\s*from\s*'((?:\.\.\/)+[a-z]+)\/'/g, (m, named, prefix) => {
      const names = named.replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean)
      const target = guessFile(names)
      if (!target) {
        console.log('UNRESOLVED', p, m)
        return m
      }
      const base = prefix.replace(/(^|\/)\.{2}\//g, '$1..') // prefix already correct relative dir
      return `import ${named} from '${base}${target}'`
    })
    // default/json: import en from '../i18n/'
    c = c.replace(/import\s+(\w+)\s+from\s*'((?:\.\.\/)+i18n)\/'/g, (m, name, prefix) => {
      // default import of i18n dir used to mean en.json
      if (name === 'en') return `import ${name} from '${prefix}/en.json'`
      console.log('DEFAULT IMPORT i18n?', p, m)
      return m
    })
    c = c.replace(/import(\s*\.default)?\s*from\s*'((?:\.\.\/)+data)\/'/g, (m, _x, prefix) => {
      console.log('DATA DIR IMPORT?', p, m)
      return m
    })
    // glob patterns
    c = c.replace(/import\.meta\.glob\('((?:\.\.\/)+i18n)\/'\s*/g, (m, prefix) => `import.meta.glob('${prefix}/*.json' `)
    if (c !== orig) { n++; fs.writeFileSync(p, c); console.log('repaired', path.relative(root, p)) }
  }
}
walk(root)
console.log('repaired files:', n)
