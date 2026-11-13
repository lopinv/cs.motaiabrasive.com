#!/usr/bin/env node
/**
 * 把 D:/Temp/trans/gallery-<code>.payload.json 的 4 个 productPage.* 键合并进
 * src/i18n/<code>.json 与 .zcode-check/locales-v2/<code>.json（15 语种镜像）。
 * 幂等：键已存在不覆盖。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TRANS = 'D:/Temp/trans'
const I18N = path.join(ROOT, 'src', 'i18n')
const V2 = path.join(ROOT, '.zcode-check', 'locales-v2')
const V2_CODES = new Set(['lt', 'lv', 'et', 'sl', 'hr', 'sr', 'ca', 'nl', 'uk', 'el', 'hu', 'ro', 'bg', 'tl', 'bn'])

function setDot(obj, dotted, value) {
  const parts = dotted.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (cur[k] === undefined || cur[k] === null || typeof cur[k] !== 'object' || Array.isArray(cur[k])) cur[k] = {}
    cur = cur[k]
  }
  const last = parts[parts.length - 1]
  if (cur[last] === undefined) cur[last] = value
}

const files = fs.readdirSync(TRANS).filter((f) => f.startsWith('gallery-') && f.endsWith('.payload.json'))
let n = 0
const report = []
for (const f of files) {
  const code = f.slice(8, -13)
  const payload = JSON.parse(fs.readFileSync(path.join(TRANS, f), 'utf8'))
  const entries = Object.entries(payload)
  const locPath = path.join(I18N, `${code}.json`)
  if (!fs.existsSync(locPath)) { console.error(`${code}: src/i18n 文件缺失`); continue }
  const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'))
  let c = 0
  for (const [k, v] of entries) {
    const before = k.split('.').reduce((a, b) => (a == null ? undefined : a[b]), loc)
    setDot(loc, k, v)
    if (before === undefined) c++
  }
  fs.writeFileSync(locPath, JSON.stringify(loc, null, 2) + '\n', 'utf8')
  let v2 = 0
  if (V2_CODES.has(code)) {
    const v2Path = path.join(V2, `${code}.json`)
    if (fs.existsSync(v2Path)) {
      const v2o = JSON.parse(fs.readFileSync(v2Path, 'utf8'))
      for (const [k, v] of entries) if (v2o[k] === undefined) { v2o[k] = v; v2++ }
      fs.writeFileSync(v2Path, JSON.stringify(v2o, null, 2) + '\n', 'utf8')
    }
  }
  n += c
  report.push(`${code}: +${c}` + (V2_CODES.has(code) ? ` v2+${v2}` : ''))
}
console.log(report.join(' '))
console.log(`merged ${n} writes across ${report.length} locales`)
