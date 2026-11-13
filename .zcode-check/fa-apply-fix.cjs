#!/usr/bin/env node
/**
 * Apply fa frontmatter fixes from .zcode-check/fa-fix-1.json to articles/fa/<slug>.md.
 * Only touches the named frontmatter lines (title/keywords/metaDescription/intro).
 * Idempotent: re-running replaces the same lines again (no dup).
 */
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const fixes = JSON.parse(fs.readFileSync(path.join(__dirname, 'fa-fix-1.json'), 'utf8'))
const only = process.argv.slice(2)
let applied = 0
for (const [slug, kv] of Object.entries(fixes)) {
  if (only.length && !only.includes(slug)) continue
  const file = path.join(root, 'articles', 'fa', slug + '.md')
  if (!fs.existsSync(file)) { console.log(`SKIP no-file ${slug}`); continue }
  let lines = fs.readFileSync(file, 'utf8').split('\n')
  const fmEnd = lines.slice(1).findIndex((l) => l.trim() === '---') + 1
  for (const [k, v] of Object.entries(kv)) {
    const valStr = Array.isArray(v)
      ? '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']'
      : JSON.stringify(v)
    const pattern = new RegExp('^' + k + ':', 'm')
    let replaced = false
    lines = lines.map((l, i) => {
      if (i < fmEnd && pattern.test(l)) {
        const indent = l.match(/^\s*/)[0]
        replaced = true
        return indent + k + ': ' + valStr
      }
      return l
    })
    if (!replaced) console.log(`   ~ ${slug}.${k}: no frontmatter line to replace`)
  }
  fs.writeFileSync(file, lines.join('\n'))
  applied++
  console.log(`applied ${slug}`)
}
console.log(`done, ${applied} files touched`)
