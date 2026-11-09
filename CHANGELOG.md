# Changelog

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，
版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.2.1] - 2026-11-09

### Changed

- 全站「Request a Wholesale Quote」入口由站内中转改为**一次点击直达**原站询价页
  `https://www.motaiabrasive.com/collections/all?view=request-a-quote`：站点导航
  （桌面 + 移动两处）、页脚产品列、吸底 QuickContactBar、首页 Hero 主 CTA、
  contact / oem / factory 页按钮，以及百叶片页按钮（顺带补上该页此前漏传的
  `disc_key` 上下文参数）。原先这些入口都先跳到站内 `/quote/` 说明页、再由页内
  按钮二次跳转，评估期买家多付一次点击。
  Why: 询价转化路径每多一跳都会流失意向客户；产品/型号/砂纸片页与 CtaBand 早已直连外链，
  入口行为此前不一致，统一后全站一致。

### Removed

- 站内 `/quote/` 不再有全站入口指向（原 9 处入口全部改直连外链）；该页仍保留为
  原站 `?view=request-a-quote` 的 301 落地页与独立 SEO 页面，`_redirects` 与 sitemap
  不变。

## [1.2.0] - 2026-11-07

### Added

- 首页底部新增「最新文章」模块（27 语种）：定位区与工厂地图之后、最终 CTA
  之前，展示与 `/blog/` 第 1 页同源同序的 3 篇文章卡片（build-time 本地化
  更新日期）与「浏览全部指南」入口，给读到页面底部的评估期买家一条通往
  深度内容的出口。新增 `home.articlesEyebrow/Title/Sub/Cta` i18n 键组。
- 新增共用组件 `ArticleCard.astro`（单张文章卡片）：首页模块与博客列表页
  的卡片结构合一，分类角标与本地化日期在组件内解析（复用
  `BLOG_CATEGORIES`），不再在每个页面重复 `CAT_KEYS` 映射与 Intl 调用。
  `check-blog-sidebar.cjs` 同步扩展：校验首页模块标题、卡片数与两处顺序
  一致（防止未来改布局挤掉模块或数据源漂移）。

### Removed

- 工厂页（`/factory/`）移除资质认证模块：目前无已发布的认证证书，原
  `certNote` 占位说明 + 2 个 `logo-slot` 占位卡（ISO 9001 / Export packing
  & QC programme）整体下线；QC 三卡为真实流程描述，保留。`factory.certNote`
  自 27 语种 `src/i18n/` 与 `.zcode-check/locales-v2/`（扁平点号键）同步删除。

### Changed

- `scripts/gen-seo.mjs`：sitemap 纳入博客分页与分类链 URL（8020 URLs），
  分页常量与 `src/lib/blog-pager.js` 保持一致。

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

## [1.0.0]

初始版本：27 语种静态展示站、产品/型号/变体/百叶片目录、博客长文语料、
Merchant Center b2b feed、GA4 出站打点、JSON-LD 结构化数据。
