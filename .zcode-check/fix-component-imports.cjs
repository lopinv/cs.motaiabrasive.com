#!/usr/bin/env node
/**
 * 自检并修正所有页面的组件 import：
 *   1. 使用了 <AccordionFaq> 但无 import → 补（深度对齐同文件的 CtaBand import）
 *   2. 使用了 <Breadcrumb> 但无 import → 补
 *   3. import 深度与同文件 CtaBand/Shell import 不一致 → 对齐
 *
 * 以同文件已有的 CtaBand import 深度为基准（它一定是对的），避免手算层级出错。
 */
const fs = require('fs')
const path = require('path')

function walk(dir) {
  let out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (e.name.startsWith('.')) continue; out = out.concat(walk(p)) }
    else if (e.name.endsWith('.astro')) out.push(p)
  }
  return out
}

const COMPS = ['AccordionFaq', 'Breadcrumb']
let added = 0, fixed = 0

for (const f of walk(path.join('src', 'pages'))) {
  let s = fs.readFileSync(f, 'utf8')

  // 基准深度：同文件 CtaBand 或 Shell import 的前缀
  const baseM = /import (?:CtaBand|Shell) from '(\.\.\/)+components\//.exec(s)
  if (!baseM) { console.log(`skip (no base): ${f}`); continue }
  const prefix = baseM[0].match(/((?:\.\.\/)+)components\//)[1]
  let changed = false

  for (const comp of COMPS) {
    const used = new RegExp(`<${comp}[\\s/>]`).test(s)
    const importRe = new RegExp(`import ${comp} from '([^']+)'`)
    const hasImport = importRe.test(s)
    const want = `import ${comp} from '${prefix}components/${comp}.astro'`

    if (used && !hasImport) {
      s = s.replace(baseM[0], `${baseM[0]}\n${want}`)
      added++
      changed = true
      console.log(`+ add ${comp}: ${f}`)
    } else if (hasImport) {
      const got = s.match(importRe)[1]
      const wantPath = `${prefix}components/${comp}.astro`
      if (got !== wantPath) {
        s = s.replace(importRe, want)
        fixed++
        changed = true
        console.log(`~ fix ${comp} depth: ${f}`)
      }
    }
  }
  if (changed) fs.writeFileSync(f, s)
}
console.log(`\nadded ${added}, depth-fixed ${fixed}`)