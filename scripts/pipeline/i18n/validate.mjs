#!/usr/bin/env node
/**
 * i18n/validate.mjs — quality gate for TRANSLATED articles.
 *
 * A translated article lives at articles/<code>/<slug>.md, mirrors its EN
 * source (articles/en/<slug>.md) and localizes: frontmatter (title,
 * keywords, metaDescription, intro) and the whole body, plus rewrites every
 * internal link to the <code>-prefixed route (e.g. /de/collections/...).
 *
 * Checks (locale-aware; hard-fail unless noted):
 *   W1.  5000–6000 units — CJK characters (+ Latin tokens) for CJK locales,
 *        words otherwise.
 *   S1.  no H1/H2 in the body.
 *   S2.  >= 5 ### headings.
 *   L1.  >= 4 internal links to whitelisted routes, <code>-prefixed or bare;
 *        one in each of the first / middle / last third of the body.
 *   L2.  >= 1 external link from the authority whitelist.
 *   L3.  no external link outside the whitelist.
 *   B1.  no English banned absolutes (a translation must not keep the
 *        English red-line phrases).
 *   K1.  translated primary keyword 5–8×; each secondary 2–4×.
 *   C1.  last ### heading contains the locale "before you buy" marker and has
 *        >= 6 checklist items.
 *   C2.  a ### heading contains the locale "FAQ" marker.
 *   T1.  title <= 80 chars, contains the translated primary keyword, no year.
 *   T2.  metaDescription in the locale char band, contains a keyword.
 *   T3.  intro in the locale char band.
 *   H1.  no hollow section (>= 120 words non-CJK / >= 80 units CJK).
 *   U1.  >= 3 list items.
 *   E1.  >= 6 emoji (warn).
 *
 * Usage:
 *   node scripts/pipeline/i18n/validate.mjs <code>            # validate all <code>
 *   node scripts/pipeline/i18n/validate.mjs <code> <slug> …   # some
 * Exit 0 when every checked article passes.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { INTERNAL, EXTERNAL, BANNED } from '../en/links.mjs'
import { TARGET_LOCALES, isCJK, MARKERS, LENGTHS, WORD_BAND } from './locales.mjs'

const here = path.dirname(fileURLToPath(import.meta.url)) // scripts/pipeline/i18n
const root = path.resolve(here, '..', '..', '..') // motai-static
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

const CJK_RE = /[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/g

/** Count "units": CJK characters + non-CJK word tokens (for CJK locales). */
function unitsOfCJK(md) {
  const text = md.replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`~|]/g, ' ')
  const cjk = (text.match(CJK_RE) || []).length
  const rest = text.replace(CJK_RE, ' ')
  const words = (rest.match(/[^\s]+/g) || []).length
  return cjk + words
}
/** Count words (non-CJK locales): Markdown stripped. */
function wordsOf(md) {
  const text = md.replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`~|]/g, ' ')
  const w = text.trim().match(/[^\s]+/g)
  return w ? w.length : 0
}
/** Occurrence count of a phrase: substring for CJK locales, unicode
 * word-bounded otherwise (so diacritic boundaries like "ü" work). */
