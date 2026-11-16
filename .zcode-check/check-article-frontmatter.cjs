/**
 * 文章 frontmatter 门禁（构建前运行，读 articles/ 下全部 .md）。
 *
 * Astro 的 glob loader 要求 frontmatter 块（--- … ---）是文件的第一个字符：
 * 一旦前面有内容（例如翻译分片稿遗留的 `<!-- PART 00/5 of … -->` 说明注释），
 * loader 就把整个文件当正文，schema 校验报 "slug: Required" 并中断整个
 * astro build —— 一个坏文件让 9000+ 页全部构建失败，且报错信息指向最后的
 * 那个文件，无法看出是「前置注释」这一类问题。
 *
 * 这类文件由绕过 i18n/merge.mjs 的历史会话直接落盘产生（merge.mjs 自身有
 * frontmatter 保护，正规合并不可能产出）。本门禁把它变成 build 前的一次
 * 明确报错，而不是 astro 生成阶段的模糊崩溃。
 *
 * 检查项：
 *   1. 文件以 `---` 开头（frontmatter 在最前）
 *   2. frontmatter 内可解析出 slug（与 content.config.ts schema 对齐）
 *
 * 用法：node .zcode-check/check-article-frontmatter.cjs
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const ARTICLES = path.join(ROOT, 'articles')

const problems = []
let files = 0

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      // .parts/ 内的分片稿不进 collection（Astro glob 的 dot 目录默认排除），
      // 其 PART 标记注释本就该在 frontmatter 之前，故不纳入检查。
      if (e.name.startsWith('.')) continue
      walk(p)
      continue
    }
    if (!e.name.endsWith('.md')) continue
    check(p)
    files++
  }
}

function check(p) {
  const rel = path.relative(ROOT, p).replaceAll('\\', '/')
  const src = fs.readFileSync(p, 'utf8')

  if (!src.startsWith('---')) {
    // 文件里有 frontmatter 但被挤到后面 → 就是 loader 会崩的那种
    const hasFm = /---[\s\S]*?slug\s*:/.test(src)
    problems.push(
      hasFm
        ? `${rel} — frontmatter 之前有前置内容（第 1 行：${JSON.stringify(firstLine(src))}）。把前置注释移到 frontmatter 之后即可。`
        : `${rel} — 文件不以 --- 开头且无 frontmatter（第 1 行：${JSON.stringify(firstLine(src))}）。`
    )
    return
  }

  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)
  if (!m) {
    problems.push(`${rel} — frontmatter 起始 --- 存在但没有闭合的 ---。`)
    return
  }
  if (!/^slug\s*:/m.test(m[1])) {
    problems.push(`${rel} — frontmatter 内缺少 slug 字段（content.config.ts 要求）。`)
  }
}

function firstLine(src) {
  return src.split(/\r?\n/)[0].slice(0, 60)
}

// .parts/ 等 dot 目录内的分片稿不进 collection，其 PART 标记注释本就该在
// frontmatter 之前，故不纳入检查（walk 内已跳过）。
walk(ARTICLES)

if (problems.length) {
  console.error(`✗ 文章 frontmatter 检查失败：${problems.length} 个问题文件（共扫描 ${files} 个 .md）`)
  for (const p of problems.slice(0, 20)) console.error('  - ' + p)
  if (problems.length > 20) console.error(`  … 另有 ${problems.length - 20} 个`)
  console.error('\n修复：把 frontmatter 移回文件最前（前置说明注释放到 frontmatter 之后）。')
  process.exit(1)
}

console.log(`✓ 文章 frontmatter 检查通过 — ${files} 个 .md，全部 frontmatter 在文件最前`)