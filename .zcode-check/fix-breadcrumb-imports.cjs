#!/usr/bin/env node
/**
 * 修正 src/pages/[lang]/ 直下文件的 Breadcrumb import 路径：
 * 直下文件（about/oem/blog 等）应为 2 层 ../../components/，
 * 子目录文件（[slug]、[key] 等）保持 3 层 '../../../components/'。
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join('src', 'pages', '[lang]')
const top = fs.readdirSync(DIR).filter((f) => f.endsWith('.astro'))
let n = 0
for (const f of top) {
  const p = path.join(DIR, f)
  let s = fs.readFileSync(p, 'utf8')
  if (s.includes("import Breadcrumb from '../../../components/Breadcrumb.astro'")) {
    s = s.replace("import Breadcrumb from '../../../components/Breadcrumb.astro'", "import Breadcrumb from '../../components/Breadcrumb.astro'")
    fs.writeFileSync(p, s)
    n++
  }
}
console.log(`fixed ${n} top-level page(s)`)