# MoTai Abrasives 静态展示站 — Cloudflare Pages 部署说明

## 项目结构

```
motai-static/
├─ src/
│  ├─ data/*.json      语种中性数据（产品/型号/变体/百叶片/博客/指南/行业/区域/FAQ/术语表/信任槽/视频/站点配置）
│  ├─ i18n/*.json      27 语种翻译（en/zh/zh-Hant/ja/ko/es/fr/de/it/pt/ru/ar/he/fa/hi/th/vi/
│  │                   id/ms/cs/sk/pl/da/sv/no/fi/tr）
│  ├─ lib/             i18n、数据、TDK、WhatsApp 链接、路径工具、博客分页参数（blog-pager.js）、
│  │                   博客↔商品关联（blog-products.js）
│  ├─ components/      Shell/Header/Footer/FloatingContact/ProductCard/CtaBand/Faq/SectionHeading/
│  │                   YouTubeEmbed/SeoMeta/BlogSidebar/BlogIndex/BlogPager/ArticleCard/BlogHomeArticles
│  ├─ pages/           [lang] 动态参数路由（多语种）+ index.astro（SITE_LANG 根页）+ 404
│  │                   └─ blog/  索引 + page/[n]（分页）+ category/[key] + category/[key]/page/[n]
│  └─ styles/global.css
├─ public/_redirects    旧 Shopify URL 301 兼容（纯静态重定向）
├─ scripts/gen-feed.mjs 构建后生成 dist/products.csv（Merchant Center b2b feed）
├─ scripts/gen-seo.mjs  构建后生成 dist/robots.txt + dist/sitemap.xml（随 SITE_URL）
├─ .zcode-check/        构建门禁（见下方「构建校验」）
├─ astro.config.mjs     output: 'static'
└─ dist/                构建产物（发布此目录）
```

## 博客列表页

博客索引按每页 24 张卡片分页，第 n 页位于 `/blog/page/<n>/`，单分类链位于
`/blog/category/<key>/` 与 `/blog/category/<key>/page/<n>/`；分页大小与分类集合的
单一来源是 `src/lib/blog-pager.js`（`scripts/gen-seo.mjs` 中的分页常量须与之一致，
`check-blog-sidebar.cjs` 会交叉校验 sitemap 与实际页面）。列表页与文章详情页共用
两栏布局：右栏 `BlogSidebar` 常驻商品/服务/最新文章。

## 首页最新文章模块

首页底部（定位区之后、最终 CTA 之前）渲染「最新文章」模块：3 张与
`/blog/` 第 1 页同源同序的文章卡片（`allArticles(lang)` 的 dateModified
倒序前 3 篇）+「浏览全部指南」入口，卡片用共用的 `ArticleCard.astro`。
文案键组 `home.articlesEyebrow/Title/Sub/Cta`（27 语种）。
`check-blog-sidebar.cjs` 逐语种校验模块标题、卡片 3 张、且顺序与
`/blog/` 第 1 页一致。

## 构建校验

`npm run build` 串行执行以下门禁，任一失败即中止构建：

| 脚本 | 作用 |
|------|------|
| `check-template-comments.cjs` | 阻断 Astro 模板区 JS 块注释被当作文本渲染（曾导致产品页露出注释原文） |
| `check-static-paths-tdz.cjs` | 阻断 `getStaticPaths` 引用定义在其后的顶层 const（bundler 提升导致的 TDZ 崩溃） |
| `key-parity.cjs` | 27 语种 i18n 键与 en.json 一致 |
| `audit-terms.cjs` | 术语审计（机翻造词检测） |
| `check-slash.cjs` | canonical/hreflang/JSON-LD、sitemap、_redirects 全站尾斜杠约定 |
| `check-blog-sidebar.cjs` | 侧栏四模块完整、分页卡片数与链接形态、sitemap 与磁盘页面一一对应、首页文章模块与 /blog/ 第 1 页顺序一致 |

## 构建

```bash
# 默认（SITE_LANG 缺省为 en）
npm run build

# 指定默认落地语种（根路径 / 渲染该语种首页）
SITE_LANG=zh npm run build        # Linux/macOS
set SITE_LANG=zh && npm run build # Windows cmd
```

