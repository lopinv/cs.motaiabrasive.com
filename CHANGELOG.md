# Changelog

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，
版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [1.5.0] - 2026-11-17

### Added

- 视频库重抓 YouTube 通道（8 长视频 + 25 Shorts = 33 条），新增 7 条
  Shorts（手工接带、分条定制、三参定制砂带、白色漆面细磨盘、百叶片自动产线、
  海绵块、定制砂带流程）；4 条历史视频回归数据源
- `build-videos.cjs` 支持 `videos-hidden.json` 的 hidden 标记（8 条重复剪辑不进
  sitemap/站内链接，直链保留），修复全量重建误删 4 条在线视频 + 丢失 hidden 的回归
- 7 条新视频 × 41 非 en 语种 i18n 文案（videos.clip 42 键/语种，术语照术语表 +
  既有 26 条 clip 口径，en 品牌后缀 MoTai 各语种统一）
- 视频详情页 VideoObject JSON-LD 随新页上线；sitemap URL 9535 → 9829
  （+42 语种 × 7 新视频）

## [1.4.4] - 2026-11-16

### Changed

- 产品线命名去品牌前缀（en）：`colt.flap.title` → "Flap Discs"、
  `colt.sponge.title` → "Sanding Sponges"、`home.catFlapTitle` → "Explore Flap Discs"
  （非 en 各语种保留本地化标题形态）
- Flap Discs 分类代表图换为 `motai-flap-plastic-reddish-brown-display.png`
  （同源驱动首页分类卡片 + `/collections/flap-discs/` 首屏 hero + og:image），
  并移除 home.json flap 条目已无消费方的 `gallery` 数组
- 页脚「Let's Connect」电话号码行图标由电话听筒改为 WhatsApp 实心图标
  （该行跳转目标本就是 wa.me 链接，图标与目标对齐）

### Security

- 升级 astro `7.3.3` → `7.4.12`（patch version 精确锁定，无浮动范围），
  `npm audit` 从 1 moderate 变为 0 vulnerabilities。
  - 修复 GHSA-mh32-jxcr-mh9f（动态标签名 `<Tag/>` 解析为字符串时，标签名
    过滤不处理 `/`，可经 `img/src/onerror=…` 注入属性 → 反射/存储 XSS）。
    本项目三个触发条件均不成立（无动态标签名、无 `.mdx`、`Astro.params`
    只取静态白名单内的 lang/slug），属预防性升级而非应急修补。
  - GitHub 提示的另一条 low 未在本仓复现：GHSA-r3h5-4585-7x3w 属于
    `@astrojs/node`，本项目未安装该 adapter（`output: 'static'`）。
  - Changelog 审查结论：7.3.4→7.4.12 中仅 7.4.0 为 minor（"Changes for
    integration authors"，仅影响集成开发者），其余全为 patch，破坏面极小。
  - 回归验证：build 9914 页（与升级前一致）/ 9535 URL（一致）/ 5 道门禁全绿；
    本轮三项 UI 改动在升级后产物中逐项复验无变化（Hero 2 图、cat-card 4 张 +
    4 个上图、footer 4 图标 + 4 行、文章特色图 psa-5 计数 0）。

## [1.4.3] - 2026-11-16

### Fixed

- 新增构建门禁 `.zcode-check/check-article-frontmatter.cjs`，拦住 frontmatter
  不在文件最前的文章 .md（历史翻译会话遗留的分段稿说明注释写在 `---` 之前，
  会让 Astro glob loader 把整篇当正文、schema 报 "slug: Required"，一个坏
  文件中断 9000+ 页构建，且报错指向最后撞到的那个文件、看不出根因）。门禁
  排在 build 链最前， astro build 之前执行：直接点名文件 + 给出修复方式。
  Why: 1.4.1 / 1.4.2 两轮 build 各撞一次同类问题（共 6 个 de 译稿），修文件
  只是治症状；正规合路 `i18n/merge.mjs` 自身有 frontmatter 保护，坏文件均由
  绕过 merge 的会话直接落盘，必须有一道前置门禁兜底。

## [1.4.2] - 2026-11-16

### Changed

- 页脚「Let's Connect」区块加图标强化视觉：邮箱（信封）、WhatsApp/电话
  （听筒）、Contact Us（定位销）、公司地址（建筑）四条改为「图标 + 文字」行，
  图标统一 24×24 / stroke 1.7 线框风格，与 hero-trust、hero-arrow 同一套
  stroke 体系。图标颜色走 `--muted` 不抢文字对比度，行 hover 时图标随文字
  一起转 accent；公司地址为静态行（`<p>` 而非 `<a>`），不可点无指针。
  Why: 原为 4 个裸文本链接，页脚四列里视觉权重最低、扫读成本最高；图标让
  「联系方式」在一屏内可被识别为联系方式。

### Fixed (构建)

