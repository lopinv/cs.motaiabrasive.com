#!/usr/bin/env node
/**
 * i18n/batch.mjs — per-locale ledger + dispatch helper for translated
 * articles. One state file tracks, per locale, which EN sources have been
 * translated AND confirmed by i18n/validate.mjs. Anything not booked PASS
 * (crashed agent, failing partial) stays in the queue and gets re-dispatched.
 *
 *   node scripts/pipeline/i18n/batch.mjs next <code> [N]
 *       Print the next N EN slugs (deterministic order) not yet done for <code>.
 *   node scripts/pipeline/i18n/batch.mjs record <code> <slug> <PASS|FAIL>
 *       Book a result. PASS re-validates on the fly; only then is it stored.
 *   node scripts/pipeline/i18n/batch.mjs status
 *       Print per-locale done / remaining.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { TARGET_LOCALES } from './locales.mjs'

const here = path.dirname(fileURLToPath(import.meta.url)) // scripts/pipeline/i18n
const root = path.resolve(here, '..', '..', '..') // motai-static
const STATE = path.join(here, 'state.json')
const VALIDATE = path.join(here, 'validate.mjs')
const EN_STATE = path.join(root, 'scripts', 'pipeline', 'en', 'state.json')

function loadState() {
  if (!existsSync(STATE)) return {}
  return JSON.parse(readFileSync(STATE, 'utf8'))
}
function saveState(s) { writeFileSync(STATE, JSON.stringify(s, null, 2)) }

/** EN source slugs: articles/en/*.md that exist on disk AND are
 *  validator-confirmed in the EN ledger (so we never translate a failing EN
 *  partial). Deterministic order = alphabetical. */
function enSlugs() {
  const dir = path.join(root, 'articles', 'en')
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : []
  if (!existsSync(EN_STATE)) return files.map((f) => f.replace(/\.md$/, ''))
  const en = JSON.parse(readFileSync(EN_STATE, 'utf8'))
  const done = new Set(Object.keys(en.done || {}))
  return files.map((f) => f.replace(/\.md$/, '')).filter((s) => done.has(s)).sort()
}

function localeDone(code, state) {
  return new Set(Object.keys(state[code]?.done || {}))
}

function cmdNext(code, n) {
  const state = loadState()
  const done = localeDone(code, state)
  const slugs = enSlugs()
  const out = slugs.filter((s) => !done.has(s)).slice(0, n)
  process.stdout.write(JSON.stringify(out, null, 2))
  process.stdout.write(`\n// ${out.length} next of ${slugs.length - done.size} remaining for [${code}]\n`)
}

function cmdRecord(code, slug, verdict) {
  if (!TARGET_LOCALES.includes(code)) { console.log(`unknown locale ${code}`); process.exit(1) }
  const state = loadState()
  if (!state[code]) state[code] = { done: {}, fail: {} }
  if (verdict === 'PASS') {
    let rej = ''
    try {
      execSync(`node "${VALIDATE}" ${code} ${slug}`, { cwd: root, stdio: 'pipe' })
    } catch (e) {
      rej = ((e.stdout || '') + (e.message || '')).toString().trim().split('\n')[0]
    }
    if (rej && rej.startsWith('FAIL')) {
      state[code].fail[slug] = new Date().toISOString()
      saveState(state)
      console.log(`REJECT [${code}] ${slug}: ${rej}`)
      process.exit(1)
    }
    state[code].done[slug] = new Date().toISOString()
    delete state[code].fail[slug]
  } else {
    state[code].fail[slug] = new Date().toISOString()
    delete state[code].done[slug]
  }
  saveState(state)
  const total = enSlugs().length
  console.log(`recorded [${code}] ${slug} = ${verdict}  (done ${Object.keys(state[code].done).length}/${total})`)
}

function cmdStatus() {
  const state = loadState()
  const total = enSlugs().length
  const lines = TARGET_LOCALES.map((code) => {
    const d = state[code]?.done || {}
    const f = state[code]?.fail || {}
    return `${code.padEnd(6)} ${String(Object.keys(d).length).padStart(4)}/${total}${Object.keys(f).length ? `  (${Object.keys(f).length} failing)` : ''}`
  })
  console.log(`EN sources: ${total}   target locales: ${TARGET_LOCALES.length}   expected files: ${total * TARGET_LOCALES.length}`)
  console.log(lines.join('\n'))
}

const [cmd, a, b, c] = process.argv.slice(2)
switch (cmd) {
  case 'next': cmdNext(a, parseInt(b, 10) || 5); break
  case 'record': cmdRecord(a, b, c); break
  case 'status': cmdStatus(); break
  default:
    console.log('usage: i18n/batch.mjs next <code> [N] | record <code> <slug> <PASS|FAIL> | status')
}
