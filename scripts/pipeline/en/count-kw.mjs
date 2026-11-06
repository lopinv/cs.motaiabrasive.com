#!/usr/bin/env node
// count-kw.mjs — count whole-phrase occurrences of candidate keywords in an
// article body, to pick the 3–5 frontmatter keywords that sit in the 2–4×
// band. Usage: node scripts/pipeline/en/count-kw.mjs <slug> [kw1 kw2 …]
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const slug = process.argv[2]
if (!slug) { console.log('usage: node count-kw.mjs <slug> [kw …]'); process.exit(1) }
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..') // motai-static
const file = path.join(root, 'articles', 'en', slug + '.md')
const raw = readFileSync(file, 'utf8')
const body = raw.replace(/^---[\s\S]*?---\r?\n?/, '').toLowerCase()
function cnt(p) {
  const esc = p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp('(?<![a-z0-9])' + esc + '(?![a-z0-9])', 'gi')
  return (body.match(re) || []).length
}
const defaults = ['abrasive flap discs', 'flap disc', 'grit', 'backing', 'deburring', 'weld grinding', 'weld', 'fiberglass', 'grinder', 'finishing', 'stainless', 'aluminum oxide', 'zirconia alumina', 'dust', 'safety', 'arbor', 'flap discs wholesale']
const kws = process.argv.slice(3).length ? process.argv.slice(3) : defaults
for (const k of kws) console.log(String(cnt(k)).padStart(3), k)
