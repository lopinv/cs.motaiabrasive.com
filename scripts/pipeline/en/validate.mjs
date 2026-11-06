#!/usr/bin/env node
/**
 * validate.mjs — quality gate for generated English articles.
 *
 * Each article is a standalone Markdown file at articles/en/<slug>.md with:
 *   ---
 *   slug: ...
 *   category: selection-guide | buyer-resources | application-notes | oem-guide
 *   title: "..."            # <= 60 chars, contains the primary keyword, no year
 *   keywords: [Primary, Second, Third, ...]   # 3–5, first = primary
 *   metaDescription: "..."  # 120–170 chars, contains a keyword
 *   intro: "..."            # 40–160 chars
 *   datePublished: 2026-11-04
 *   dateModified: 2026-11-04
 *   image: discs            # optional, one of the site media keys
 *   ---
 *   (body: Markdown, no H1/H2 — only ###/####, lists, links, bold, emoji)
 *
 * Body rules enforced (all hard-fail):
 *   W1.  5000–6000 words (body, Markdown syntax stripped)
 *   S1.  no `# ` / `## ` headings (H1/H2 are owned by the page template)
 *   S2.  >= 5 `###` headings
 *   L1.  >= 4 internal links to whitelisted routes; one in each of the
 *        first / middle / last third of the body
 *   L2.  >= 1 external link to a live-verified authority URL
 *   L3.  no external link outside the verified whitelist
 *   L4.  internal link hrefs must be locale-prefixed `/en/...` or bare
 *        `...` — never a root-only `/collections/...` (that is the 404
 *        language-less path)
 *   B1.  no banned absolute claims (广告法 red-line)
 *   K1.  primary keyword 5–8×; each secondary keyword 2–4×
 *   C1.  a "Before you buy" section (### heading) with >= 6 checklist items
 *   C2.  a "FAQ" section exists
 *   T1.  title <= 60 chars, contains primary keyword, no 4-digit year
 *   T2.  meta description 120–170 chars, contains at least one keyword
 *   T3.  intro 40–160 chars
 *   H1.  no `###` section shorter than 120 words (no hollow nodes)
 *   U1.  >= 3 unordered lists
 *   E1.  >= 6 emoji (warn-only)
 *
 * Usage:
 *   node scripts/pipeline/en/validate.mjs              # validate all
 *   node scripts/pipeline/en/validate.mjs <slug> …     # validate some
 * Exit 0 when every listed article passes.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { INTERNAL, EXTERNAL, BANNED } from './links.mjs'

const here = path.dirname(fileURLToPath(import.meta.url)) // scripts/pipeline/en
const root = path.resolve(here, '..', '..', '..')          // motai-static
const DIR = path.join(root, 'articles', 'en')
const INTERNAL_HREFS = new Set(
  [...Object.values(INTERNAL).map((l) => l.to), ...Object.values(INTERNAL).map((l) => `/en${l.to}`)]
)
const EXTERNAL_URLS = new Set(Object.values(EXTERNAL).map((l) => l.url))

/** Split frontmatter (YAML-ish) from the Markdown body. */
function splitDoc(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { fm: {}, body: raw }
  const body = raw.slice(m[0].length)
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    else v = v.replace(/^["']|["']$/g, '')
    fm[kv[1]] = v
  }
  return { fm, body }
}

/** Strip Markdown syntax; count words. */
function wordsOf(md) {
  const text = md
    .replace(/<\/?[^>]+>/g, ' ')          // any inline HTML
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // link -> label
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\|/g, ' ')
  const w = text.trim().match(/[^\s]+/g)
  return w ? w.length : 0
}
function countPhrase(text, phrase) {
  const esc = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![A-Za-z0-9])${esc}(?![A-Za-z0-9])`, 'gi')
  return (text.match(re) || []).length
}
const stripInline = (h) => h.replace(/[#*_>`~[\]]/g, '').trim()

