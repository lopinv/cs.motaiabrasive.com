#!/usr/bin/env node
/**
 * i18n/merge.mjs — concatenate translated part files into the final
 * localized article, then report whether it is ready for validation.
 *
 *   node scripts/pipeline/i18n/merge.mjs <locale> <slug> [nParts]
 *
 * Reads articles/<locale>/.parts/<slug>/NN.md (written by the translation
 * agents), concatenates them in order, writes articles/<locale>/<slug>.md and
 * removes the .parts scratch directory.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')

const [code, slug, nArg] = process.argv.slice(2)
if (!code || !slug) { console.log('usage: merge.mjs <locale> <slug> [nParts]'); process.exit(1) }

const partsDir = path.join(root, 'articles', code, '.parts', slug)
if (!existsSync(partsDir)) { console.error(`no parts dir: ${partsDir}`); process.exit(1) }
const files = readdirSync(partsDir).filter((f) => /^\d+\.md$/.test(f)).sort()
if (!files.length) { console.error(`no part files in ${partsDir}`); process.exit(1) }

const nParts = parseInt(nArg, 10) || files.length
if (files.length !== nParts) {
  console.error(`expected ${nParts} parts, found ${files.length}: ${files.join(', ')}`)
  process.exit(1)
}

const pieces = files.map((f) => {
  const t = readFileSync(path.join(partsDir, f), 'utf8')
  // Strip ALL leading HTML comment lines (split-all's part 00 carries two:
  // the PART marker and a frontmatter hint) so the frontmatter block sits
  // flush at the top of the part.
  return t.replace(/^(?:<!-- .*?-->\n)+/, '').trim()
})

// Part 00 carries the frontmatter; keep it, drop any duplicate frontmatter
// that a later part may have repeated.
let fm = ''
let bodyParts = []
for (const p of pieces) {
  const m = p.match(/^---\n([\s\S]*?)\n---\n?/)
  if (m && !fm) { fm = m[1]; bodyParts.push(p.slice(m[0].length).trim()) }
  else bodyParts.push(p)
}

const out = `---\n${fm}\n---\n\n${bodyParts.join('\n\n')}\n`
mkdirSync(path.join(root, 'articles', code), { recursive: true })
const outFile = path.join(root, 'articles', code, slug + '.md')
writeFileSync(outFile, out)
rmSync(path.join(root, 'articles', code, '.parts'), { recursive: true, force: true })

console.log(`merged ${files.length} parts → ${path.relative(root, outFile)} (${out.length} bytes)`)
