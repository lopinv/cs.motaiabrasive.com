#!/usr/bin/env node
/**
 * 生成 src/data/article-locales.json —— 各语种已翻译文章的 slug 清单。
 *
 * 用途（单一事实源）：
 *   1. 未翻译条目 → robots noindex（消除 ~5444 个“英文克隆 + 外语
 *      hreflang”的伪翻译 URL，这是当前最大的 SEO 负债）
 *   2. hreflang 互指只保留确有译文的语种（Google 不再认为 42 个
 *      内容相同的页面互相平等）
 *   3. gen-seo.mjs 的 sitemap 同步摘除
 *
 * 在 npm run build 的 astro build 之前运行（已接入 build 链）。
 * 判据：articles/<lang>/<slug>.md 存在即视为已译（.parts 分片由
 * tinyglobby 的 dot 默认行为排除，不进 collection，与此口径一致）。
 */
import { readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const articlesDir = path.join(root, 'articles')
const i18nDir = path.join(root, 'src', 'i18n')

const langs = readdirSync(i18nDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort()

// EN 源 slug 集合（路由全集）
const enSlugs = readdirSync(path.join(articlesDir, 'en'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''))
  .sort()

const out = { generated: new Date().toISOString(), enSlugs, locales: {} }

for (const lang of langs) {
  const dir = path.join(articlesDir, lang)
  const slugs = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => e.name.replace(/\.md$/, ''))
        .sort()
    : []
  // 只保留落在 EN 路由集合内的 slug（防孤儿 slug 误导 noindex 判定）
  out.locales[lang] = slugs.filter((s) => enSlugs.includes(s))
}

writeFileSync(path.join(root, 'src/data/article-locales.json'), JSON.stringify(out, null, 2) + '\n')

const translated = Object.entries(out.locales).filter(([l, s]) => l !== 'en' && s.length > 0)
const zero = Object.entries(out.locales).filter(([l, s]) => l !== 'en' && s.length === 0)
console.log(`article-locales: ${enSlugs.length} en slugs, ${translated.length} locale(s) with translations, ${zero.length} empty`)
console.log('  empty:', zero.map(([l]) => l).join(' ') || '(none)')
console.log('  counts:', translated.map(([l, s]) => `${l}:${s.length}`).join(' '))