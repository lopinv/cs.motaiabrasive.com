/**
 * getStaticPaths TDZ 门禁（构建前运行，读 src 下全部 .astro）。
 *
 * Astro 页面 frontmatter 里的 export function getStaticPaths 会被 bundler
 * 提升到编译产物前部，而顶层 const 声明不提升。若 getStaticPaths 引用了
 * 定义在它之后的顶层 const，运行时抛 "<NAME> is not defined"（TDZ）——
 * 这类错误只在 astro build 的生成阶段暴露，dev server 反而不报。
 *
 * 规则：getStaticPaths 体内引用的顶层 const/let 必须定义在它之前。
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src')
const problems = []
let files = 0

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.astro')) {
      check(p)
      files++
    }
  }
}

function check(p) {
  const src = fs.readFileSync(p, 'utf8')
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)
  if (!m) return
  const fm = m[1]
  const gp = /export\s+(?:async\s+)?function\s+getStaticPaths\s*\(/.exec(fm)
  if (!gp) return

  const before = fm.slice(0, gp.index)
  // 取 getStaticPaths 函数体（配花括号）
  let depth = 0, i = fm.indexOf('{', gp.index), end = -1
  for (let j = i; j < fm.length; j++) {
    if (fm[j] === '{') depth++
    else if (fm[j] === '}') { depth--; if (depth === 0) { end = j; break } }
  }
  const body = fm.slice(i, end)

  const definedBefore = new Set([...before.matchAll(/^\s*(?:const|let|var)\s+([A-Za-z0-9_]+)/gm)].map((x) => x[1]))
  const definedAfter = [...fm.slice(gp.index).matchAll(/^\s*(?:const|let|var)\s+([A-Za-z0-9_]+)/gm)].map((x) => x[1])

  // 函数体内引用的标识符。排除：局部声明、import 绑定、以及箭头函数/普通
  // 函数的形参名（(x) => ... 的 x 不是顶层引用，否则 .map((p)=>p.handle)
  // 会把每次都误报成 TDZ）。
  const localDecls = new Set([...body.matchAll(/(?:const|let|var)\s+([A-Za-z0-9_]+)/g)].map((x) => x[1]))
  const importNames = new Set([...fm.matchAll(/import\s*\{([^}]*)\}/g)].flatMap((x) => x[1].split(',')).map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean))
  const paramNames = new Set()
  for (const m of body.matchAll(/\(([^()]*)\)\s*=>/g)) {
    m[1].split(',').forEach((s) => paramNames.add(s.trim().replace(/^[{[]|[}\]]$/g, '').split('=')[0].trim()))
  }
  for (const m of body.matchAll(/function\s*[A-Za-z0-9_$]*\s*\(([^()]*)\)/g)) {
    m[1].split(',').forEach((s) => paramNames.add(s.trim().split('=')[0].trim()))
  }
  const identifiers = new Set([...body.matchAll(/(?<![.\w$])([A-Za-z_$][A-Za-z0-9_$]*)(?!\s*[:(])/g)].map((x) => x[1]))

  for (const name of identifiers) {
    if (!name) continue
    if (localDecls.has(name) || importNames.has(name) || paramNames.has(name) || definedBefore.has(name)) continue
    if (definedAfter.includes(name)) {
      problems.push(
        `${path.relative(SRC, p)}: getStaticPaths references '${name}' declared AFTER it (TDZ at build). Move it above, inline it, or import it from a module.`
      )
    }
  }
}

walk(SRC)
if (problems.length) {
  console.log('STATICPATHS-TDZ FAIL (' + problems.length + ')')
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log(`GETSTATICPATHS TDZ OK — ${files} .astro files checked`)
