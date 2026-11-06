#!/usr/bin/env node
/**
 * i18n/split-all.mjs — split EVERY EN source article into 5 order-preserving
 * part-chunks under scripts/pipeline/i18n/parts/<slug>/NN.md. One shared set
 * of EN parts per slug; each target-locale agent translates a part against it.
 *
 *   node scripts/pipeline/i18n/split-all.mjs [nParts]
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')
const nParts = Math.max(1, parseInt(process.argv[2], 10) || 5)

function enSlugs() {
  const dir = path.join(root, 'articles', 'en')
  return readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => f.replace(/\.md$/, ''))
}

function splitOne(slug) {
  const enFile = path.join(root, 'articles', 'en', slug + '.md')
  const raw = readFileSync(enFile, 'utf8').replace(/\r\n/g, '\n')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!fmMatch) throw new Error('no frontmatter: ' + slug)
  const frontmatter = fmMatch[1]
  const body = raw.slice(fmMatch[0].length)

  const sections = []
  let cur = null
  for (const line of body.split('\n')) {
    if (/^###\s/.test(line)) { if (cur) sections.push(cur); cur = [line] }
    else if (cur) cur.push(line)
    else cur = [line]
  }
  if (cur) sections.push(cur)

  // Order-preserving sequential grouping.
  const even = Math.ceil(sections.length / nParts)
  const groups = []
  for (let i = 0; i < sections.length; i += even) groups.push(sections.slice(i, i + even))
  while (groups.length < nParts) groups.push([])

  const outDir = path.join(here, 'parts', slug)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  groups.forEach((g, i) => {
    const id = String(i).padStart(2, '0')
    const text = g.map((sec) => sec.join('\n')).join('\n\n').trim()
    const header = i === 0
      ? `<!-- PART ${id}/${nParts} of ${slug} -->\n<!-- Frontmatter (translate title/keywords/metaDescription/intro; keep slug/category/dates/image verbatim) -->\n---\n${frontmatter}\n---\n\n`
      : `<!-- PART ${id}/${nParts} of ${slug} -->\n`
    writeFileSync(path.join(outDir, id + '.md'), header + text + '\n')
  })
  return groups.length
}

const slugs = enSlugs()
let ok = 0, fail = 0
for (const s of slugs) {
  try { splitOne(s); ok++ } catch (e) { fail++; console.error('FAIL ' + s + ': ' + e.message) }
}
console.log(`split ${ok}/${slugs.length} EN slugs into ${nParts} parts (order-preserving); ${fail} failed`)
