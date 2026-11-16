// i18n 自动记账 + 对账脚本（主线程收验用，防手搓）
// 用法：node scripts/pipeline/i18n/rebook.mjs <locale> [--force]
//   扫描 articles/<locale>/*.md，对"未记账且写稳(mtime>5min)"的文件批量 validate，
//   PASS 自动 record；FAIL 列清单；并做 phantom 检查（账本有但磁盘无→告警）。
// 安全：只 record PASS、绝不删除/改动任何文件（防误删）。--force 忽略 mtime 阈值。
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'

const args = process.argv.slice(2)
const locale = args[0]
const force = args.includes('--force')
if (!locale || !/^[a-z-]+$/.test(locale)) {
  console.error('用法: node rebook.mjs <locale> [--force]')
  process.exit(2)
}
const root = path.resolve(process.cwd())
const dir = path.join(root, 'articles', locale)
const now = Date.now()

function validate(slug) {
  try {
    return execSync(`node scripts/pipeline/i18n/validate.mjs ${locale} ${slug}`, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
  } catch (e) {
    return (e.stdout || '').toString() // validate 失败时 exit≠0，stdout 仍有内容
  }
}

let pass = 0, fail = 0, skip = 0
const failList = []
for (const f of readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
  const slug = f.replace(/\.md$/, '')
  const st = statSync(path.join(dir, f))
  const ageMin = (now - st.mtimeMs) / 60000
  if (!force && ageMin < 5) { skip++; continue } // 写稳阈值（agent 可能还在写）
  const out = validate(slug)
  if (out.includes('PASS')) {
    execSync(`node scripts/pipeline/i18n/batch.mjs record ${locale} ${slug} PASS`, { cwd: root, stdio: 'ignore' })
    pass++
  } else {
    fail++
    const line = (out.split('\n').find((l) => l.includes('✗')) || out.split('\n')[0] || '').trim()
    failList.push(`${slug} :: ${line}`)
  }
}

// phantom 检查：账本已记但磁盘文件没了
const state = JSON.parse(readFileSync(path.join(root, 'scripts', 'pipeline', 'i18n', 'state.json'), 'utf8'))
const booked = Object.keys((state[locale] || {}).done || {})
const disk = new Set(readdirSync(dir).filter((x) => x.endsWith('.md')).map((x) => x.replace(/\.md$/, '')))
const phantom = booked.filter((s) => !disk.has(s))

console.log(`[rebook ${locale}] PASS记账 ${pass} | FAIL ${fail} | 跳过写入中 ${skip} | 账本现 ${booked.length}`)
if (failList.length) { console.log('--- FAIL（需返工）---'); failList.forEach((l) => console.log('  ' + l)) }
if (phantom.length) { console.log('--- ⚠️ PHANTOM（记账但磁盘无，可能被误删，需重建）---'); phantom.forEach((s) => console.log('  ' + s)) }