- 修正 3 个 de 译稿的前置注释位置（`how-to-pick-wide-abrasive-belts-*`）：
  其开头的 `<!-- PART 0x/5 of … -->` 分段稿说明写在 frontmatter 之前，导致
  Astro glob loader 解析不到 `slug`/`category`/`title` 而中断构建。已把注释
  移到 frontmatter 之后，内容零改动。Why: 历史翻译会话遗留（同 1.4.1 的
  同类问题，本次 build 时 `gen-article-locales.mjs` 重新落盘才暴露）。

## [1.4.1] - 2026-11-16

### Fixed

- 首页 Hero 轮播移除第二张图（砂带裁线实拍），保留工厂外景 + 生产车间两张
  实拍；轮播控件、计数与 dots 均由 `slides` 数组驱动，随数据同步收缩。
  Why: 三张轮播图首屏停留时长短，工厂外景与车间两张已能表达产能与规模。
- 首页产品分类区块改为「上图下文」卡片网格，视觉与「Pick the application」
  场景轮播（scene-card）对齐：边框 / 圆角 / hover 抬升 / 图片轻推近同一套
  动效语言，双 CTA 钉在卡片底部保证不同长度说明的按钮对齐。
  Why: 原为「左文案 + 右大图」的横排分区卡片，与首页其它卡片网格视觉割裂。
- 文章特色图不再使用 5 英寸 PSA 砂盘图：22 个 slug（94 个语种文件，覆盖
  en/de/he/fr/fa/es/it/ja/ko/da）按文章主题分配到砂带、网纹、砂纸类图片。
  Why: 一张 5 英寸 PSA 盘图被 22 篇主题横跨木材/汽车/砂纸/砂带的文章共用，
  「一张图配全部文章」；目标图均已 HEAD 验证为真实资源且内容互异，同一 slug
  在所有语种保持一致。

### Fixed (构建)

- 修正 3 个 de 译稿被误放在 `articles/de/` 根目录的 `.parts` 分段稿：其开头的
  `<!-- PART 00/5 of … -->` 注释写在 frontmatter 之前，使 Astro glob loader
  解析不到 `slug`/`category`/`title` 而中断构建。已将注释移至 frontmatter 之后，
  内容零改动。Why: 历史会话遗留，非本次三项 UI 调整引入，但阻塞构建验证。

## [1.4.0] - 2026-11-14

### Added

- 首页「大型企业级工业 B2B」升级：HeroCarousel（3 张工厂实拍全屏轮播 +
  深色遮罩 + 信任点 + 标签带 + 播放控制）、SceneCarousel（6 张工艺实拍
  横向轮播，含键盘翻页与页码计数）、ProductCategorySection（砂带 / 百叶片 /
  海绵 / 砂盘四个分区，真实产品图 + 双 CTA）。
  Why: 首页此前为浅灰底 + 右置小图，缺少原站的全屏工厂轮播与产品分类区块，
  观感不达工业 B2B 大型企业级标准。
- 通用组件：`AccordionFaq.astro`（FAQ 手风琴，默认只展首条，答案文本始终
  在 DOM 使 FAQPage JSON-LD 与可见文本一致）、`Breadcrumb.astro`（25 处
  内联面包屑统一，Home 改走 `nav.home` 本地化）、`BackToTop.astro`（返回顶部，
  定位避开 quickbar 与悬浮聊天钮）、`Reveal.astro`（IntersectionObserver
  滚动进场，跳过首屏/LCP 元素）、`Lightbox.astro`（产品图集灯箱 + 缩略切换，
  5 类详情页 + 产品卡片接入）。
  Why: FAQ 此前 12+ 处手写且全展开，产品页 8-9 条 FAQ 顶掉首屏；面包屑
  25 处硬编码英文 `Home` 在 42 语种下不可读。
- 长文阅读体验：`ProgressiveRead.astro`（阅读进度条 + 侧栏 TOC 当前章节
  高亮，仅长文页挂载）。
- 键盘可达性：全局 `:focus-visible` 焦点环（此前全站仅 `.wa-input` 一处）、
  `skip-link` 跳转到主内容（Shell 挂载）。
- 设计令牌体系：`:root` 重建为色阶（ink-900..100 / brand-500..800）、间距
  （`--sp-1..24`）、圆角（`--r-xs..pill`）、阴影（`--sh-1..5`）、层级
  （`--z-*`）、动效（`--ease-*` / `--dur-*`）六套标尺，22 个旧变量名保留为
  别名（既有规则渲染不变），替换 35 处散落硬编码。
  Why: 新组件此前引用 `--ink-900` / `--ease-*` 等未定义变量靠 fallback 兜底，
  阴影/圆角/z-index 硬编码散落，视觉规格无法全局调。

### Fixed

- 应用场景轮播翻页按钮失效：脚本查询根用 `[data-scene-track]` 而箭头按钮
  渲染在父级 section 头内，`querySelector` 返回 null 导致点击监听从未绑定；
  计数显示 `'1–' + scenes`（数组 toString 输出一长串 slug）改为按滚动位置
  计算真实页码；`scroll-snap: mandatory` 改 `proximity`（箭头翻页不被 snap 弹回）；
  卡片 `minmax(260px,1fr)` 改固定 300px（1fr 撑满容器导致一屏放完无页可翻）。
