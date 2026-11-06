#!/usr/bin/env node
/**
 * i18n/count-kw.mjs — count occurrences of candidate (translated) keywords in
 * a localized article body, to pick frontmatter keywords that land in the
 * 2–4× band. CJK locales count substring occurrences; others word-boundary.
 *
 * Usage: node scripts/pipeline/i18n/count-kw.mjs <locale> <slug> "kwA" "kwB" …
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isCJK } from './locales.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')
const [code, slug, ...kws] = process.argv.slice(2)
if (!code || !slug) { console.log('usage: count-kw.mjs <locale> <slug> [kw …]'); process.exit(1) }
const file = path.join(root, 'articles', code, slug + '.md')
const raw = readFileSync(file, 'utf8')
const body = raw.replace(/^---[\s\S]*?---\r?\n?/, '').toLowerCase()
const cjk = isCJK(code)
function cnt(p) {
  const t = body
  const s = p.toLowerCase()
  if (cjk) return t.split(s).length - 1
  const esc = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'giu')
  return (t.match(re) || []).length
}
for (const k of kws.length ? kws : [slug]) console.log(String(cnt(k)).padStart(4), k)
