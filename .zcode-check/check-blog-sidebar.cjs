/**
 * 博客侧栏 + 分页产物验收门禁（构建后运行，读 dist HTML）。
 *
 * 检查项，任一不满足即 exit 1：
 *  1. 每个语种的博客列表页（含每一个分页页与分类链页）都渲染出完整侧栏
 *     （商品 / 服务 / 最新文章 / 分类入口 四个模块）；
 *  2. 侧栏与分页器所有站内链接带尾部斜杠（Cloudflare Pages 目录式路由），
 *     不出现站内科谱路由（硬约束 4），分页链接无 /page/n/page/m 双重页码段；
 *  3. 文章页侧栏 TOC 与正文锚点对应（长文章），短文不出现 TOC 块；
 *  4. sitemap.xml 的 /blog 条目与磁盘页面一一对应（防 gen-seo 分页常量漂移
 *     后，sitemap 列出 404 或漏掉真实页面）。
 *
 * 与 key-parity / check-slash 并列，由 npm run build 串行调用。
 */
const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, '..', 'dist')
const I18N = path.join(__dirname, '..', 'src', 'i18n')
// 分页大小从单一来源读取：scripts/gen-seo.mjs 里是同一常量的副本，
// 两处必须一致（sitemap URL 数与实际页面对不上时，先查这里）。
const PAGE_SIZE = Number(
  /export const BLOG_PAGE_SIZE = (\d+)/.exec(fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'blog-pager.js'), 'utf8'))?.[1] ?? 24
)
// 精选一篇一定存在的长文（md 语料）与一篇 i18n 短文。
const LONG_SLUG = '7-questions-grinders-ask-about-wood-sanding'
const SHORT_SLUG = 'choose-sanding-disc-backing'

const MODULES = ['blog-sidebar', 'side-products', 'side-services', 'side-latest', 'side-product', 'side-cats']
const problems = []

const langs = fs.readdirSync(I18N).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()
let checked = 0

for (const lang of langs) {
  const indexFile = path.join(DIST, lang, 'blog', 'index.html')
  if (!fs.existsSync(indexFile)) { problems.push(`${lang}: 博客列表页缺失`); continue }
  const index = fs.readFileSync(indexFile, 'utf8')
  for (const m of MODULES) if (!index.includes(m)) problems.push(`${lang}: 列表页缺 .${m}`)
  if (!/<a[^>]+href="\/[^"]*\/products\/[a-z0-9-]+\/"/.test(index)) problems.push(`${lang}: 列表页侧栏无商品链接`)

  const longFile = path.join(DIST, lang, 'blog', LONG_SLUG, 'index.html')
  if (fs.existsSync(longFile)) {
    const h = fs.readFileSync(longFile, 'utf8')
    for (const m of [...MODULES, 'side-block side-toc']) if (!h.includes(m)) problems.push(`${lang}: 文章页缺 ${m}`)
    // 侧栏 TOC 的锚点必须真的存在于正文 id
    const tocStart = h.indexOf('class="side-toc-list"')
    const anchors = tocStart >= 0 ? h.slice(tocStart, h.indexOf('</ol>', tocStart)) : ''
    for (const m of anchors.matchAll(/href="#([^"]+)"/g)) {
      if (!h.includes(`id="${m[1]}"`)) problems.push(`${lang}: TOC 锚点 #${m[1]} 无对应 id`)
    }
    // 旧的内联 TOC（.toc）不应再出现
    if (/class="toc[ "]/.test(h)) problems.push(`${lang}: 文章页仍渲染旧内联 TOC`)
    checked++
  }

  const shortFile = path.join(DIST, lang, 'blog', SHORT_SLUG, 'index.html')
  if (fs.existsSync(shortFile)) {
    const h = fs.readFileSync(shortFile, 'utf8')
    for (const m of MODULES) if (!h.includes(m)) problems.push(`${lang}: 短文缺 .${m}`)
    if (h.includes('side-block side-toc')) problems.push(`${lang}: 短文不应有侧栏 TOC`)
  }

  // 分页页：每页卡片数按页码计算（末页不足 PAGE_SIZE 是正常的），侧栏
  // 商品/服务/最新文章模块应与第 1 页一致；分页器链接必须是干净的
  // /blog/page/n/（不出现 page/n/page/m 这种双重页码段，也不能缺尾斜杠）。
  // 只数 .blog-main 内的卡片：侧栏用 .side-product，不共用 product-card。
  const pagedFiles = [
    'page/2', 'page/3', 'page/10',
    'category/selection-guide', 'category/selection-guide/page/2', 'category/selection-guide/page/6',
    'category/buyer-resources/page/4',
    'category/application-notes', 'category/oem-guide'
  ].map((p) => path.join(DIST, lang, 'blog', p, 'index.html')).filter((p) => fs.existsSync(p))
  for (const pf of pagedFiles) {
    const rel = path.relative(DIST, pf)
    const h = fs.readFileSync(pf, 'utf8')
    for (const m of MODULES) if (!h.includes(m)) problems.push(`${rel}: 分页页缺 .${m}`)
    const main = h.slice(h.indexOf('class="blog-main"'), h.indexOf('class="blog-sidebar"'))
    const cards = (main.match(/class="product-card"/g) ?? []).length
    if (cards < 1 || cards > PAGE_SIZE) problems.push(`${rel}: 卡片数 ${cards} 超出 1–${PAGE_SIZE}`)
    for (const m of h.matchAll(/class="pager-(?:num|nav)" href="([^"]+)"/g)) {
      if (/\/page\/\d+\/page\/\d+/.test(m[1])) problems.push(`${rel}: 双重页码段 ${m[1]}`)
      if (!m[1].endsWith('/')) problems.push(`${rel}: 分页链接缺尾斜杠 ${m[1]}`)
    }
  }
  if (!pagedFiles.length) problems.push(`${lang}: 未找到任何博客分页页`)

  // 尾部斜杠 + 无 /knowledge 路由
  const localLinks = [...index.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1])
  for (const l of localLinks) {
    if (l.startsWith('//') || /^https?:/.test(l)) continue
    // 构建资源（/_astro/…）不是路由，不适用目录式尾斜杠约定。
    if (l.startsWith('/_astro/')) continue
    if (!l.endsWith('/')) problems.push(`${lang}: 侧栏/页内链接缺尾斜杠 ${l}`)
    if (l.startsWith(`/${lang}/knowledge`)) problems.push(`${lang}: 出现 /knowledge 路由（硬约束 4）`)
  }
}

