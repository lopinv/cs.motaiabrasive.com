#!/usr/bin/env node
/**
 * 批量为 img 标签补 width/height 属性（降低 CLS / 消除 Lighthouse
 * "image elements do not have explicit size" 报错）。
 *
 * 值取「容器 CSS aspect-ratio」的等效像素（700×525 = 4/3、1200×857 = 7/5、
 * 1600×900 = 16/9、800×500 = 16/10），使属性与布局盒一致。
 * 替换严格限定为「没有 width 属性的 img」，已带尺寸的不动。
 */
const fs = require('fs')
const { execSync } = require('child_process')

// 目标文件 → 需要补的尺寸（按该图所在容器比例）
const targets = [
  // model 详情：主图 7/5 + 相关型号卡 4/3
  ['src/pages/[lang]/model/[slug].astro', '1200|857'],
  ['src/pages/[lang]/model/[slug].astro', '700|525'],
  // collections：型号卡/砂盘卡 4/3 + flap/sponge 卡 4/3
  ['src/pages/[lang]/collections/[key].astro', '700|525'],
  // disc/flap/sponge 详情主图 7/5
  ['src/pages/[lang]/disc/[key].astro', '1200|857'],
  ['src/pages/[lang]/flap/[key].astro', '1200|857'],
  ['src/pages/[lang]/sponge/[key].astro', '1200|857'],
  // factory gallery 16/10
  ['src/pages/[lang]/factory.astro', '800|500'],
  // about / applications 列表 4/3
  ['src/pages/[lang]/about.astro', '800|500'],
  ['src/pages/[lang]/applications.astro', '800|600'],
  // LocationBlock 16/9
  ['src/components/LocationBlock.astro', '1200|675'],
  // Home partner 图 16/10
  ['src/components/pages/Home.astro', '800|500'],
  // HeroCarousel 首屏轮播 16/9
  ['src/components/HeroCarousel.astro', '1600|900'],
  // PageHero 16/10
  ['src/components/PageHero.astro', '1200|750'],
  // ProductCategorySection 16/10
  ['src/components/ProductCategorySection.astro', '1200|750'],
  // ArticleCard 4/3
  ['src/components/ArticleCard.astro', '700|525']
]

let total = 0
for (const [file, spec] of targets) {
  if (!fs.existsSync(file)) { console.log(`skip (missing): ${file}`); continue }
  const [w, h] = spec.split('|')
  let src = fs.readFileSync(file, 'utf8')

  // 只为「没有 width= 的 img」补属性：匹配 <img 开头到 > 结束、且不含 width=
  src = src.replace(/<img\b([^>]*?)(\/?>)/g, (full, attrs, close) => {
    if (/\bwidth=/.test(attrs)) return full // 已有尺寸，跳过
    total++
    return `<img${attrs} width="${w}" height="${h}"${close}`
  })

  fs.writeFileSync(file, src)
  console.log(`✓ ${file} (+${w}×${h})`)
}
console.log(`\ntotal img tags sized: ${total}`)