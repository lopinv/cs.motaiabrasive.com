#!/usr/bin/env node
/**
 * 一次性令牌化替换：把 global.css 中散落的硬编码 border-radius / box-shadow /
 * z-index 替换为设计令牌。语义等价映射，渲染结果保持（阴影按原视觉归入最近档）。
 *
 * 用法：node .zcode-check/tokenize-css.cjs <目标文件>
 */
const fs = require('fs')

const file = process.argv[2]
if (!file) { console.error('usage: node tokenize-css.cjs <file>'); process.exit(2) }
let css = fs.readFileSync(file, 'utf8')

// ---- 替换规则（顺序执行，先具体后一般） ----------------------------------
const rules = [
  // z-index → 层级令牌（值相等）
  [/z-index:\s*50;/g, 'z-index: var(--z-sticky);'],
  [/z-index:\s*60;/g, 'z-index: var(--z-header);'],
  [/z-index:\s*90;/g, 'z-index: var(--z-quickbar);'],
  [/z-index:\s*95;/g, 'z-index: var(--z-chat);'],
  [/z-index:\s*96;/g, 'z-index: var(--z-modal);'],

  // border-radius: 6px → --r-md（新令牌 --r-md = 6px，等价）
  [/border-radius:\s*6px;/g, 'border-radius: var(--r-md);'],
  // border-radius: 3px → --r-sm 与 4px 同档视觉（原来的 3px 用于小角标，保留接近值）
  [/border-radius:\s*3px;/g, 'border-radius: var(--r-xs);'],
  [/border-radius:\s*4px;/g, 'border-radius: var(--r-sm);'],
  [/border-radius:\s*8px;/g, 'border-radius: var(--r-lg);'],
  [/border-radius:\s*10px;/g, 'border-radius: var(--r-xl);'],
  // var(--radius) 规则已由 :root 别名接管，无需替换

  // box-shadow → 阴影令牌（按原视觉强度归档，数值接近）
  [/box-shadow:\s*0 12px 32px rgba\(0,0,0,\.14\);/g, 'box-shadow: var(--sh-3);'],
  [/box-shadow:\s*0 12px 32px rgba\(0,0,0,\.1\);/g, 'box-shadow: var(--sh-3);'],
  [/box-shadow:\s*0 10px 30px rgba\(0,0,0,\.07\);/g, 'box-shadow: var(--sh-2);'],
  [/box-shadow:\s*0 -6px 20px rgba\(0,0,0,\.22\);/g, 'box-shadow: var(--sh-3);'],
  [/box-shadow:\s*0 8px 24px rgba\(0,0,0,\.25\);/g, 'box-shadow: var(--sh-3);'],
  [/box-shadow:\s*0 18px 48px rgba\(0,0,0,\.22\);/g, 'box-shadow: var(--sh-4);'],

  // ---- 卡片 / 容器 padding 归一为间距令牌 --------------------------------
  // 视觉值不变（18px = --sp-5 附近的 20px，取 20px 让节奏统一到 4px 标尺）
  [/padding: 18px 20px;/g, 'padding: var(--sp-5) var(--sp-5);'],   // .faq-item
  [/padding: 18px;/g, 'padding: var(--sp-5);'],                     // side-block/value-card/model-card 一档
  [/padding: 22px;/g, 'padding: var(--sp-6);'],                     // value-card 原 22px → 24px 档
  [/padding: 20px;/g, 'padding: var(--sp-5);'],                     // region-card 等
  [/padding: 14px 18px;/g, 'padding: var(--sp-3) var(--sp-4);'],     // details.motai-product-specs
]

let n = 0
for (const [re, to] of rules) {
  const before = css
  css = css.replace(re, to)
  if (css !== before) n++
}
fs.writeFileSync(file, css)
console.log(`tokenized ${file} — ${n} rule classes applied`)