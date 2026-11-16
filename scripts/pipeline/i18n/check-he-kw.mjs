import { readFileSync } from 'node:fs'
const t = readFileSync('articles/he/how-to-pick-stainless-steel-finishing-the-right-one.md', 'utf8')
const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
const body = t.slice(m[0].length)
const text = body.replace(/<[^>]+>/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`~|]/g, ' ')
const words = (text.trim().match(/[^\s]+/g) || []).length
console.log('words:', words)
const kw = (phrase) => {
  const e = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (t.match(new RegExp('(?<![\\p{L}\\p{N}])' + e + '(?![\\p{L}\\p{N}])', 'giu')) || []).length
}
for (const k of ['גימור פלדה אל-חלדית', '1200', 'חלודה', 'לוח פלדה', 'ריתוך']) console.log(k, '=', kw(k))
const fm = Object.fromEntries(m[1].split(/\r?\n/).filter((l) => l.includes(':')).map((l) => {
  const i = l.indexOf(':')
  return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
}))
console.log('title len', fm.title.length)
console.log('meta len', fm.metaDescription.length)
console.log('intro len', fm.intro.length)
