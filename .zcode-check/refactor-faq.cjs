#!/usr/bin/env node
/**
 * 把 12 处手写 FAQ 块替换为 <AccordionFaq> 组件调用。
 *
 * 所有目标块的内部文本完全同构（仅缩进与 itemVar 名不同），因此用
 * 精确字符串 replaceAll 处理，比正则可靠。
 */
const fs = require('fs')

const files = process.argv.slice(2)
if (!files.length) { console.error('usage: node refactor-faq.cjs <file.astro> [...]'); process.exit(2) }

let total = 0
for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`missing: ${file}`); continue }
  let src = fs.readFileSync(file, 'utf8')
  const before = src
  let hit = 0

  // 形态 A：faq-list（单列）+ itemVar = f
  src = src.replace(
    `<div class="faq-list">\r\n        {faqItems.map((f) => (\r\n          <div class="faq-item">\r\n            <h3 class="faq-q">{f.q}</h3>\r\n            <p class="faq-a">{f.a}</p>\r\n          </div>\r\n        ))}\r\n      </div>`,
    () => { hit++; return `{faqItems.length > 0 && <AccordionFaq items={faqItems.map((f) => ({ q: f.q, a: f.a })).filter((x) => x.q && x.a)} />}` }
  )
  // 形态 A2：单列 + itemVar = q
  src = src.replace(
    `<div class="faq-list">\r\n      {faqItems.map((q) => (\r\n        <div class="faq-item">\r\n          <h3 class="faq-q">{q.q}</h3>\r\n          <p class="faq-a">{q.a}</p>\r\n        </div>\r\n      ))}\r\n    </div>`,
    () => { hit++; return `{faqItems.length > 0 && <AccordionFaq items={faqItems.map((q) => ({ q: q.q, a: q.a })).filter((x) => x.q && x.a)} />}` }
  )
  // 形态 A3：单列 + 10 空格缩进（videos 详情页）
  src = src.replace(
    `<div class="faq-list">\r\n          {faqItems.map((f) => (\r\n            <div class="faq-item">\r\n              <h3 class="faq-q">{f.q}</h3>\r\n              <p class="faq-a">{f.a}</p>\r\n            </div>\r\n          ))}\r\n        </div>`,
    () => { hit++; return `{faqItems.length > 0 && <AccordionFaq items={faqItems.map((f) => ({ q: f.q, a: f.a })).filter((x) => x.q && x.a)} />}` }
  )
  // 形态 B：双列（faq-list--2col mt-24）+ itemVar = item
  src = src.replace(
    `<div class="faq-list faq-list--2col mt-24">\r\n        {q.map((item) => (\r\n          <div class="faq-item">\r\n            <h3 class="faq-q">{pick(item.qKey)}</h3>\r\n            <p class="faq-a">{pick(item.aKey)}</p>\r\n          </div>\r\n        ))}\r\n      </div>`,
    () => { hit++; return `<AccordionFaq\n        items={q.map((item) => ({ q: pick(item.qKey), a: pick(item.aKey) })).filter((x) => x.q && x.a)}\n        twoCol\n      />` }
  )
  // 形态 B2：双列 + 4 空格缩进（products 页）
  src = src.replace(
    `<div class="faq-list faq-list--2col mt-24">\r\n      {q.map((item) => (\r\n        <div class="faq-item">\r\n          <h3 class="faq-q">{pick(item.qKey)}</h3>\r\n          <p class="faq-a">{pick(item.aKey)}</p>\r\n        </div>\r\n      ))}\r\n    </div>`,
    () => { hit++; return `<AccordionFaq\n      items={q.map((item) => ({ q: pick(item.qKey), a: pick(item.aKey) })).filter((x) => x.q && x.a)}\n      twoCol\n    />` }
  )

  if (hit) {
    if (!/import AccordionFaq from/.test(src)) {
      const depth = file.split('/').filter((s) => s.startsWith('[')).length
      const rel = depth >= 1 ? '../../../components/AccordionFaq.astro' : '../components/AccordionFaq.astro'
      const anchor = /(import CtaBand from ['"][^'"]+CtaBand\.astro['"]\r\n)/
      src = anchor.test(src)
        ? src.replace(anchor, `$1import AccordionFaq from '${rel}'\r\n`)
        : src.replace(/(^import .*\r\n)/, `$1import AccordionFaq from '${rel}'\r\n`)
    }
    fs.writeFileSync(file, src)
    total += hit
    console.log(`✓ ${file} — ${hit} 块`)
  } else {
    console.log(`- ${file} — 无匹配`)
  }
}
console.log(`\ntotal: ${total}`)