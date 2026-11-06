#!/usr/bin/env node
/**
 * i18n/collect.mjs — batch close-out: for a list of (locale, slug) pairs,
 * merge the on-disk part files into the final article, validate, and book a
 * PASS when (and only when) the validator passes. This is the step that turns
 * "the part-translation agents wrote their chunks" into "recorded progress".
 *
 *   node scripts/pipeline/i18n/collect.mjs <locale> <slug> [<locale> <slug> …]
 *
 * Per pair:
 *   1. If articles/<locale>/.parts/<slug>/ has N part files, concatenate them
 *      (order 00..N-1, part 00 carries the frontmatter) →
 *      articles/<locale>/<slug>.md.
 *   2. Run i18n/validate.mjs.
 *   3. On PASS, run i18n/batch.mjs record … PASS (which re-validates).
 *
 * Reports a per-pair verdict and a summary line. A pair with missing/short
 * parts is reported as INCOMPLETE (not a translation failure) so the caller
 * knows which chunks to re-dispatch.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')

const args = process.argv.slice(2)
if (args.length < 2 || args.length % 2) {
  console.log('usage: collect.mjs <locale> <slug> [<locale> <slug> …]')
  process.exit(1)
}
const pairs = []
for (let i = 0; i < args.length; i += 2) pairs.push([args[i], args[i + 1]])

function mergeParts(locale, slug) {
  const partsDir = path.join(root, 'articles', locale, '.parts', slug)
  if (!existsSync(partsDir)) return null
  const files = readdirSync(partsDir).filter((f) => /^\d+\.md$/.test(f)).sort()
  if (!files.length) return null
  const pieces = files.map((f) => {
    let t = readFileSync(path.join(partsDir, f), 'utf8')
    t = t.replace(/^<!-- PART [^>]*-->\n/, '').replace(/^<!-- Frontmatter[^\n]*-->\n/, '').trim()
    return t
  })
  let fm = ''
  let bodyParts = []
  for (const p of pieces) {
    const m = p.match(/^---\n([\s\S]*?)\n---\n?/)
    if (m && !fm) { fm = m[1]; bodyParts.push(p.slice(m[0].length).trim()) }
    else bodyParts.push(p)
  }
  const out = `---\n${fm}\n---\n\n${bodyParts.join('\n\n')}\n`
  mkdirSync(path.join(root, 'articles', locale), { recursive: true })
  writeFileSync(path.join(root, 'articles', locale, slug + '.md'), out)
  try { rmSync(path.join(root, 'articles', locale, '.parts'), { recursive: true, force: true }) } catch {}
  return files.length
}

function validate(cmd, slug) {
  try {
    const out = execSync(`node "${path.join(here, 'validate.mjs')}" ${cmd} ${slug}`, {
      cwd: root, stdio: 'pipe',
    })
    return { pass: true, out: out.toString().trim() }
  } catch (e) {
    const out = ((e.stdout || '') + (e.stderr || '')).toString().trim()
    return { pass: out.includes('PASS') && !out.includes('FAIL'), out }
  }
}

let passN = 0, failN = 0, incN = 0
for (const [locale, slug] of pairs) {
  const n = mergeParts(locale, slug)
  if (n == null) {
    // already merged on a previous run, or parts absent
    const exists = existsSync(path.join(root, 'articles', locale, slug + '.md'))
    if (!exists) { console.log(`INCOMPLETE [${locale}] ${slug} (no parts on disk)`); incN++; continue }
  }
  const v = validate(locale, slug)
  if (v.pass) {
    const r = execSync(`node "${path.join(here, 'batch.mjs')}" record ${locale} ${slug} PASS`, {
      cwd: root, stdio: 'pipe',
    }).toString().trim().split('\n')[0]
    console.log(`PASS [${locale}] ${slug}  ${v.out.split('\n')[0]}\n     ${r}`)
    passN++
  } else {
    console.log(`FAIL [${locale}] ${slug}\n     ${v.out.split('\n').slice(0, 6).join('\n     ')}`)
    failN++
  }
}
console.log(`\ncollect: ${passN} PASS, ${failN} FAIL, ${incN} incomplete  (${pairs.length} pairs)`)
