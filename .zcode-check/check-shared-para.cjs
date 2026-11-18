#!/usr/bin/env node
/**
 * 语料同质化门禁（构建后运行，读 articles/ 源）。
 *
 * 背景：scaled content abuse 的实质信号不是「文章多」而是「同一句跨大量
 * 页面逐字/近似重复」。本门禁对 EN 源 + 各语种译文按「段落全文指纹」
 * 统计跨篇共享，超过阈值即拦截，防止模板化段落被未来改动悄悄放大。
 *
 * 检查项，任一不满足即 exit 1：
 *  1. 任一「段落（≥25 词）被 ≥10 篇逐字共享」——scaled content 强信号
 *  2. 任一「段落被 ≥30 篇共享」——即使低词也拦（纯填充重复）
 *
 * 与 check-blog-clone.cjs 并列，由 npm run build 串行调用。
 * 归一化用 Unicode-aware（[\p{L}\p{N}]），避免把波斯/希伯来/泰文等
 * 非 ASCII 字母全部抹成空格造成空键碰撞的假阳性。
 */
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
const ART = path.join(root, 'articles')

const clean = (t) => t.replace(/^(?:[ \t]*<!--[\s\S]*?-->[ \t]*\r?\n)+/, '').replace(/\uFEFF/g, '')
const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
const wc = (t) => t.split(/\s+/).filter(Boolean).length

// 阈值：≥25 词段被 ≥10 篇共享即 FAIL；任意段被 ≥30 篇共享也 FAIL
const WORDS_MIN = 25
const SHARE_HARD = 10
const SHARE_ABS = 30

const langs = fs.readdirSync(ART).filter((d) => {
  const p = path.join(ART, d)
  return fs.statSync(p).isDirectory()
})

const problems = []
for (const lang of langs) {
  const dir = path.join(ART, lang)
  const docs = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
  if (docs.length < 10) continue // 小语种样本不足，不判共享
  const cnt = new Map()
  for (const slug of docs) {
    const c = clean(fs.readFileSync(path.join(dir, slug + '.md'), 'utf8'))
    const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(c)
    const body = fm ? c.slice(fm[0].length) : c
    const seen = new Set()
    for (const p of body.split(/\r?\n\r?\n+/)) {
      const tx = p.trim()
      if (!tx || /^#{3,4}\s/.test(tx) || /^<!--/.test(tx)) continue
      const items = /^([-*>|]\s|\d+\.\s)/.test(tx)
        ? tx.split(/\r?\n/).map((li) => li.replace(/^[-*>]\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim())
        : [tx.replace(/\*\*/g, '')]
      for (const it of items) {
        if (!it) continue
        const k = norm(it)
        if (!k || seen.has(k)) continue
        seen.add(k)
        if (!cnt.has(k)) cnt.set(k, { n: 0, words: wc(it), text: it })
        cnt.get(k).n++
      }
    }
  }
  for (const v of cnt.values()) {
    const tooLongShared = v.n >= SHARE_ABS
    const longParaShared = v.words >= WORDS_MIN && v.n >= SHARE_HARD
    if (tooLongShared || longParaShared) {
      problems.push(lang + ': 段落被 ' + v.n + ' 篇共享（' + v.words + ' 词）' + v.text.slice(0, 60).replace(/\s+/g, ' ') + '…')
    }
  }
}
if (problems.length) {
  console.log('SHARED-PARA FAIL (' + problems.length + ')')
  for (const p of problems.slice(0, 30)) console.log('  - ' + p)
  process.exit(1)
}
console.log(`SHARED PARA OK — ${langs.length} locales scanned (no paragraph shared by ≥${SHARE_HARD} files ≥${WORDS_MIN} words, none shared by ≥${SHARE_ABS})`)
