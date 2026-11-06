#!/usr/bin/env node
/**
 * i18n/task.mjs — write a per-article task brief for a target locale so the
 * part-translation agents receive ONE consistent, auditable instruction set.
 * The brief embeds that locale's SITE-AUTHORITATIVE terminology anchors (from
 * glossary/<locale>.md) plus the exact FAQ/buy headings the validator requires.
 *
 *   node scripts/pipeline/i18n/task.mjs <locale> <slug>
 *
 * Writes scripts/pipeline/i18n/tasks/<locale>-<slug>.txt and prints it.
 * An agent's job: read THIS brief + the 5 EN part files, translate each part to
 * articles/<locale>/.parts/<slug>/NN.md, merge, validate to PASS (word-count
 * warnings are OK), book PASS, and report.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')

// Pull the site-authoritative terminology lines out of the locale glossary sheet.
function termRows(locale) {
  const g = path.join(here, 'glossary', locale + '.md')
  if (!existsSync(g)) return []
  const t = readFileSync(g, 'utf8')
  const rows = []
  for (const line of t.split('\n')) {
    if (/^\| (flap-disc|abrasive-belts|sanding-discs|grit|backing|diameter|holes|wholesale|quote-cta|stainless-steel|metal-fabrication|woodworking|automotive|shipbuilding|surface-prep) /.test(line)) rows.push(line)
  }
  return rows
}

import { existsSync } from 'node:fs'
import { MARKERS } from './locales.mjs'

const [locale, slug] = process.argv.slice(2)
if (!locale || !slug) { console.log('usage: task.mjs <locale> <slug>'); process.exit(1) }
const markers = MARKERS[locale] || { faq: 'FAQ', buy: '' }
const terms = termRows(locale)

const brief = `# Task: translate EN article "${slug}" into ${locale}

You are a technical translator for the MoTai Abrasives B2B site. Translate ONE
article into ${locale}, then validate it, then book it. Repo root:
D:\\Code\\shopify\\motai-static (run all commands from there).

## Read first
1. This brief (it is the contract for THIS file).
2. The 5 EN part files, in order (do NOT reorder sections between parts):
   scripts/pipeline/i18n/parts/${slug}/00.md … 04.md
   Part 00 starts with the YAML frontmatter; the last part ends with the
   "before you buy" section.

## Terminology — use the SITE'S OWN words, NEVER invent one
The site's product pages for this locale already use these official terms.
Your article MUST use them too (so body and site never disagree). From
glossary/${locale}.md:
${terms.length ? terms.join('\n') : '(no glossary sheet found — use the most standard industry term in ' + locale + '; do NOT coin a word)'}
Universal tokens stay as-is: FEPA, ISO 848, ANSI, OSHA, PPE, OEM, PSA, grit
codes (P60…P1500), model codes, mm/inch, rpm.

## Write
For each part 00..04, WRITE the full translation to
articles/${locale}/.parts/${slug}/NN.md (create dirs). Keep the leading
"<!-- PART NN/5 … -->" comment on line 1 of each part. Part 00 keeps the
frontmatter block: translate title/keywords/metaDescription/intro into ${locale},
keep slug/category/datePublished/dateModified/image VERBATIM.
- INTERNAL links: rewrite every /en/… href to /${locale}/… (same route paths,
  same count as the EN parts). Translate the anchor text.
- EXTERNAL links: keep the URL byte-for-byte, translate the anchor only.
- Translate every heading, paragraph, list, FAQ Q&A, checklist item into
  natural fluent ${locale} technical prose (not literal calques).

## Headings (the validator checks these literal strings)
- The FAQ section heading must be EXACTLY: ### ${markers.faq}
- The FINAL "before you buy" section heading must be EXACTLY: ### ${markers.buy}
  with >= 6 checklist items.
- No H1/H2 anywhere (only ### / ####).

## Frontmatter
- title: <= 80 chars, must contain the primary keyword, no year.
- keywords: 3–5 items, item 1 = primary. Pick them as terms you ACTUALLY USE in
  the body (run: node scripts/pipeline/i18n/count-kw.mjs ${locale} ${slug} "kw" "kw2").
  Primary should appear 5+ times; secondaries 2–4 times ideally.
- metaDescription and intro: keep them in a reasonable length (the validator
  reports if out of band; word-count issues are acceptable — do NOT pad the
  body just to hit a number).

## Rules
- No banned absolute claims (the ad-law red lines: "best/only/guaranteed/
  permanent/100%/zero-risk/absolutely safe" and their ${locale} equivalents).
  If the EN source hedges ("confirm with sales", "the risk is reduced, not
  zero"), translate the hedge — do not drop it.
- Do NOT fabricate brands, products, institutions, data, or URLs.

## Verify + book
1. node scripts/pipeline/i18n/merge.mjs ${locale} ${slug} 5
2. node scripts/pipeline/i18n/validate.mjs ${locale} ${slug}
   - Fix every line that starts with "✗". Lines starting with "~" (word count,
     secondary-keyword density) are ACCEPTABLE — leave them, do not pad.
   - Re-run until the only remaining lines are "~" warnings (or none).
3. node scripts/pipeline/i18n/batch.mjs record ${locale} ${slug} PASS
   (this re-validates on the fly; if it rejects, your file still has a ✗ — keep
   fixing. Do NOT stop at INCOMPLETE.)

## Report back (exactly these fields)
- Final validator line (the "PASS [locale] slug (…)" line, note any ~ warnings).
- Internal/external link counts.
- The terminology you used for the key concepts (flap disc / grit / backing /
  deburring / stainless steel) so it can be checked against the glossary sheet.
`

const taskDir = path.join(here, 'tasks')
mkdirSync(taskDir, { recursive: true })
const out = path.join(taskDir, `${locale}-${slug}.txt`)
writeFileSync(out, brief)
console.log(brief)
console.log(`\n// written → ${path.relative(root, out)}`)
