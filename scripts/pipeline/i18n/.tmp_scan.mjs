import { readFileSync } from 'node:fs'
const raw = readFileSync('D:/Code/shopify/motai-static/articles/he/how-to-use-wide-belt-sanding-the-backing.md', 'utf8')
const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/m)
const body = raw.slice(m[0].length)
const text = body.replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`~|]/g, ' ')
const words = (text.trim().match(/[^\s]+/g) || []).length
console.log('words:', words)
function countPhrase(text, phrase) {
  const t = text.toLowerCase()
  const p = phrase.toLowerCase()
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'giu')
  return (t.match(re) || []).length
}
for (const k of ['שיוף ברצועה רחבה', 'לוחות עץ', 'מלטש']) console.log(k, '->', countPhrase(body, k))
const bad = {}
for (const ch of body) {
  const c = ch.codePointAt(0)
  const key =
    (c >= 0x0370 && c <= 0x03ff) ? 'greek' :
    (c >= 0x0400 && c <= 0x04ff) ? 'cyrillic' :
    (c >= 0x0e00 && c <= 0x0e7f) ? 'thai' :
    (c >= 0x0900 && c <= 0x097f) ? 'devanagari' :
    (c >= 0x4e00 && c <= 0x9fff) ? 'cjk' :
    (c >= 0xac00 && c <= 0xd7af) ? 'hangul' : null
  if (key) bad[key] = (bad[key] || 0) + 1
}
console.log('bad codepoints:', JSON.stringify(bad))