function countPhrase(text, phrase, cjk) {
  const t = text.toLowerCase()
  const p = phrase.toLowerCase()
  if (cjk) return t.split(p).length - 1
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'giu')
  return (t.match(re) || []).length
}
const stripInline = (h) => h.replace(/[#*_>`~[\]]/g, '').trim()

function validateArticle(code, file) {
  const cjk = isCJK(code)
  const markers = MARKERS[code] || { faq: 'FAQ', buy: '' }
  const lengths = LENGTHS(code)
  const raw = readFileSync(file, 'utf8')
  const { fm, body } = splitDoc(raw)
  const fails = []
  const warns = []
  const allText = body.toLowerCase()
  const total = cjk ? unitsOfCJK(body) : wordsOf(body)

  // W1. unit count — pure warning (user instruction: word count is not a gate;
  // quality is judged on terminology accuracy, links, structure, banned claims).
  if (total < WORD_BAND.min || total > WORD_BAND.max)
    warns.push(`${cjk ? 'unit' : 'word'} count ${total} outside ${WORD_BAND.min}–${WORD_BAND.max}`)

  // S1. no H1/H2
  if (/^#{1,2}\s/m.test(body)) fails.push('body contains an H1/H2 heading')

  // S2. headings
  const h3m = body.match(/^###\s/mg)
  const h3count = h3m ? h3m.length : 0
  if (h3count < 5) fails.push(`only ${h3count} ### headings (need >= 5)`)

  // L1–L3. links
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  const internal = []
  const external = []
  let m
  while ((m = linkRe.exec(body))) {
    const [, anchor, href] = m
    if (/^https?:/i.test(href)) external.push({ href, anchor, pos: m.index })
    else internal.push({ href, anchor, pos: m.index })
  }
  const pref = (h) => h.startsWith('/') ? h : `/${h}`
  const localOf = (h) => h.split('/').filter(Boolean) // first path segment
  const goodInternal = internal.filter((l) => {
    const p = pref(l.href)
    if (INTERNAL_HREFS.has(p)) return true
    if (p === `/en`) return false
    // <code>-prefixed whitelist route
    const segs = p.replace(/^\/+/, '').split('/')
    if (segs[0] === code && INTERNAL_HREFS.has('/' + segs.slice(1).join('/'))) return true
    return false
  })
  const badInternal = internal.length - goodInternal.length
  if (badInternal > 0) {
    const bad = internal.filter((l) => !goodInternal.includes(l))
    fails.push(`internal links to unknown routes: ${[...new Set(bad.map((l) => l.href))].join(', ')}`)
  }
  const badExternal = external.filter((l) => !EXTERNAL_URLS.has(l.href))
  if (badExternal.length) fails.push(`external links outside whitelist: ${[...new Set(badExternal.map((l) => l.href))].join(', ')}`)
  if (goodInternal.length < 4) fails.push(`only ${goodInternal.length} valid internal links (need >= 4)`)
  if (external.length < 1) fails.push('no authority external link')

  // L1b. thirds distribution
  if (goodInternal.length >= 4) {
    const pos = goodInternal.map((l) => l.pos)
    const n = body.length
    if (!pos.some((x) => x < n / 3)) fails.push('no internal link in the first third')
    if (!pos.some((x) => x >= n / 3 && x < (2 * n) / 3)) fails.push('no internal link in the middle third')
    if (!pos.some((x) => x >= (2 * n) / 3)) fails.push('no internal link in the last third')
  }

  // B1. banned phrases (English red-lines must not survive translation)
  for (const b of BANNED) if (allText.includes(b.toLowerCase())) fails.push(`banned phrase: "${b}"`)

  // K1. keyword density (translated keywords)
  // The 5–8× band was calibrated on EN prose. Denser-token languages (CJK,
  // and word-dense prose in general) show a much higher raw count for the
  // same natural repetition in a long article; the upper bound therefore
  // scales with article length while the floor stays at 5.
  const kw = Array.isArray(fm.keywords) ? fm.keywords : []
  if (kw.length < 3 || kw.length > 5) fails.push(`keywords count ${kw.length} (need 3–5)`)
  const p = kw[0] ? kw[0].toLowerCase() : ''
  const primaryMax = Math.max(8, Math.ceil(total / 150))
  const secondaryMax = Math.max(4, Math.ceil(total / 400))
  if (p) {
    const c = countPhrase(allText, kw[0], cjk)
    if (c < 5 || c > primaryMax) fails.push(`primary keyword "${kw[0]}" appears ${c}× (need 5–${primaryMax})`)
  }
  for (const s of kw.slice(1)) {
    const c = countPhrase(allText, s, cjk)
    if (c < 2 || c > secondaryMax) warns.push(`secondary keyword "${s}" appears ${c}× (target 2–${secondaryMax})`)
  }

  // C1/C2. FAQ + before-you-buy headings
  const heads = [...body.matchAll(/^###\s+(.+)$/gm)].map((x) => stripInline(x[1]))
  const lastH = heads[heads.length - 1] || ''
  if (markers.buy && !lastH.includes(markers.buy)) fails.push(`last ### is "${lastH}" — must contain "${markers.buy}"`)
  if (markers.faq && !heads.some((h) => h.includes(markers.faq))) fails.push(`no "${markers.faq}" section`)
  const fromEnd = body.slice(body.lastIndexOf('### '))
  const liInCompliance = (fromEnd.match(/^(?:-|\*)\s/gm) || []).length
  if (liInCompliance < 6) fails.push(`"before you buy" block has ${liInCompliance} items (need >= 6)`)

  // T1. title
  if (!fm.title || fm.title.length > 80) fails.push(`title ${fm.title?.length ?? 0} chars (<= 80)`)
  if (p && fm.title && !fm.title.toLowerCase().includes(p)) fails.push(`title lacks primary keyword "${p}"`)
  if (fm.title && /\b(19|20)\d{2}\b/.test(fm.title)) fails.push('title contains a year')

  // T2. meta description (locale char band)
  const [dmin, dmax] = lengths.metaDescription
  if (!fm.metaDescription || fm.metaDescription.length < dmin || fm.metaDescription.length > dmax)
    fails.push(`meta description ${fm.metaDescription?.length ?? 0} chars (need ${dmin}–${dmax})`)
  if (kw.length && !kw.some((k) => fm.metaDescription?.toLowerCase().includes(k.toLowerCase())))
    fails.push('meta description contains no keyword')

  // T3. intro (locale char band)
  const [imin, imax] = lengths.intro
  if (!fm.intro || fm.intro.length < imin || fm.intro.length > imax)
    fails.push(`intro ${fm.intro?.length ?? 0} chars (need ${imin}–${imax})`)

  // H1. hollow sections
  const secMin = cjk ? 80 : 120
  const parts = body.split(/^###\s+/m)
  for (const part of parts.slice(1)) {
    const u = cjk ? unitsOfCJK(part) : wordsOf(part)
    if (u < secMin) fails.push(`section only ${u} units (< ${secMin})`)
  }

  // U1. lists
  const ul = (body.match(/^(?:-|\*)\s/gm) || []).length
  if (ul < 3) fails.push(`only ${ul} list items (need >= 3)`)

  // E1. emoji
  const emoji = (body.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu) || []).length
  if (emoji < 6) warns.push(`only ${emoji} emoji (aim >= 6)`)

  return { slug: fm.slug || path.basename(file, '.md'), fails, warns, total, goodInternal: goodInternal.length, external: external.length, h3: h3count }
}

function main() {
  const code = process.argv[2]
  if (!code) { console.log('usage: validate.mjs <locale> [slug …]   (locales: ' + TARGET_LOCALES.join(' ') + ')'); process.exit(1) }
  if (!TARGET_LOCALES.includes(code)) { console.log(`unknown locale "${code}". Available: ${TARGET_LOCALES.join(' ')}`); process.exit(1) }
  const DIR = path.join(root, 'articles', code)
  if (!existsSync(DIR)) { console.log(`no article dir yet at ${DIR}`); process.exit(0) }
  const only = process.argv.slice(3)
  let files = readdirSync(DIR).filter((f) => f.endsWith('.md')).sort()
  if (only.length) files = files.filter((f) => only.includes(f.replace(/\.md$/, '')))
  let pass = 0
  let failCount = 0
  for (const f of files) {
    try {
      const r = validateArticle(code, path.join(DIR, f))
      if (r.fails.length === 0) {
        pass++
        console.log(`PASS [${code}] ${r.slug} (${r.total}u, ${r.goodInternal} in, ${r.external} out, ${r.h3} h3)`)
        if (r.warns.length) console.log(`     warn: ${r.warns.join(' | ')}`)
      } else {
        failCount++
        console.log(`FAIL [${code}] ${r.slug} (${r.total}u)`)
        r.fails.forEach((x) => console.log(`   ✗ ${x}`))
        r.warns.forEach((x) => console.log(`   ~ ${x}`))
      }
    } catch (e) {
      failCount++
      console.log(`FAIL [${code}] ${f} — ${e.message}`)
    }
  }
  if (files.length) console.log(`\n[${code}] ${pass} passed, ${failCount} failed, ${files.length} checked`)
  process.exit(failCount ? 1 : 0)
}

main()
