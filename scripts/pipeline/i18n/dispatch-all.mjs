#!/usr/bin/env node
/**
 * i18n/dispatch-all.mjs — Dispatch Agent translations for ALL remaining articles.
 * This script generates the agent dispatch commands for the main process to execute.
 *
 *   node scripts/pipeline/i18n/dispatch-all.mjs [--locale <code>] [--limit N]
 *
 * Generates agent prompts for translation of all remaining 122 articles × 26 locales.
 * The main process can then execute these agent calls.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..')

const args = process.argv.slice(2)
const localeFilter = args.includes('--locale') ? args[args.indexOf('--locale') + 1] : null
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : null

const partsBase = path.join(here, 'parts')
const allSlugs = readdirSync(partsBase).filter(d => !d.startsWith('.')).sort()
const remainingSlugs = allSlugs.slice(1) // skip first (already done)
const targetSlugs = limit ? remainingSlugs.slice(0, limit) : remainingSlugs

// All 26 target locales
const locales = readdirSync(path.join(root, 'src', 'i18n'))
  .map(f => f.replace('.json', ''))
  .filter(c => c !== 'en')
  .sort()

const targetLocales = localeFilter ? [localeFilter] : locales

console.log(`=== DISPATCH PLAN ===`)
console.log(`Locales: ${targetLocales.join(', ')}`)
console.log(`Articles: ${targetSlugs.length} (${targetSlugs.slice(0,5).join(', ')}...)`)
console.log(`Total agent tasks: ${targetLocales.length * targetSlugs.length}`)

// Generate the dispatch commands
const commands = []

for (const locale of targetLocales) {
  const glossaryPath = path.join(here, 'glossary', locale + '.md')
  if (!existsSync(glossaryPath)) {
    console.warn(`⚠️  Missing glossary for ${locale}`)
    continue
  }

  const glossary = readFileSync(glossaryPath, 'utf8')
  
  // Get locale-specific terminology from glossary
  const termMap = parseGlossary(glossary)
  
  for (const slug of targetSlugs) {
    const finalFile = path.join(root, 'articles', locale, slug + '.md')
    // Check if already done
    // (In production, we'd check this properly)
    
    const command = buildDispatchCommand(locale, slug, termMap)
    commands.push({ locale, slug, command })
  }
}

// Output as JSON for the main process to consume
console.log('\n=== AGENT DISPATCH COMMANDS ===')
console.log(JSON.stringify(commands, null, 2))

function parseGlossary(glossaryText) {
  const terms = {}
  const lines = glossaryText.split('\n')
  for (const line of lines) {
    if (line.startsWith('| flap-disc') || line.startsWith('| grit ') || line.startsWith('| backing ')) {
      const parts = line.split('|').map(p => p.trim())
      if (parts.length >= 4) {
        terms[parts[1].trim()] = parts[3].trim()
      }
    }
  }
  return terms
}

function buildDispatchCommand(locale, slug, terms) {
  const localeNames = {
    'ar': 'Arabic', 'cs': 'Czech', 'da': 'Danish', 'de': 'German', 'es': 'Spanish',
    'fa': 'Persian', 'fi': 'Finnish', 'fr': 'French', 'he': 'Hebrew', 'hi': 'Hindi',
    'id': 'Indonesian', 'it': 'Italian', 'ja': 'Japanese', 'ko': 'Korean',
    'ms': 'Malay', 'no': 'Norwegian', 'pl': 'Polish', 'pt': 'Portuguese',
    'ru': 'Russian', 'sk': 'Slovak', 'sv': 'Swedish', 'th': 'Thai',
    'tr': 'Turkish', 'vi': 'Vietnamese', 'zh': 'Chinese Simplified', 'zh-Hant': 'Chinese Traditional'
  }
  
  const localeName = localeNames[locale] || locale
  
  return {
    locale,
    slug,
    prompt: `Translate ONE English article to ${localeName} (industrial B2B register) using the split-parts pipeline. Repo: D:\\\\Code\\\\shopify\\\\motai-static.
SLUG: ${slug}  LOCALE: ${locale}

STEPS (ALL to disk):
1. Read glossary/${locale}.md — USE EXACT TERMS.
2. Read EN parts 00-04 from scripts/pipeline/i18n/parts/${slug}/
3. Translate each to articles/${locale}/.parts/${slug}/NN.md (dirs; PART comment; part 00 frontmatter)
4. /en/... → /${locale}/...; external URLs byte-for-byte; universal tokens as-is.
5. FAQ = ${getFAQMarker(locale)}; final = ${getBuyMarker(locale)} (≥6 items).
6. Merge: node scripts/pipeline/i18n/merge.mjs ${locale} ${slug} 5
7. Verify: 5000+ words, 18 sections.

TERMS (from glossary/${locale}.md):
${Object.entries(terms).map(([k,v]) => `- ${k} = ${v}`).join('\n')}`
  }
}

function getFAQMarker(locale) {
  const markers = {
    'ar': 'الأسئلة الشائعة', 'cs': 'FAQ', 'da': 'FAQ', 'de': 'FAQ', 'es': 'FAQ',
    'fa': 'FAQ', 'fi': 'FAQ', 'fr': 'FAQ', 'he': 'שאלות נפוצות', 'hi': 'FAQ',
    'id': 'FAQ', 'it': 'FAQ', 'ja': 'よくある質問', 'ko': '자주 묻는 질문',
    'ms': 'FAQ', 'no': 'FAQ', 'pl': 'FAQ', 'pt': 'FAQ', 'ru': 'FAQ',
    'sk': 'FAQ', 'sv': 'FAQ', 'th': 'คำถามที่พบบ่อย', 'tr': 'SSS',
    'vi': 'FAQ', 'zh': '常见问题', 'zh-Hant': '常見問題'
  }
  return markers[locale] || 'FAQ'
}

function getBuyMarker(locale) {
  const markers = {
    'ar': 'قبل الشراء', 'cs': 'Před nákupem', 'da': 'Før du køber', 'de': 'Vor dem Kauf', 'es': 'Antes de comprar',
    'fa': 'قبل از خرید', 'fi': 'Ennen ostamista', 'fr': "Avant d'acheter", 'he': 'לפני רכישה', 'hi': 'खरीदने से पहले',
    'id': 'Sebelum membeli', 'it': 'Prima di acquistare', 'ja': '購入前に', 'ko': '구매 전에',
    'ms': 'Sebelum membeli', 'no': 'Før du kjøper', 'pl': 'Przed zakupem', 'pt': 'Antes de comprar', 'ru': 'Перед покупкой',
    'sk': 'Pred nákupom', 'sv': 'Innan du köper', 'th': 'ก่อนซื้อ', 'tr': 'Satın almadan önce',
    'vi': 'Trước khi mua', 'zh': '购买前须知', 'zh-Hant': '購買前須知'
  }
  return markers[locale] || 'Before you buy'
}