- Hero 标签带未左对齐：`.hero-controls-inner` 残留 `.wrap` class，其 24px
  padding 使标签带左缘比标题多出一截；hero 横向 padding 统一为
  `var(--gutter-hero)`，文案与控制条共用左缘。
- 询盘链路丢失产品上下文：`ProductCard` 的询价按钮写 `quoteUrl({})`（裸表单），
  改为 `quoteParams` prop，collections / Home 共 19 张卡全部带 `?product=<handle>`。
- RTL（ar/he/fa）错位：`.video-badge` / `.video-len` 与 Lightbox 组件内共 6 处
  `left`/`right` 硬编码改 `inset-inline-*` 逻辑属性；SceneCarousel 翻页改方向
  感知（RTL 下视觉下一页在物理左侧）。
- `.byline` / `.faq-title` 两个 class 被 9 个页面渲染却无任何 CSS 规则，补为
  小号弱化行样式；统计数字补 `tabular-nums`。
- 构建阻断缺陷：`blog/category/[key].astro` 局部 `const BLOG_CATEGORIES`
  遮蔽同名 import（const 重声明 = SyntaxError）；多页 `AccordionFaq` /
  `Breadcrumb` import 相对层级错误（Module not found）。
- 翻译管线落盘的 `articles/fr/*.md` frontmatter 前被写入 `<!-- PART 00/5 -->`
  注释导致 zod schema 校验失败（累计修复 3 批共 20 篇）。

### Changed

- 全站 12 处手写 FAQ 块替换为 `AccordionFaq`，5 个产品详情页首屏不再被
  8-9 条 FAQ 顶掉；25 处内联面包屑替换为 `Breadcrumb` 组件。
- `value-card` / `model-card` / `region-card` 补 hover 反馈（此前三个完全
  无交互反馈）；Hero 轮播与应用轮播箭头 `aria-label` 改走 `blogPager.prev/next`
  本地化键，FloatingChat 改走 `floatChat.title`。
- section 垂直节奏令牌化（72px / 48px / 36px 统一标尺），标题 margin 归一。
- Hero 文案由顶部贴边改为靠左贴底布局（顶部留白展示工厂全景，控制条改为
  文档流 flex 子项使间距可预测）。
- 新增构建辅助脚本 `.zcode-check/{tokenize-css,refactor-faq,refactor-breadcrumb,
  fix-component-imports}.cjs`（一次性重构与 import 自检）。

## [1.3.0] - 2026-11-09

### Added

- 新增 15 个语种子站：`lt`（立陶宛）/ `lv`（拉脱维亚）/ `et`（爱沙尼亚）/
  `sl`（斯洛文尼亚）/ `hr`（克罗地亚）/ `sr`（塞尔维亚，西里尔）/ `ca`（加泰罗尼亚）/
  `nl`（荷兰）/ `uk`（乌克兰，西里尔）/ `el`（希腊）/ `hu`（匈牙利）/ `ro`（罗马尼亚）/
  `bg`（保加利亚，西里尔）/ `tl`（菲律宾）/ `bn`（孟加拉）。站点从 27 → 42 语种，
  全站 i18n / 语言切换器 / hreflang（45 条）/ sitemap / Merchant feed / 博客侧栏
  门禁均自动扩到 42。
  Why: 覆盖北欧、东欧、西/南欧与南亚的工业采购市场，扩大 B2B 询盘触达面。
- 15 语种 i18n 载荷（`.zcode-check/locales-v2/*.json`，各 670 键）与
  `src/i18n/*.json`（生成器 `gen-new-locales.cjs` 深克隆 en + 应用载荷）；机翻口径，
  待母语审校（沿用 11 老语种既有惯例）。占位符 / 数组结构 / 专有名词保留均通过
  `key-parity` + `verify-i18n` 双门禁。
- 制造页「工厂画廊」模块（3 张带图 value-card）的 `factory.gallery*` 9 个 i18n 键
  补齐到全部 42 语种（en 基线 + 26 老语种 + 15 新语种），使全站键树一致、
  `key-parity` 门禁通过。

### Changed

- `gen-new-locales.cjs` 的 CODES 锁定为仅 15 个新语种：原 16 个既有语种的载荷是
  部分载荷（缺后补的 `home.articles*`/`blogSidebar*`/`blogPager*` 等 34 键），重跑会
  用英文值覆盖其译文造成回退，故生成器只对新 15 个完整载荷生效。
- `verify-locales-live.cjs` LANGS 27→42、alternate-link 断言 30→45（42 + es-MX/pt-BR +
  x-default）；`verify-i18n.cjs` 变音符号抽查集纳入 13 个新非 ASCII 语种。
- `version` bump 1.2.1 → 1.3.0（feat 新增语种，MINOR，SemVer）。



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
