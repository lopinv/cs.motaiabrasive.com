/**
 * 模板注释泄漏门禁（构建前运行，读 src 下的全部 .astro）。
 *
 * Astro 文件分两段：frontmatter（--- 包围）与模板（其余）。模板里只有
 * HTML 注释（以小于号-感叹号开头）会被编译器剔除；写成 JS 块注释会被当
 * 字面文本输出到页面（用户截图里能看见注释原文）。
 *
 * 本脚本扫描所有 .astro 的模板段，命中以下任一模式即 exit 1：
 *   1) 整行 JS 块注释（行首空白 + slash-star 开头）
 *   2) 表达式内的块注释（花括号后紧跟 slash-star）
 * frontmatter 内的注释不受影响，不检查。
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src')
const problems = []
let files = 0

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.astro') continue
      walk(p)
    } else if (e.name.endsWith('.astro')) {
      check(p)
      files++
    }
  }
}

function check(p) {
  const src = fs.readFileSync(p, 'utf8')
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(src)
  if (!m) return
  const fmLines = m[1].split('\n').length
  const body = m[2].split('\n')
  body.forEach((line, i) => {
    const ln = fmLines + 3 + i // +3: 首行 --- + 末行 --- + 换行偏移，1-based
    // 整行就是 JS 块注释（单行闭合；跨行由 /\* 开头的单行规则另行捕获）
    if (/^\s*\/\*.*\*\/\s*$/.test(line)) {
      problems.push(`${path.relative(SRC, p)}:${ln} JS block comment in template -> ${line.trim()}`)
    }
    if (/\{\s*\/\*/.test(line)) {
      problems.push(`${path.relative(SRC, p)}:${ln} JS block comment inside expression -> ${line.trim()}`)
    }
  })
}

walk(SRC)
if (problems.length) {
  console.log('TEMPLATE-COMMENT FAIL (' + problems.length + ')')
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log(`TEMPLATE COMMENTS OK — ${files} .astro files, no JS block comments in template regions`)
