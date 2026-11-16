#!/usr/bin/env node
/**
 * 把 D:/Temp/trans/<code>.payload.json 的扁平点号键合并进：
 *   1. src/i18n/<code>.json（嵌套结构，按需深插入）
 *   2. .zcode-check/locales-v2/<code>.json（扁平镜像，仅 15 个 gen-new-locales 覆盖的语种）
 *
 * 幂等：键已存在则不覆盖（避免把已有译文改回机翻）。
 * 用法：node scripts/merge-video-i18n.mjs [--force]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TRANS = 'D:/Temp/trans'
const I18N = path.join(ROOT, 'src', 'i18n')
const V2 = path.join(ROOT, '.zcode-check', 'locales-v2')
const FORCE = process.argv.includes('--force')

// gen-new-locales.cjs 里硬编码的 15 个语种：这些语种的 locales-v2 镜像必须同步，
// 否则下次跑 gen-new-locales 会用英文覆盖已补的译文。
const V2_CODES = new Set(['lt', 'lv', 'et', 'sl', 'hr', 'sr', 'ca', 'nl', 'uk', 'el', 'hu', 'ro', 'bg', 'tl', 'bn'])

const IDENT = ['code', 'name', 'codeLabel', 'htmlLang', 'ogLocale', 'rtl']

/** 按点号路径深插入（数组按索引定位，对象按需创建）。 */
function setDot(obj, dotted, value, force) {
  const parts = dotted.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    const next = parts[i + 1]
    const wantArray = /^\d+$/.test(next)
    if (cur[k] === undefined || cur[k] === null || typeof cur[k] !== 'object') {
      cur[k] = wantArray ? [] : {}
    }
    cur = cur[k]
  }
  const last = parts[parts.length - 1]
  if (cur[last] === undefined || force) cur[last] = value
}

/** 嵌套对象 → 扁平点号键（数组视为原子叶子，与 key-parity 口径一致）。 */
function flatten(o, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out)
    else out[p] = v
  }
  return out
}

const codes = fs
  .readdirSync(TRANS)
  .filter((f) => f.endsWith('.payload.json'))
  .map((f) => f.replace('.payload.json', ''))
  .sort()

if (!codes.length) {
  console.error('no payload files found in ' + TRANS)
  process.exit(2)
}

let applied = 0
let skipped = 0
const report = []

for (const code of codes) {
  const payload = JSON.parse(fs.readFileSync(path.join(TRANS, `${code}.payload.json`), 'utf8'))
  const entries = Object.entries(payload).filter(([k]) => !IDENT.includes(k))
  if (!entries.length) continue

  // --- 1) 嵌套源 ---
  const locPath = path.join(I18N, `${code}.json`)
  if (!fs.existsSync(locPath)) {
    console.error(`${code}: ${locPath} 不存在，跳过`)
    skipped++
    continue
  }
  const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'))
  let n = 0
  for (const [k, v] of entries) {
    const before = k.split('.').reduce((c, kk) => (c == null ? undefined : c[kk]), loc)
    setDot(loc, k, v, FORCE)
    const after = k.split('.').reduce((c, kk) => (c == null ? undefined : c[kk]), loc)
    if (before === undefined || FORCE) n++
    else if (before !== after) n++
  }
  fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + '\n', 'utf8')

  // --- 2) 扁平镜像（仅 15 语种） ---
  let v2n = 0
  if (V2_CODES.has(code)) {
    const v2Path = path.join(V2, `${code}.json`)
    if (fs.existsSync(v2Path)) {
      const v2 = JSON.parse(fs.readFileSync(v2Path, 'utf8'))
      for (const [k, v] of entries) {
        if (v2[k] === undefined || FORCE) {
          v2[k] = v
          v2n++
        }
      }
      // 镜像文件保持扁平（键序按 en 顺序稳定输出）
      fs.writeFileSync(v2Path, JSON.stringify(v2, null, 2) + '\n', 'utf8')
    } else {
      console.error(`${code}: locales-v2 镜像不存在（${v2Path}），未同步`)
    }
  }

  applied += n
  report.push(`${code}: src/i18n +${n}` + (V2_CODES.has(code) ? `, locales-v2 +${v2n}` : ''))
}

console.log(report.join('\n'))
console.log(`\nmerged ${applied} key writes across ${report.length} locales (skipped ${skipped})`)