# Changelog

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，
版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.1.0] - 2026-11-07

### Added

- 博客列表页分页：每页 24 张卡片，新增 `/blog/page/<n>/` 与
  `/blog/category/<key>/page/<n>/` 路由链，`/blog/category/<key>/` 保留单分类浏览；
  分页器含「上一页/页码/下一页」、页码范围摘要（第 x–y 篇，共 n 篇）、
  `rel=prev`/`rel=next` 与 `aria-current="page"`，零客户端 JS。
- 博客侧栏（商品 + 服务 + 最新文章）：列表页与文章详情页统一为两栏布局，
  侧栏常驻 3 个商品卡、4 个服务入口（询盘/OEM/制造/应用）、分类入口与最新文章；
  文章页按正文 `/products/<handle>` 链接关联商品，并接管原内联 TOC。
- 博客索引页新增分类筛选 chips（带各分类文章计数），替代原 `<details>` 分组。
- `blogPager`、`blogSidebar` i18n 键组（27 语种；商品分类名复用已本地化的 `colt.*`）。
- 三个构建门禁并接入 `npm run build`：
  - `check-template-comments.cjs` — 阻断模板区 JS 块注释外泄
  - `check-static-paths-tdz.cjs` — 阻断 getStaticPaths 引用后置顶层 const 的 TDZ 崩溃
  - `check-blog-sidebar.cjs` — 校验侧栏四模块、分页卡片数、分页链接无双重页码段、
    sitemap 与磁盘页面一一对应

### Fixed

- 产品页渲染出原始注释文本：`/* ---------- Related articles ---------- */` 等写在
  Astro 模板区（frontmatter 之后）的 JS 块注释被当作字面文本输出到页面；改为 HTML
  注释后剔除。全站 43 个 `.astro` 已纳入门禁扫描。
- 博客列表页单页 HTML 过大（每语种 1 个页面渲染全部 223 篇文章，最大 221 KB）：
  分页后第 1 页降至 54 KB，150 KB 以上页面从 26 个降至 0 个。
- 分页 canonical 原先一律指向 `/blog/`，会使 `page/2` 之后被判重复内容而不收录；
  改为自指当前页，title 追加分类名与「— Page N of M」后缀。
- 分页器「下一页」曾生成 `/blog/page/2/page/3` 双重页码段：`base` 现剥离 `/page/<n>` 段。
- 博客分类分页路由构建期 `CATS is not defined`（export function 被 bundler 提升、const
  不提升导致 TDZ）：分类集合提取为共享导出 `BLOG_CATEGORIES`。
- 侧栏商品在文章只关联 1 个 SKU 时仅渲染 1 张卡：按同分类补足到 3 个。

### Changed

- `scripts/gen-seo.mjs`：sitemap 纳入博客分页与分类链 URL（8020 URLs），
  分页常量与 `src/lib/blog-pager.js` 保持一致。

## [1.0.0]

初始版本：27 语种静态展示站、产品/型号/变体/百叶片目录、博客长文语料、
Merchant Center b2b feed、GA4 出站打点、JSON-LD 结构化数据。
