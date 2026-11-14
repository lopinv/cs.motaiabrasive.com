#!/usr/bin/env node
/**
 * 修正 src/pages/[lang]/ 直下文件的 AccordionFaq/Breadcrumb import 路径：
 * 直下文件应为 2 层 ../../components/，子目录文件保持 3 层。
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join('src', 'pages', '[lang]')
const top = fs.readdirSync(DIR).filter((f) => f.endsWith('.astro'))
let n = 0
for (const f of top) {
  const p = path.join(DIR, f)
  let s = fs.readFileSync(p, 'utf8')
  let changed = false
  for (const comp of ['AccordionFaq', 'Breadcrumb']) {
    const bad = `import ${comp} from '../../../components/${comp}.astro'`
    const good = `import ${comp} from '../../components/${comp}.astro'`
    if (s.includes(bad)) { s = s.replace(bad, good); changed = true }
  }
  if (changed) { fs.writeFileSync(p, s); n++; console.log(`fixed ${p}`) }
}
console.log(`\n${n} file(s) fixed`)