// sitemap 与产物的交叉校验：gen-seo.mjs 里的分页常量是 blog-pager.js 的副本，
// 一旦漂移，sitemap 会列出不存在的 URL（或漏掉真实页面）——Google 会记录
// 404。这里断言每个语种的 sitemap /blog 条目与磁盘页面一一对应（含
// /blog/ 根、分页页、分类链与全部文章详情页）。
{
  const sm = path.join(DIST, 'sitemap.xml')
  if (!fs.existsSync(sm)) problems.push('sitemap.xml 缺失')
  else {
    const locs = [...fs.readFileSync(sm, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    for (const lang of langs) {
      const inSitemap = new Set(
        locs
          .filter((u) => new RegExp(`/${lang}/blog(/|$)`).test(u))
          .map((u) => u.replace(/^https?:\/\/[^/]+/, ''))
      )
      // 磁盘上的博客路由集合：/blog/ 根 + 所有子目录里的 index.html
      const onDisk = new Set([`/${lang}/blog/`])
      const walk = (dir, prefix) => {
        if (!fs.existsSync(dir)) return
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (!e.isDirectory()) continue
          const route = `${prefix}/${e.name}`
          if (fs.existsSync(path.join(dir, e.name, 'index.html'))) onDisk.add(`${route}/`)
          walk(path.join(dir, e.name), route)
        }
      }
      walk(path.join(DIST, lang, 'blog'), `/${lang}/blog`)
      const missing = [...inSitemap].filter((u) => !onDisk.has(u))
      const unlisted = [...onDisk].filter((u) => !inSitemap.has(u))
      if (missing.length) problems.push(`${lang}: sitemap 列了不存在的页面 ${missing.slice(0, 5).join(', ')}`)
      if (unlisted.length) problems.push(`${lang}: 磁盘页面未进 sitemap ${unlisted.slice(0, 5).join(', ')}`)
    }
  }
}

if (problems.length) {
  console.log('BLOG-SIDEBAR FAIL (' + problems.length + ')')
  for (const p of problems.slice(0, 40)) console.log('  - ' + p)
  process.exit(1)
}
console.log(`BLOG SIDEBAR OK — ${langs.length} locales (index + pager + article modules complete, links slash-terminated, TOC anchors valid)`)