说明：
- 一次构建输出全部 11 个语种的静态路由（`/en/...`、`/zh/...`、`/ar/...` 等），共 640 页（含 /terms 条款页）。
- `SITE_LANG` 只影响**根路径 `/` 的默认落地语种**，不影响其余语种路由（它们始终全部生成）。
- `astro build` 成功后自动运行两个纯 Node 脚本（零依赖）：
  `scripts/gen-feed.mjs`（生成 `dist/products.csv`，Merchant Center b2b feed）与
  `scripts/gen-seo.mjs`（生成 `dist/robots.txt` + `dist/sitemap.xml`，域名读 `SITE_URL`，
  缺省 `https://motai-abrasives.pages.dev`）。
- 产物是纯静态 HTML/CSS/JS + CSV/robots/sitemap，**零 Worker、零 Pages Function、零服务端逻辑**。
- `public/googlebf0b5eb5f29ae09d.html`：Google Search Console 域名验证文件，随 `dist/` 发布；
  在 GSC 用「文件验证」指向 `<SITE_URL>/googlebf0b5eb5f29ae09d.html` 完成验证。

## 部署到 Cloudflare Pages

1. 创建 Cloudflare Pages 项目，仓库指向本目录。
2. 构建命令：`npm run build`
3. 输出目录：`dist`
4. （可选）项目环境变量：
   - `SITE_LANG` = 根路径默认语种（`en`/`zh`/`es`/`de`/`fr`/`ar`/`pt`/`ru`/`it`/`ja`/`ko`，默认 en）
   - `SITE_URL` = 你的 Pages 域名（用于 canonical/hreflang/OGP 绝对 URL，默认 `https://motai-abrasives.pages.dev`）
5. `public/_redirects` 会随 `dist/` 一起发布，旧 Shopify URL 自动 301 到 `/en/...`。

> 若希望 `/` 落地中文，只需把 Pages 项目环境变量 `SITE_LANG` 设为 `zh` 重新部署。

## 跳转与沟通行为（设计约定）

- **报价/表单按钮**：全部直接跳转到原站 `https://www.motaiabrasive.com/collections/all?view=request-a-quote`，
  并按上下文附带预填参数：`&product=<handle>`（产品页）、`&model=<MODEL>`（型号页）、
  `&disc_key=<key>`（砂纸片/百叶片变体页）、`&request_type=sample`（样品申请）。**所有入口一次点击直达，
  不经站内 `/quote/` 中转**（导航、页脚、吸底 QuickContactBar、首页 Hero、contact/oem/factory 页按钮均同）；
  站内 `/quote/` 仍作为原站 `?view=request-a-quote` 的 301 落地页存在。**本地无任何表单提交后端。**
- **沟通按钮**：`https://wa.me/8618118635597?text=<encodeURIComponent(预填文案)>`，文案随站点语种翻译、
  随页面上下文生成（产品页带产品名+粒度，型号页带型号等）。
- 全站右下角有 WhatsApp 圆形悬浮钮（点击向上展开聊天窗）。

## URL 斜杠约定（trailing slash）

- `astro.config.mjs` 用 `trailingSlash: 'always'`：物理产物为目录 + `index.html`
  （如 `dist/en/about/index.html`），Cloudflare Pages 只在 `/en/about/` 提供页面，
  请求 `/en/about` 由 Pages 内置 308 到带斜杠形式。
- 因此全站规范 URL 一律**带尾斜杠**：canonical、hreflang、站内 `href`
  （`localizedUrl` 单一出口，`src/lib/utils.js`）、JSON-LD（Offer/BreadcrumbList/ItemList，
  `absUrl` 归一出口，`src/lib/tdk.js`）、`_redirects` 301 目标、`sitemap.xml`、`products.csv` 的 link
  全部同形，避免「canonical 无斜杠 vs 实际服务带斜杠」的重复内容冲突。
- 唯一例外是站点根 `/`（物理 `index.html`，渲染 `SITE_LANG` 默认语种首页），
  其 canonical 指向 `/en/`，不做重定向。
- 回归校验：`node .zcode-check\check-slash.cjs`（构建后跑，扫描 canonical/JSON-LD/sitemap/feed/
  _redirects 中所有指向本站的 locale URL，任一缺尾斜杠即失败退出码 1）。

## 多语言机制

- 11 语种一次构建全部输出；顶栏语种切换器为静态链接跳转同路径其余语种。
- 阿拉伯语 `ar` 自动 `<html dir="rtl">` 镜像布局。
- 扩展语种：新增 `src/i18n/xx.json`（拷贝任一语种改翻译）即可，`import.meta.glob` 自动发现，
  会同步进入语种切换器与所有 `getStaticPaths`，无需改页面代码。

