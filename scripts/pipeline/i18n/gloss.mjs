#!/usr/bin/env node
/**
 * i18n/gloss.mjs — emit a per-locale ABRASIVES TERMINOLOGY CHEAT SHEET from
 * the site's OWN i18n labels + glossary definitions. The site's displayed
 * terms are the authoritative spelling: article translations MUST match
 * them so the body and the site never disagree. This is the anti-"invented
 * word" source of truth.
 *
 *   node scripts/pipeline/i18n/gloss.mjs [locale …]   (default: all targets)
 *
 * Writes scripts/pipeline/i18n/glossary/<locale>.md, one compact table:
 *   concept → en term | <locale> official term
 *
 * Sources (all read-only, derived from the shipped site):
 *   - src/i18n/<locale>.json label keys (colt.*, meta.*, apps.*, oem.*,
 *     cta.*, glossary.*) — what the site shows to a reader of that locale.
 *   - src/data/glossary.json + its per-locale definition lead-in — the
 *     official phrasing for materials / techniques.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TARGET_LOCALES } from './locales.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')
const i18nDir = path.join(root, 'src', 'i18n')
const outDir = path.join(here, 'glossary')

function loadJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'))
}
function flat(o, p = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object') flat(v, p + k + '.', out)
    else if (typeof v === 'string') out[p + k] = v
  }
  return out
}

// Concepts whose site label is authoritative terminology for an article.
// Key = stable id, labelKeys = the i18n path that carries it, enLabel = a
// human concept name (English, from the en file when present).
const CONCEPTS = [
  { id: 'flap-disc', labelKeys: ['colt.flap.label'], glossary: 'Flap disc' },
  { id: 'abrasive-belts', labelKeys: ['colt.belts.label'], glossary: 'Belt' },
  { id: 'sanding-discs', labelKeys: ['colt.discs.label'], glossary: 'Sanding disc' },
  { id: 'all-products', labelKeys: ['colt.all.label'] },
  { id: 'grit', labelKeys: ['meta.grit'], glossary: 'Grit' },
  { id: 'backing', labelKeys: ['meta.backing'], glossary: 'Backing (polycotton)' },
  { id: 'diameter', labelKeys: ['meta.diameter'] },
  { id: 'holes', labelKeys: ['meta.holes'] },
  { id: 'wholesale', labelKeys: ['meta.wholesale'] },
  { id: 'oem-note', labelKeys: ['meta.oemNote'] },
  { id: 'quote-cta', labelKeys: ['cta.quote'] },
  { id: 'metal-fabrication', labelKeys: ['apps.metal.title', 'apps.metal.products'] },
  { id: 'woodworking', labelKeys: ['apps.wood.title'] },
  { id: 'automotive', labelKeys: ['apps.auto.title'] },
  { id: 'stainless-steel', labelKeys: ['apps.stainless.title', 'apps.stainless.products'] },
  { id: 'shipbuilding', labelKeys: ['apps.ship.title'] },
  { id: 'surface-prep', labelKeys: ['apps.surface.title'] },
]

// Materials / techniques: use the site's glossary term string + its
// per-locale definition lead-in (first sentence) as the official phrasing.
function glossarySheet(localeFile, locale) {
  const glossary = loadJSON(path.join(root, 'src', 'data', 'glossary.json'))
  const tr = loadJSON(path.join(i18nDir, localeFile + '.json'))
  const pick = (p) => p.split('.').reduce((c, k) => (c ? c[k] : undefined), tr)
  return glossary
    .filter((g) => g.term)
    .map((g) => ({ term: g.term, def: (pick(g.defKey) ?? g.defKey ?? '').trim().split(/(?<=[。.!])\s/)[0] }))
}

function buildSheet(locale) {
  const en = flat(loadJSON(path.join(i18nDir, 'en.json')))
  const loc = flat(loadJSON(path.join(i18nDir, locale + '.json')))
  const rows = CONCEPTS.map((c) => {
    const enTerm = c.labelKeys.map((k) => en[k]).filter(Boolean).join(' / ')
    const locTerm = c.labelKeys.map((k) => loc[k]).filter(Boolean).join(' / ')
    const g = c.glossary ? glossaryTerm(locale, c.glossary) : ''
    return { id: c.id, en: enTerm || c.id, loc: locTerm || (g ? `[glossary] ${g}` : '—') }
  })

  const gloss = glossarySheet(locale, locale)
  const glossRows = gloss.map((g) => ({ en: g.term, loc: g.def }))

  let out = `# ${locale} — abrasives terminology cheat sheet (site-authoritative)\n`
  out += `\n> Read from the shipped site's own ${locale} labels + glossary. Article translations MUST use these exact terms so the body matches the site. If a source word has no entry here, prefer the most common MSA/industry equivalent; do NOT invent a word.\n\n`
  out += `## Product / UI terms (site labels)\n\n| concept | EN | ${locale} official |\n|---|---|---|\n`
  for (const r of rows) out += `| ${r.id} | ${esc(r.en)} | ${esc(r.loc)} |\n`
  out += `\n## Materials & techniques (site glossary)\n\n| term | EN | ${locale} glossary lead-in |\n|---|---|---|\n`
  for (const r of glossRows) out += `| ${esc(r.en)} | ${esc(r.en)} | ${esc(r.loc)} |\n`
  out += `\n## Universal tokens kept as-is in ${locale}\nFEPA, ISO 848, ANSI, OSHA, PPE, OEM, PSA, grit codes (P60…P1500), model codes, mm/inch, rpm.\n`
  return out
}

function glossaryTerm(locale, term) {
  const glossary = loadJSON(path.join(root, 'src', 'data', 'glossary.json'))
  const item = glossary.find((g) => g.term === term)
  if (!item) return ''
  const tr = loadJSON(path.join(i18nDir, locale + '.json'))
  const def = item.defKey ? item.defKey.split('.').reduce((c, k) => (c ? c[k] : undefined), tr) : ''
  return (def ?? '').trim().split(/(?<=[。.!])\s/)[0]
}
function esc(s) { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ') }

const args = process.argv.slice(2)
const locales = args.length ? args : TARGET_LOCALES
mkdirSync(outDir, { recursive: true })
for (const locale of locales) {
  writeFileSync(path.join(outDir, locale + '.md'), buildSheet(locale))
}
console.log(`wrote ${locales.length} glossary sheet(s) → ${path.relative(root, outDir)}`)
