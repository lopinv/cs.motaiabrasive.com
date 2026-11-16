# 多子代理 · 41 语种文章翻译 — 标准任务单（TASK BRIEF）

> 本文件是派写盘型子代理的**单一事实源**。每个子代理只派「一个 locale × 一个 slug」，
> 把它当成整篇交付。主线程负责收验 + 记账，子代理只写、不记账。
> 数据源现状（2026-11-12 核查）：**41/41 术语表齐备**（`glossary/<locale>.md`，各 45 官方词条），
> 133 篇 EN 源分片齐全（`parts/<slug>/00.md…04.md`）。

## 0. 命名与派单

- 任务单以 `<locale> × <slug>` 唯一标识一个任务。
- 子代理 agent 名 = `<locale> 翻译 <slug>`，一代理一篇，便于逐个收验。
- 一次并行 ≤30；每语种铺满（133 篇）才换下一语种（按存量多→少：he→fa→fr→ar/de/es/it/ja/ko…）。
- **必须用后台模式（`run_in_background: true`）派单**。阻塞模式下 30 个同刻排队 → 模型流 600s 无活动看门狗全部杀掉，30 篇 0 产出（2026-11-12 实测）；
  后台模式各自独立跑（单篇约 1–5h），完成逐个回通知，主线程收通知即核盘记账。这是 30+ 在飞的唯一可行姿势。

## 1. 写边界（强制，违反即判失败）

1. 只准创建**一个**文件：`articles/<locale>/<slug>.md`。
2. 禁止创建/修改/删除任何其它文件；禁 `rm`/`mv`。
3. 禁止落盘 `*.err`、`vek*.json`、`*.txt`、`.parts/` 中间稿、任何临时脚本（含 `node -e` 起的 cjs）。
4. 需要跑验证一律用 `node scripts/pipeline/i18n/validate.mjs <locale> <slug>`，不落盘。

## 2. 输入（按序读完再动笔）

1. EN 源分片 `scripts/pipeline/i18n/parts/<slug>/00.md…04.md`（5 段，frontmatter 在 00）。
2. 该语种术语表 `scripts/pipeline/i18n/glossary/<locale>.md`（**官方词形锚，防造词门禁**）。
3. 同语种已 PASS 样板（节奏参考）：`articles/<locale>/` 下任一 PASS 文件（he 用 `7-questions-grinders-ask-about-rust-removal.md`）。

## 3. frontmatter 规则

- `slug` / `datePublished` / `dateModified` / `image` **逐字保留**（取 EN 源 00 段）。
- `category` 逐字保留（selection-guide / buyer-resources 等，以源为准）。
- `title`：≤80 字符；必须含**主关键词**（keywords 第 1 项）；不得含年份。
- `keywords`：3–5 项；第 1 项 = 主关键词；**该词形必须在正文实际出现 5–24 次**
  （屈折语系 / RTL 语系务必用正文实际词形，否则词边界计数落空 → 见 §7 已知坑）。
- `metaDescription`：非 CJK 120–170 字符 / CJK·泰 80–170；且须含主关键词。
- `intro`：非 CJK 40–160 字符 / CJK·泰 30–160。

## 4. 正文规则

- 总长 5000–6000 units。CJK / 泰 = **字符**计 unit；其余 = **词**计。
  不足加实质段落，**禁止塞空格 / 重复句凑数**。
- `### ` 章节 ≥5；正文**禁 h1/h2**。
- FAQ 节标题、购买前节标题 = `locales.mjs` 里该语种的 `MARKERS` 逐字字节（缺失语种回退 `FAQ` / 空）。
- 清单项 ≥6；emoji ≥6；列表 ≥3。
- 站内链接一律带 `/<locale>/` 前缀（照 EN 源实际链接，只加前缀、不翻译路径）。
- 外部链接**字节一致**白名单：
  - OSHA `…/1910/1910.132`、`…/1910/1910.244`
  - CCOHS `…/safety_haz/abrasive_wheels`
  - EN 源出现的 wikipedia / iso.org 外链原样保留。
