#!/usr/bin/env node
/**
 * 博客路由面无克隆门禁（构建后运行，读 dist）。
 *
 * 背景：未译语种的博客文章页曾回退渲染 EN 正文，在 /<lang>/blog/<slug>/
 * 造出 4852 个与 EN 站内容相同的克隆页（占全部文章 URL 的 84.8%）——
 * scaled content abuse 的典型形态。2026-11-17 起改为**不生成这些路由**：
 * mdArticles() 只返回本语种自有译文，未译 slug 不出现在路由集合、列表、
 * 侧栏、hreflang 或 sitemap 里。本门禁断言产物仍保持这个口径，防止未来
 * 改动（比如给 mdArticles 加回 fallback）把克隆面悄悄放回来。
 *
 * 检查项，任一不满足即 exit 1：
 *  1. 磁盘上的文章详情页数 == sitemap 列出的文章详情页数（逐语种）
 *  2. 该语种文章详情页数 == 语种自有译稿数 + 6 篇全语种短文
 *  3. 站内不存在指向 404 的 blog 链接（抽查每语种文章页 + 列表页链出的
 *     全部分类/分页 URL）
 *  4. 不出现 noindex（克隆面靠删除解决，不靠 noindex 掩盖）
 *
 * 与 key-parity / check-slash / check-blog-sidebar 并列，
 * 由 npm run build 串行调用（在 check-blog-sidebar.cjs 之后）。
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const DIST = path.join(root, 'dist')
const ARTICLES = path.join(root, 'articles')
const I18N = path.join(root, 'src/i18n')

const problems = []
const langs = fs.readdirSync(I18N).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()
const blogShort = JSON.parse(fs.readFileSync(path.join(root, 'src/data/blog.json'), 'utf8'))

/* ---------- 1+2. 逐语种：磁盘页数 / sitemap 条目数 / 应有页数 ---------- */
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8')
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

for (const lang of langs) {
  const blogDir = path.join(DIST, lang, 'blog')
  // 磁盘上的文章详情页（排除 page/ 与 category/ 两个集合页目录）
  const onDisk = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name !== 'page' && e.name !== 'category')
        .length
    : 0
  const inSitemap = locs.filter((u) => new RegExp(`/${lang}/blog/[^/]+/$`).test(u)).length

  // 应有页数 = 该语种 articles/<lang>/*.md 数 + 全语种短文数。
  // en 是源语种，其 articles/en/*.md 已是全部 md 篇目；i18n 目录只有译文
  // 副本（无 en/*.md），所以各自读自己的目录，再加共有的 6 篇短文。
  const langDir = path.join(ARTICLES, lang)
  const own = fs.existsSync(langDir)
    ? fs.readdirSync(langDir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.md')).length
    : 0
  const expected = own + blogShort.length

  if (onDisk !== inSitemap) problems.push(`${lang}: 磁盘文章页 ${onDisk} != sitemap ${inSitemap}`)
  if (onDisk !== expected) {
    problems.push(`${lang}: 磁盘文章页 ${onDisk} != 应有 ${expected}（自有译稿 ${own} + 短文 ${blogShort.length}）`)
  }
}

/* ---------- 3. 站内 blog 链接不得指向 404 ---------- */
// 只扫文章详情页与博客列表页链出的 URL（侧栏/分页器/分类 chips 全在此列）。
let broken = 0
const samples = []
for (const lang of langs) {
  for (const sub of ['', 'page/2', 'page/3', 'category/selection-guide', 'category/buyer-resources']) {
    const p = path.join(DIST, lang, 'blog', sub, 'index.html')
    if (fs.existsSync(p)) samples.push(p)
  }
}
for (const p of samples) {
  const h = fs.readFileSync(p, 'utf8')
  for (const m of h.matchAll(/href="(\/[^"]*\/blog\/[^"]*)"/g)) {
    let l = m[1]
    if (/^https?:/.test(l) || l.startsWith('//')) continue
    if (!l.endsWith('/')) { broken++; if (problems.length < 40) problems.push(`${path.relative(DIST, p)} → 链接缺尾斜杠 ${l}`); continue }
    if (!fs.existsSync(path.join(DIST, l.replace(/^\//, ''), 'index.html'))) {
      broken++
      if (problems.length < 40) problems.push(`${path.relative(DIST, p)} → 404 ${l}`)
    }
  }
}
if (broken && problems.length >= 40) problems.push(`… 另有 ${broken - (problems.length - 0)} 处断链未列`)

/* ---------- 4. 不得用 noindex 掩盖克隆 ---------- */
let noindex = 0
for (const lang of langs) {
  const dir = path.join(DIST, lang, 'blog')
  if (!fs.existsSync(dir)) continue
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === 'index.html' && /<meta name="robots" content="noindex/.test(fs.readFileSync(p, 'utf8'))) noindex++
    }
  }
  walk(dir)
}
if (noindex) problems.push(`${noindex} 个博客页带 noindex（克隆面应靠删除路由解决，不靠 noindex 掩盖）`)

if (problems.length) {
  console.log('BLOG-CLONE FAIL (' + problems.length + ')')
  for (const p of problems.slice(0, 40)) console.log('  - ' + p)
  process.exit(1)
}
const total = locs.filter((u) => /\/blog\/[^/]+\/$/.test(u)).length
console.log(`BLOG CLONE OK — ${langs.length} locales, ${total} article URLs (per-locale scoped, 0 dangling, 0 noindex)`)