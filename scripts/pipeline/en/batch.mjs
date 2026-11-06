#!/usr/bin/env node
/**
 * batch.mjs — pull the next N not-yet-written plan entries for a writing batch.
 *
 * An entry is "done" when articles/en/<slug>.md exists AND passes the
 * validator. state.json tracks which slugs have been confirmed done so a
 * re-run never re-dispatches them.
 *
 *   node scripts/pipeline/en/batch.mjs next <N> [--from <n>]
 *       Print the next N plan entries (with slug/title/kwSet/internals/
 *       externals/outline) that are not in state.json's done set.
 *
 *   node scripts/pipeline/en/batch.mjs record <slug> <PASS|FAIL>
 *       Update state.json. After a PASS, re-validate on the fly so the ledger
 *       only ever stores articles the validator actually accepted.
 *
 *   node scripts/pipeline/en/batch.mjs status
 *       Print done / total / remaining.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..') // motai-static
const PLAN = path.join(here, 'plan.json')
const STATE = path.join(here, 'state.json')
const ARTDIR = path.join(root, 'articles', 'en')
const VALIDATE = path.join(here, 'validate.mjs')

function loadState() {
  if (!existsSync(STATE)) return { done: {}, fail: {} }
  return JSON.parse(readFileSync(STATE, 'utf8'))
}
function saveState(s) { writeFileSync(STATE, JSON.stringify(s, null, 2)) }

function doneSlugs() {
  const s = loadState()
  // Trust ONLY the validator-confirmed done-set in state.json. A .md that
  // exists on disk but was never booked by `record PASS` (i.e. it is an
  // incomplete or failing partial) must NOT count as done — it gets re-queued
  // so the next wave rewrites it. (The disk-scan fallback used to mask
  // failing files, which is exactly what we must not do.)
  return new Set(Object.keys(s.done))
}

function cmdNext(n, from) {
  const plan = JSON.parse(readFileSync(PLAN, 'utf8')).plan
  const done = doneSlugs()
  const out = []
  for (const e of plan) {
    if (from && e.n < from) continue
    if (done.has(e.slug)) continue
    out.push({
      n: e.n, slug: e.slug, title: e.title, type: e.type, category: e.category,
      family: e.family, keyword: e.keyword, slot: e.slot, kwSet: e.kwSet, image: e.image,
      internals: e.internals, externals: e.externals, outline: e.outline, wordTarget: e.wordTarget
    })
    if (out.length >= n) break
  }
  process.stdout.write(JSON.stringify(out, null, 2))
  process.stdout.write(`\n// ${out.length} of ${plan.length} remaining (done=${done.size})\n`)
}

function cmdRecord(slug, verdict) {
  const s = loadState()
  if (verdict === 'PASS') {
    // confirm the validator actually passes before we book it
    let ok = true
    try {
      execSync(`node "${VALIDATE}" ${slug}`, { cwd: root, stdio: 'pipe' })
    } catch (e) {
      const msg = (e.stdout || e.message).toString().trim().split('\n')[0]
      console.log(`REJECT ${slug}: validator failed -> ${msg}`)
      s.fail[slug] = new Date().toISOString()
      saveState(s)
      process.exit(1)
    }
    s.done[slug] = new Date().toISOString()
    delete s.fail[slug]
  } else {
    s.fail[slug] = new Date().toISOString()
    delete s.done[slug]
  }
  saveState(s)
  const total = JSON.parse(readFileSync(PLAN, 'utf8')).plan.length
  console.log(`recorded ${slug} = ${verdict}  (done ${Object.keys(s.done).length}/${total})`)
}

function cmdStatus() {
  const total = JSON.parse(readFileSync(PLAN, 'utf8')).plan.length
  const s = loadState()
  const files = existsSync(ARTDIR) ? readdirSync(ARTDIR).filter((f) => f.endsWith('.md')).length : 0
  console.log(`total plan entries: ${total}`)
  console.log(`.md files on disk : ${files}`)
  console.log(`confirmed in state: ${Object.keys(s.done).length} done, ${Object.keys(s.fail).length} failing`)
}

const [cmd, a, b] = process.argv.slice(2)
const num = (x) => parseInt(x, 10)
switch (cmd) {
  case 'next': cmdNext(num(a) || 10, num(b)); break
  case 'record': cmdRecord(a, b); break
  case 'status': cmdStatus(); break
  default:
    console.log('usage: batch.mjs next <N> [--from <n>] | record <slug> <PASS|FAIL> | status')
}