- 语气：专业、平实、B2B；不留英文绝对化措辞残留。

## 5. 站内路由白名单（防坏链误判）

白名单源 = `scripts/pipeline/en/links.mjs` 的 `INTERNAL`（validate 用它建 `INTERNAL_HREFS`）。
**合法路由举例**（agent 与主线程都别当坏链删）：
- `/disc/gold8` `/disc/gold17` `/disc/ceramic15` `/disc/red8` `/disc/gray8`
- `/products/533x75-abrasive-belt` `/products/5-inch-solid…` `/products/6-inch-solid-sanding-disc` `/products/hook-loop-sanding-discs`
- `/collections/all` `/collections/flap-discs` `/collections/sanding-discs`
- `/flap/plastic` `/flap/steel` `/flap/fiberglass`；`/applications/*`；`/quote` `/oem` `/glossary`

> validator 判 "unknown routes" 的真实原因常是**链接行多余空格**导致精确匹配失败，
> 不是路由不存在。修 = 清 href 前后空格，**不要删链接**。

## 6. 验证门禁（PASS 才算交付）

1. `node scripts/pipeline/i18n/validate.mjs <locale> <slug>` → 必须 `PASS`（FAIL 项清零）。
   - 主关键词 5–24 次；次关键词 2–9 次；字数 5000–6000（超出报 warn 仍 PASS，但须收敛）。
2. 码点扫描确认无**目标语系外字符混入**：
   - 希伯来 0x05C0–0x05EF 是目标文字（正常）；希腊 0x0370 / 西里尔 0x0400 / 泰 0x0E00 /
     天城 0x0900 / 中文 / 谚文 混入 = 机翻残留，须清。
   - 用 `node` 按码点扫（终端会错显，别肉眼看），清完复扫命中 0。
3. 外链逐条比对 §4 白名单，字节一致。

## 7. 假完成判定与返工（主线程纪律）

- 子代理**报告为空 / 报告与磁盘不符 / 目标文件不存在** = 假完成，一律 `SendMessage` 责令重做，
  并要求贴出 `ls -la` 字节数 + validate PASS unit 数 + 主关键词正文次数作落盘证据。
- 主线程收验顺序：`ls`（存在）→ `validate`（PASS）→ 码点扫（残留 0）→ `record` 记账。
- 竞态提醒：agent 写文件中途时主线程读会读到半截内容（曾误判坏链）。
  复验前确认 agent 已停止该文件写入，或读两次内容一致再判。
- `record` 只在主线程做：`node scripts/pipeline/i18n/batch.mjs record <locale> <slug> PASS`（自带复验，拒记 FAIL 文件）。

## 8. 本轮已知坑（避免再踩）

| 坑 | 应对 |
|---|---|
| 希伯来等屈折语系：frontmatter 关键词写死而正文用另一词形 → 正文 0× | 关键词第 1 项 = 正文实际高频词形（加限定短语让词边界落地） |
| `/disc/gold*`、`/products/6-inch-solid…` 被判"坏链" | 合法路由，清空格、勿删（§5） |
| agent 读到写文件中途 → 误判 | 复验前确认写入停、读两次一致（§7 竞态） |
| 字数 <5000 报 warn 仍 PASS | 加实质段落收敛，别塞空格 |
| RTL 字符在终端错显 | 一律 `node` 按码点扫，不肉眼 |
| 曾删 `articles/ar/.parts/` 等越界 | 写边界 §1；收尾 `git status` 只认目标语种目录新增 |

## 9. 术语表（防造词）数据源

`glossary/<locale>.md` = 该语种站内官方词形表（41/41 齐备）。
所有产品/技法词必须用表内拼写；表内没有的词 → 用该语种最常见行业词，**禁止自造词**。
表缺（当前无缺）时先 `node scripts/pipeline/i18n/gloss.mjs <locale>` 生成再派单。