## 图片

- 产品/型号/百叶片图片**直接引用原站 CDN 远程地址**（`cdn.shopify.com` / `motaiabrasive.com/cdn/...`），不下载到本地。
- `<img loading="lazy">` + `onerror` 降级为渐变色块占位，原站 CDN 不可用时不空白。
- 如需本地化图片：把 webp 放 `public/assets/` 并改 `src/lib/utils.js` 的 `media()` 返回路径即可。

## YouTube 知识库视频（可选配置）

- `src/data/videos.json` 驱动。默认 `youtubeId` 为空 → 视频区块自动隐藏。
- 填入真实 `youtubeId` 后，/factory、相关博客、集合页自动显示「点击加载」式嵌入
  （`youtube-nocookie.com`，不自动播放、不默认加载 iframe，输出 `VideoObject` JSON-LD）。
- 增删视频只改 `videos.json` + 各语种 i18n 的 `video.<id>` 文案，不动页面代码。

## 信任占位槽

- `src/data/trust.json`：客户 logo/评价/认证为 `status:"placeholder"` 占位，页面以「示意占位」徽章明确标注。
- 替换真实素材：把 `status` 改为 `published` 并填入 logo URL/文案即可，无需改代码。

## TDK / OGP / JSON-LD / AEO

- 每个页面统一输出：`<title>`（三层优先级：页面级 > 类别级 > 站点默认）、`description`、`keywords`、
  `canonical`（指向对应语种路径，x-default 指向英语版）、11 个 hreflang、OGP、Twitter Card。
- JSON-LD 按页类型：`Organization`（全站，带 `@id` 供其他节点引用）、`WebSite`（根首页）、`Product`（产品/型号/变体/百叶片，
  additionalProperty 规格 + B2B `offers`：`PreSale`/`New`/seller，**始终无 price 字段**，见「Google 购物」节）、
  `AboutPage`（about 页，mainEntity 指向 Organization `@id`）、`ContactPage` + `ContactPoint`（contact 页，
  邮箱/电话/WhatsApp，areaServed: Worldwide）、`WebPage`（terms 页，about 指向 Organization）、
  `BreadcrumbList`（全部）、`FAQPage`（FAQ 区）、`Article`（博客，author/publisher 引用 Organization `@id`，
  带 `datePublished`/`dateModified`/`mainEntityOfPage`）、`ItemList`（术语表 + 4 个集合页商品列表）、
  `VideoObject`（视频区块）。
- **E-E-A-T 信号**：博客页 byline（「Reviewed by the MoTai Abrasives technical team」+ 本地化「Last reviewed」日期，
  构建期 `Intl.DateTimeFormat(lang)` 生成）、术语表「最近审阅」注记行、/terms 使用条款页（11 语种，报价 consent 引用
  Privacy + Terms）；作者署名一律公司口径（不点名个人，避免虚构专家身份）。
- OGP 全页输出 `og:url`（含根首页），`twitter:image` 无产品图时回退 logo。
- AEO/GEO：全部事实内容、规格表、FAQ 问答均落在纯静态 HTML 中（无 JS 渲染依赖），
  语义化 H1/H2/H3 + `<table><th scope>`，答案引擎可直接引用。

## 产品同步（与原站 motaiabrasive.com）

原站 `collections/all` 的产品数据源是 Shopify 的商品 API（`/products.json`），本静态站把 11 个产品
（handle、尺寸、粒度）固化在 `src/data/products.json`。原站新增/删除/改规格后，按下面流程同步：

```bash
# 1. 拉取原站最新商品快照
node .zcode-check\sync-products.mjs fetch
# 2. 比对：handle 集合、各产品 Sizes/Grits、dist 页面覆盖
node .zcode-check\sync-products.mjs diff
# 3. 百叶片单独比对（原站把百叶片内嵌在 /collections/flap-discs 的
#    data-flap-catalog JSON 里，不是独立 Shopify 商品）
node .zcode-check\sync-flap.mjs
```

`diff` / flap 输出 `SYNC OK` 即两边一致；输出 `OUT-OF-SYNC` 时按提示手工更新
`src/data/products.json`（新增产品：补 `handle/name/category/image/gallery/sizes/grits/material/backing/summary/applications` 字段，
图片仍用远程 CDN key；删除产品：移除条目）或 `src/data/flap.json`（增删 key/name/backing/color），
然后 `npm run build` 重新生成 11×N 个产品页 / 百叶片页。

