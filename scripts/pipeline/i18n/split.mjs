#!/usr/bin/env node
/**
 * i18n/split.mjs — split one EN article into part files so several agents
 * can translate a single long article in parallel, each writing a small
 * chunk to disk. A short chunk is far more likely to be written out than a
 * 5000-word single Write call.
 *
 *   node scripts/pipeline/i18n/split.mjs <slug> [nParts]
 *
 * Creates scripts/pipeline/i18n/parts/<slug>/NN.md (the EN chunks, each
 * self-contained). Agents translate each chunk into
 * articles/<locale>/.parts/<slug>/NN.md, then i18n/merge.mjs concatenates.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')

const slug = process.argv[2]
const nParts = Math.max(1, parseInt(process.argv[3], 10) || 5)
if (!slug) { console.log('usage: split.mjs <slug> [nParts]'); process.exit(1) }

const enFile = path.join(root, 'articles', 'en', slug + '.md')
const raw = readFileSync(enFile, 'utf8').replace(/\r\n/g, '\n')
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/)
if (!fmMatch) { console.error('no frontmatter in', enFile); process.exit(1) }
const frontmatter = fmMatch[1]
const body = raw.slice(fmMatch[0].length)

// Split body into ### sections, keeping the heading with its content.
const chunks = []
{
  const lines = body.split('\n')
  let cur = null
  for (const line of lines) {
    if (/^###\s/.test(line)) {
      if (cur) chunks.push(cur)
      cur = [line]
    } else if (cur) {
      cur.push(line)
    } else {
      // leading prose before the first ### (usually empty in these articles)
      cur = [line]
    }
  }
  if (cur) chunks.push(cur)
}

// Group sections into nParts buckets SEQUENTIALLY (order-preserving):
// fill bucket 0 until it reaches the even share, then bucket 1, and so on.
// A load-balanced interleave would scramble section order and break the
// "before you buy must be the final section" rule.
const even = Math.ceil(chunks.length / nParts)
const groups = []
for (let i = 0; i < chunks.length; i += even) groups.push(chunks.slice(i, i + even))
while (groups.length < nParts) groups.push([])

const outDir = path.join(here, 'parts', slug)
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

groups.forEach((g, i) => {
  const id = String(i).padStart(2, '0')
  // g is an array of section-chunks, each a lines-array: join lines first.
  const text = g.map((sec) => sec.join('\n')).join('\n\n').trim()
  const header = i === 0
    ? `<!-- PART ${id}/${nParts} of ${slug} -->\n<!-- Frontmatter (translate title/keywords/metaDescription/intro; keep slug/category/dates/image verbatim) -->\n---\n${frontmatter}\n---\n\n`
    : `<!-- PART ${id}/${nParts} of ${slug} -->\n`
  writeFileSync(path.join(outDir, id + '.md'), header + text + '\n')
})

// Manifest the agents and merger read.
const manifest = groups.map((g, i) => {
  const text = g.map((sec) => sec.join('\n')).join('\n\n')
  return {
    part: String(i).padStart(2, '0'),
    sections: g.map((s) => {
      const head = s.find((line) => /^###\s/.test(line)) || ''
      return head.replace(/^###\s+/, '').trim()
    }),
    chars: text.length,
  }
})
writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ slug, nParts, parts: manifest }, null, 2))

console.log(`split ${slug} into ${nParts} parts → ${path.relative(root, outDir)}`)
for (const m of manifest) console.log(`  ${m.part}  ${String(m.chars).padStart(6)} chars  ${m.sections.join(' | ').slice(0, 90)}`)
