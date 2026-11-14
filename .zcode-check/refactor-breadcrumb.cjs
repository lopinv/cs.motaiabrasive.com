#!/usr/bin/env node
/**
 * 把 26 处内联面包屑替换为 <Breadcrumb> 组件调用。
 *
 * 解析 `<div class="wrap breadcrumb">…</div>` 内的扁平子元素序列：
 *   <a href={lu('/x')}>{label}</a>   → { name, href: '/x' }（链接级）
 *   <span>{label}</span>              → { name }（末级，无 href）
 *   <span>/</span>                    → 分隔符，忽略
 *   {cond && <span>/</span>}          → 条件分隔符，并入末级处理
 *
 * 生成：<Breadcrumb lang={lang} trail={[{ name: '..', href: '/..' }, { name: '..' }]} />
 * Home 文本由组件内部用 pick('nav.home') 渲染（42 语种已翻译，不新增键）。
 */
const fs = require('fs')

const files = process.argv.slice(2)
if (!files.length) { console.error('usage: node refactor-breadcrumb.cjs <file.astro> [...]'); process.exit(2) }

let total = 0
for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`missing: ${file}`); continue }
  let src = fs.readFileSync(file, 'utf8')
  const before = src
  let hit = 0

  // 逐行找起点，按 div 开闭平衡取整块（面包屑无嵌套 div，一行内即闭合）
  src = src.replace(/<div class="wrap breadcrumb">([\s\S]*?)<\/div>/g, (block, inner) => {
    hit++
    const trail = []
    // 依次捕获 a / span / 条件片段
    const re = /<a href=\{lu\('([^']*)'\)\}>([\s\S]*?)<\/a>|<span>([\s\S]*?)<\/span>|\{(\w+) && <span>([\s\S]*?)<\/span>\}/g
    let m
    let lastWasLink = false
    while ((m = re.exec(inner)) !== null) {
      if (m[1] !== undefined && m[1] !== null) {
        // 链接级：m[1]=href  m[2]=label 表达式
        // 已是 {…} 的表达式剥掉外层花括号作为 JS 表达式值；裸文本转字符串字面量
        const raw = m[2].trim()
        const nameExpr = (raw.startsWith('{') && raw.endsWith('}')) ? raw.slice(1, -1).trim() : `'${raw}'`
        trail.push({ href: m[1], name: nameExpr })
        lastWasLink = true
        continue
      }
      // 非 a：判断是分隔符还是末级文本
      const text = (m[3] ?? m[5] ?? '').trim()
      if (text === '/') { lastWasLink = false; continue } // 分隔符
      // 末级（span 或条件 span）——只取第一个末级，忽略其后条件分隔符
      if (text) {
        const nameExpr = (text.startsWith('{') && text.endsWith('}')) ? text.slice(1, -1).trim() : `'${text}'`
        trail.push({ name: nameExpr })
        lastWasLink = false
        break
      }
      lastWasLink = false
    }
    if (!trail.length) { hit--; return block } // 解析失败，保守还原
    // JSX 表达式必须整体包在 {} 里；裸文本（如 Home）保持原样不加括号，
    // 已是 {…} 形式的表达式原样保留。
    const parts = trail.map((t) =>
      t.href ? `{ name: ${t.name}, href: '${t.href}' }` : `{ name: ${t.name} }`
    )
    return '<Breadcrumb lang={lang} trail={[' + parts.join(', ') + ']} />'
  })

  if (src !== before) {
    if (!/import Breadcrumb from/.test(src)) {
      const depth = file.split('/').filter((s) => s.startsWith('[')).length
      const rel = depth >= 1 ? '../../../components/Breadcrumb.astro' : '../components/Breadcrumb.astro'
      const anchor = /(import Shell from ['"][^'"]+Shell\.astro['"]\r\n)/
      src = anchor.test(src)
        ? src.replace(anchor, `$1import Breadcrumb from '${rel}'\r\n`)
        : src.replace(/(^import .*\r\n)/, `$1import Breadcrumb from '${rel}'\r\n`)
    }
    fs.writeFileSync(file, src)
    total += hit
    console.log(`✓ ${file} — ${hit} 处`)
  } else {
    console.log(`- ${file} — 无匹配`)
  }
}
console.log(`\ntotal: ${total}`)