约定：
- 两个脚本都不下载图片、不改动站点代码，只读比对；退出码非 0 可作 CI/部署门禁。
- 静态站产品页文案（summary/描述）是本地原创（不与原站逐字同文），同步时只对齐
  **结构化数据**（handle、尺寸、粒度、图片 key、百叶片 key/name/backing/color），不要回填原站描述正文。

## Google 购物 / Merchant Center（B2B 询价模式）

站点不做公开价销售，Google 侧按 **b2b 询价（request a quote）** 口径展现，不输出任何实价：

- **页面 JSON-LD**：产品/型号/砂纸片/百叶片页的 `Product` 带 `offers`（`availability: PreSale`、
  `itemCondition: New`、落地页 url、品牌 seller，**无 price 字段** → Google 不会显示 $0.00）；
  4 个集合页补了商品型 `ItemList`（每页实际展示的商品 + 本地化链接）。
- **Merchant feed**：`npm run build` 末尾自动生成 `dist/products.csv`
  （`scripts/gen-feed.mjs`，30 条商品 = 11 产品 + 11 型号 + 5 砂纸片 + 3 百叶片，
  UTF-8 带 BOM，`availability=preorder`，随 Pages 发布为静态文件）。
  Merchant Center 数据源填 `<SITE_URL>/products.csv`。
- **robots / sitemap**：`scripts/gen-seo.mjs` 同钩子生成 `dist/robots.txt`（指向 sitemap）
  与全量 `dist/sitemap.xml`（639 URL = 根 `/` + 11 语种 × 58，含 /terms，域名跟随 `SITE_URL`）。
  sitemap 为**纯标准 sitemaps.org urlset**（只含 `<loc>`）——GSC 现行解析器拒收 Google 图片
  sitemap 扩展命名空间（报 `Failed to parse QName 'image:'`，图片 sitemap 扩展已被 Google
  弃用）；商品图收录改走两条现行通道：Merchant feed 的 `image_link` 列 + 页面 `og:image`。

上线步骤（不在代码内）：
1. Google Merchant Center 建账户 → 数据源 → 选「静态文件 / CSV」，URL 填 `<SITE_URL>/products.csv`。
2. **给账户打 `b2b` 标签**（Settings → 商店详情 → 标签）：b2b 账户才接受无价格/预售商品，
   否则会被判 missing price 而拒；打标签后 Google 搜索会以「询价」状态展现，不展示价格。
3. Google Search Console + Bing Webmaster 验证域名并提交 `sitemap.xml`。
4. 原站商品变更跑完 sync 脚本并 `npm run build` 后，feed/sitemap 自动重建，无需单独操作。

## 上线后建议

- 把 `SITE_URL` 设为真实域名后重新构建（影响 canonical/hreflang/OGP 绝对 URL，
  以及 sitemap/robots/feed 里的绝对地址——`gen-seo.mjs`/`gen-feed.mjs` 都读 `SITE_URL`）。
- **Google Search Console**：验证 `<SITE_URL>` 域名（DNS 或 HTML 标签）→ 依次提交：
  1. 站点地图：Sitemaps → 添加 `<SITE_URL>/sitemap.xml`（构建期已生成，
     纯标准 urlset 共 639 URL，无 `image:` 扩展命名空间——GSC 拒收图片
     sitemap 扩展，图片收录走 Merchant feed `image_link` + 页面 `og:image`）；
  2. 网址检查（URL Inspection）抽查 1-2 个产品页，确认 canonical 与 11 条 hreflang 被接受；
  3. 之后每次部署含新增页面时，GSC 会按 robots 里的 `Sitemap:` 声明自动抓取更新，无需重新提交。
- **Bing Webmaster Tools**：添加站点后同样提交 `<SITE_URL>/sitemap.xml`
  （纯标准 urlset，Bing 直接接受；图片收录同样走 feed `image_link` + 页面 `og:image`）。
- 非 en/zh 的 9 种语种翻译建议母语审校后再对外上线。

## 校验门禁（构建后回归）

- `powershell -File .zcode-check\check.ps1`：JSON-LD 类型/PreSale offer/ItemList、
  语种页、feed（BOM/行数）、sitemap（URL 数 + image 条目 + 命名空间）、robots、_redirects 全量断言。
- `node .zcode-check\check-slash.cjs`：URL 斜杠约定专项（canonical/hreflang/JSON-LD/sitemap/feed/
  _redirects 中指向本站的 locale URL 必须带尾斜杠，退出码 1 即失败）。
