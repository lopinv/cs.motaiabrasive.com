// 临时分析脚本（用完即删）：定位词边界 גריט 出现的行
import { readFileSync } from 'node:fs'

const raw = readFileSync(
  'D:/Code/shopify/motai-static/articles/he/how-to-use-sandpaper-rolls-your-sanding-disc.md',
  'utf8'
)
const t = raw.replace(/^\s+/, '').replace(/^(?:<!-- .*?-->\n)+/, '')
const m2 = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
const body = t.slice(m2[0].length)
const linesB = body.split(/\r?\n/)
const re = new RegExp('(?<![\\p{L}\\p{N}])גריט(?![\\p{L}\\p{N}])', 'giu')
let n = 0
linesB.forEach((l, idx) => {
  const cnt = (l.toLowerCase().match(re) || []).length
  if (cnt) {
    n += cnt
    // 找出每个出现的上下文
    const re2 = new RegExp('(?<![\\p{L}\\p{N}])גריט(?![\\p{L}\\p{N}])', 'giu')
    let mm, ctx = []
    while ((mm = re2.exec(l.toLowerCase()))) {
      const s = Math.max(0, mm.index - 30)
      ctx.push('...' + l.slice(s, mm.index + 6 + 24).replace(/\s+/g, ' ') + '...')
    }
    console.log('body-line ' + idx + ' [' + cnt + 'x]')
    ctx.forEach((c) => console.log('   ' + c))
  }
})
console.log('TOTAL word-boundary גריט:', n)
