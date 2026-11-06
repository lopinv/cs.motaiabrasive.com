#!/usr/bin/env node
/**
 * i18n/next-tasks.mjs — for a locale, write a task brief for each of the next N
 * NOT-YET-DONE EN slugs (per i18n/batch.mjs state). Prints the brief paths so
 * the caller can fan out one agent per brief.
 *
 *   node scripts/pipeline/i18n/next-tasks.mjs <locale> <N>
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { TARGET_LOCALES, MARKERS } from './locales.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')

function termRows(locale) {
  const g = path.join(here, 'glossary', locale + '.md')
  if (!readFileSync && !safeExists(g)) return []
  let t
  try { t = readFileSync(g, 'utf8') } catch { return [] }
  const re = /^\| (flap-disc|abrasive-belts|sanding-discs|grit|backing|diameter|holes|wholesale|quote-cta|stainless-steel|metal-fabrication|woodworking|automotive|shipbuilding|surface-prep) /
  return t.split('\n').filter((l) => re.test(l))
}
function safeExists(p) { try { readFileSync(p, 'utf8'); return true } catch { return false } }

function brief(locale, slug) {
  const markers = MARKERS[locale] || { faq: 'FAQ', buy: '' }
  const terms = termRows(locale)
  return `# Task: translate EN article "${slug}" into ${locale}

You are a technical translator for the MoTai Abrasives B2B site. Translate ONE
article into ${locale}, then validate it, then book it. Repo root:
D:\\Code\\shopify\\motai-static (run all commands from there).

## Read first
1. This brief (the contract for THIS file).
2. The 5 EN part files, in order (do NOT reorder sections between parts):
   scripts/pipeline/i18n/parts/${slug}/00.md … 04.md
   Part 00 starts with the YAML frontmatter; the last part ends with the
   "before you buy" section.

## Terminology — use the SITE'S OWN words, NEVER invent one
The site's product pages for this locale already use these official terms.
Your article MUST use them too (body and site must never disagree):
${terms.length ? terms.join('\n') : '(no glossary sheet — use the most standard industry term in ' + locale + '; do NOT coin a word)'}
Universal tokens stay as-is: FEPA, ISO 848, ANSI, OSHA, PPE, OEM, PSA, grit
codes (P60…P1500), model codes, mm/inch, rpm.

## Write
For each part 00..04, WRITE the full translation to
articles/${locale}/.parts/${slug}/NN.md (create dirs). Keep the leading
"<!-- PART NN/5 … -->" comment on line 1. Part 00 keeps the frontmatter block:
translate title/keywords/metaDescription/intro into ${locale}; keep
slug/category/datePublished/dateModified/image VERBATIM.
- INTERNAL links: rewrite every /en/… href to /${locale}/… (same route paths,
  same count as the EN parts). Translate anchor text.
- EXTERNAL links: keep the URL byte-for-byte; translate the anchor only.
- Translate every heading, paragraph, list, FAQ Q&A, checklist into natural
  fluent ${locale} technical prose (not literal calques).

## Headings (the validator checks these literal strings)
- FAQ section heading EXACTLY: ### ${markers.faq}
- FINAL "before you buy" heading EXACTLY: ### ${markers.buy}  (>= 6 checklist items)
- No H1/H2 anywhere (only ### / ####).

## Frontmatter
- title <= 80 chars, contains the primary keyword, no year.
- keywords 3–5 items, item 1 = primary; pick terms you ACTUALLY use in the body
  (check: node scripts/pipeline/i18n/count-kw.mjs ${locale} ${slug} "kw" "kw2").
- metaDescription / intro: keep reasonable; word-count warnings are ACCEPTABLE
  — do NOT pad the body to hit a number.

## Rules
- No banned absolute claims (best/only/guaranteed/permanent/100%/zero-risk/
  absolutely safe, and their ${locale} equivalents). Translate EN hedges,
  never drop them.
- Do NOT fabricate brands, products, institutions, data, or URLs.

## Verify + book
1. node scripts/pipeline/i18n/merge.mjs ${locale} ${slug} 5
2. node scripts/pipeline/i18n/validate.mjs ${locale} ${slug}
   - Fix every line starting with "✗". Lines starting with "~" are ACCEPTABLE
     (word count, secondary-keyword density) — leave them; do not pad.
   - Re-run until only "~" lines remain.
3. node scripts/pipeline/i18n/batch.mjs record ${locale} ${slug} PASS
   (re-validates on the fly; if it rejects, a ✗ remains — keep fixing).

## Report back (exactly)
- Final validator line (PASS + any ~ warnings).
- Internal/external link counts.
- Terminology used for: flap disc / grit / backing / deburring / stainless steel
  (so it can be checked against the glossary sheet).
`
}

const [locale, nArg] = process.argv.slice(2)
const N = Math.max(1, parseInt(nArg, 10) || 8)
if (!TARGET_LOCALES.includes(locale)) { console.log('unknown locale: ' + locale); process.exit(1) }
const next = execSync(`node "${path.join(here, 'batch.mjs')}" next ${locale} ${N}`, { cwd: root, stdio: 'pipe' })
  .toString().split('\n').find((l) => l.trim().startsWith('['))
  ? JSON.parse(execSync(`node "${path.join(here, 'batch.mjs')}" next ${locale} ${N}`, { cwd: root, stdio: 'pipe' }).toString().split('\n').find((l) => l.trim().startsWith('[')) + (execSync(`node "${path.join(here, 'batch.mjs')}" next ${locale} ${N}`, { cwd: root, stdio: 'pipe' }).toString().split('\n').find((l) => l.trim() === ']') || ']'))
  : []
// The next command prints a JSON array then a comment line; parse robustly.
const raw = execSync(`node "${path.join(here, 'batch.mjs')}" next ${locale} ${N}`, { cwd: root, stdio: 'pipe' }).toString()
const slugs = raw.split(']')[0].split('[').pop().split(',').map((s) => s.trim().replace(/"/g, '')).filter(Boolean)
const taskDir = path.join(here, 'tasks')
mkdirSync(taskDir, { recursive: true })
for (const slug of slugs) writeFileSync(path.join(taskDir, `${locale}-${slug}.txt`), brief(locale, slug))
console.log(`wrote ${slugs.length} task brief(s) for [${locale}]: ${slugs.join(', ') || '(none — all done)'}`)
