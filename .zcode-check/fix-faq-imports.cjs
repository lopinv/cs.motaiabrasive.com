#!/usr/bin/env node
/**
 * 为所有使用 AccordionFaq 的页面补 AccordionFaq import（若无）。
 */
const fs = require('fs')
const { execSync } = require('child_process')

const files = execSync('grep -rl "AccordionFaq items" src/pages/ || true', { encoding: 'utf8' })
  .split('\n').filter(Boolean)

let fixed = 0
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8')
  if (/import AccordionFaq from/.test(s)) continue
  const depth = f.split('/').filter((x) => x.startsWith('[')).length
  const rel = depth >= 1 ? '../../../components/AccordionFaq.astro' : '../components/AccordionFaq.astro'
  const anchor = /(import CtaBand from ['"][^'"]+CtaBand\.astro['"]\r?\n)/
  if (anchor.test(s)) {
    s = s.replace(anchor, `$1import AccordionFaq from '${rel}'\n`)
  } else {
    s = s.replace(/^(import .*\r?\n)/, `$1import AccordionFaq from '${rel}'\n`)
  }
  fs.writeFileSync(f, s)
  console.log(`+ import added: ${f}`)
  fixed++
}
console.log(`\n${fixed} file(s) fixed`)