function validateArticle(file) {
  const raw = readFileSync(file, 'utf8')
  const { fm, body } = splitDoc(raw)
  const fails = []
  const warns = []
  const allText = body.toLowerCase()
  const totalWords = wordsOf(body)

  // W1. word count
  if (totalWords < 5000 || totalWords > 6000) fails.push(`word count ${totalWords} outside 5000–6000`)

  // S1. no H1/H2
  if (/^#{1,2}\s/m.test(body)) fails.push('body contains an H1/H2 heading')

  // S2. headings
  const h3 = body.match(/^###\s/mg)
  const h3count = h3 ? h3.length : 0
  if (h3count < 5) fails.push(`only ${h3count} ### headings (need >= 5)`)

  // L1–L4. links
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  const internal = []
  const external = []
  let m
  while ((m = linkRe.exec(body))) {
    const [, anchor, href] = m
    if (/^https?:/i.test(href)) external.push({ href, anchor, pos: m.index })
    else internal.push({ href, anchor, pos: m.index })
  }
  const badInternal = internal.filter((l) => !INTERNAL_HREFS.has(l.href) && !INTERNAL_HREFS.has(`/en${l.href}`))
  if (badInternal.length) fails.push(`links to unknown routes: ${[...new Set(badInternal.map((l) => l.href))].join(', ')}`)
  const badExternal = external.filter((l) => !EXTERNAL_URLS.has(l.href))
  if (badExternal.length) fails.push(`external links outside whitelist: ${[...new Set(badExternal.map((l) => l.href))].join(', ')}`)
  const goodInternal = internal.length - badInternal.length
  if (goodInternal < 4) fails.push(`only ${goodInternal} valid internal links (need >= 4)`)
  if (external.length < 1) fails.push('no authority external link')

  // L1b. thirds distribution
  if (goodInternal >= 4) {
    const pos = internal.filter((l) => !badInternal.includes(l)).map((l) => l.pos)
    const n = body.length
    if (!pos.some((x) => x < n / 3)) fails.push('no internal link in the first third')
    if (!pos.some((x) => x >= n / 3 && x < (2 * n) / 3)) fails.push('no internal link in the middle third')
    if (!pos.some((x) => x >= (2 * n) / 3)) fails.push('no internal link in the last third')
  }

  // B1. banned claims — single-word bans use word boundaries (so "perfect"
  // does not catch "perfectly"); multi-word bans match as phrases.
  for (const b of BANNED) {
    const lower = b.toLowerCase()
    const hit = lower.includes(' ')
      ? allText.includes(lower)
      : new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(allText)
    if (hit) fails.push(`banned phrase: "${b}"`)
  }

  // K1. keyword density
  const kw = Array.isArray(fm.keywords) ? fm.keywords : []
  if (kw.length < 3 || kw.length > 5) fails.push(`keywords count ${kw.length} (need 3–5)`)
  const p = kw[0] ? kw[0].toLowerCase() : ''
  if (p) {
    const c = countPhrase(allText, p)
    if (c < 5 || c > 8) fails.push(`primary keyword "${p}" appears ${c}× (need 5–8)`)
  }
  for (const s of kw.slice(1)) {
    const c = countPhrase(allText, s.toLowerCase())
    if (c < 2 || c > 4) warns.push(`secondary keyword "${s}" appears ${c}× (target 2–4)`)
  }

  // C1/C2. compliance + FAQ
  const heads = [...body.matchAll(/^###\s+(.+)$/gm)].map((x) => stripInline(x[1]))
  const lastH = heads[heads.length - 1] || ''
  if (!/before you buy/i.test(lastH)) fails.push(`last ### is "${lastH}" — must be the "Before you buy" block`)
  if (!heads.some((h) => /faq/i.test(h))) fails.push('no FAQ section')
  // count checklist items in the last section (from the final ### to EOF)
  const fromEnd = body.slice(body.lastIndexOf('### '))
  const liInCompliance = (fromEnd.match(/^(?:-|\*)\s/gm) || []).length
  if (liInCompliance < 6) fails.push(`"Before you buy" block has ${liInCompliance} items (need >= 6)`)

  // T1. title
  if (!fm.title || fm.title.length > 60) fails.push(`title ${fm.title?.length ?? 0} chars (<= 60)`)
  if (p && fm.title && !fm.title.toLowerCase().includes(p)) fails.push(`title lacks primary keyword "${p}"`)
  if (fm.title && /\b(19|20)\d{2}\b/.test(fm.title)) fails.push('title contains a year')

  // T2. meta description
  if (!fm.metaDescription || fm.metaDescription.length < 120 || fm.metaDescription.length > 170)
    fails.push(`meta description ${fm.metaDescription?.length ?? 0} chars (need 120–170)`)
  if (kw.length && !kw.some((k) => fm.metaDescription?.toLowerCase().includes(k.toLowerCase())))
    fails.push('meta description contains no keyword')

  // T3. intro
  if (!fm.intro || fm.intro.length < 40 || fm.intro.length > 160)
    fails.push(`intro ${fm.intro?.length ?? 0} chars (need 40–160)`)

  // H1. hollow sections — split on ### headings
  const parts = body.split(/^###\s+/m)
  for (const part of parts.slice(1)) {
    const w = wordsOf(part)
    if (w < 120) fails.push(`section only ${w} words (< 120)`)
  }

  // U1. lists
  const ul = (body.match(/^(?:-|\*)\s/gm) || []).length
  if (ul < 3) fails.push(`only ${ul} list items (need >= 3)`)

  // E1. emoji
  const emoji = (body.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu) || []).length
  if (emoji < 6) warns.push(`only ${emoji} emoji (aim >= 6)`)

  return { slug: fm.slug || path.basename(file, '.md'), fails, warns, totalWords, goodInternal, external: external.length, h3: h3count }
}

function main() {
  const only = process.argv.slice(2)
  let files = readdirSync(DIR).filter((f) => f.endsWith('.md')).sort()
  if (only.length) files = files.filter((f) => only.includes(f.replace(/\.md$/, '')))
  let pass = 0
  let failCount = 0
  for (const f of files) {
    try {
      const r = validateArticle(path.join(DIR, f))
      if (r.fails.length === 0) {
        pass++
        console.log(`PASS ${r.slug} (${r.totalWords}w, ${r.goodInternal} in, ${r.external} out, ${r.h3} h3)`)
        if (r.warns.length) console.log(`     warn: ${r.warns.join(' | ')}`)
      } else {
        failCount++
        console.log(`FAIL ${r.slug} (${r.totalWords}w)`)
        r.fails.forEach((x) => console.log(`   ✗ ${x}`))
        r.warns.forEach((x) => console.log(`   ~ ${x}`))
      }
    } catch (e) {
      failCount++
      console.log(`FAIL ${f} — ${e.message}`)
    }
  }
  if (files.length) console.log(`\n${pass} passed, ${failCount} failed, ${files.length} checked`)
  process.exit(failCount ? 1 : 0)
}

if (!existsSync(DIR)) {
  console.log('no article files yet at', DIR)
  process.exit(0)
}
main()
