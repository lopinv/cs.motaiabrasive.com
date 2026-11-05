/**
 * Merge all completed chunk files (tails/<code>.pN.out.json) into one
 * tail output per locale (tails/<code>.tail.out.json), then deep-merge it
 * into the locale payload (locales-v2/<code>.json) — producing a FULL
 * 579-key locale. Prints a per-locale status so missing chunks are obvious.
 *
 * Usage: node .zcode-check/merge-chunks.cjs [code ...]
 */
const fs = require('fs')
const path = require('path')

const TAILS = path.join(__dirname, 'tails')
const PAY = path.join(__dirname, 'locales-v2')
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', 'en.json'), 'utf8'))

function leafEntries(o, prefix = '', out = []) {
  for (const [k, v] of Object.entries(o)) {
    const np = prefix ? prefix + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) leafEntries(v, np, out)
    else out.push([np, v])
  }
  return out
}
const enLeaves = leafEntries(en)
const enSet = new Set(enLeaves.map(([k]) => k))
const TOK = /\{[a-z]+\}/g
const enTok = {}
for (const [k, v] of enLeaves) {
  if (typeof v === 'string' && TOK.test(v)) enTok[k] = [...v.match(TOK)]
}

const deepMerge = (base, over) => {
  const out = { ...base }
  for (const [k, v] of Object.entries(over)) {
    const b = out[k]
    out[k] = (v && typeof v === 'object' && !Array.isArray(v) && b && typeof b === 'object' && !Array.isArray(b))
      ? deepMerge(b, v)
      : v
  }
  return out
}

const codes = process.argv.slice(2)
if (!codes.length) {
  for (const f of fs.readdirSync(TAILS).filter((x) => x.endsWith('.tail.json'))) {
    codes.push(f.replace(/\.tail\.json$/, ''))
  }
}

let ready = 0
for (const code of codes) {
  const work = JSON.parse(fs.readFileSync(path.join(TAILS, code + '.tail.json'), 'utf8'))
  const chunks = Object.keys(work)
    .map((k) => k.split('.')[0])
    .filter((v, i, a) => a.indexOf(v) === i)
  // find the chunk files that cover this locale
  const files = fs.readdirSync(TAILS).filter((f) => new RegExp('^' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.p[0-9a-z]+\\.out\\.json$').test(f)).sort()
  const missing = []
  const mergedTail = {}
  for (const f of files) {
    const o = JSON.parse(fs.readFileSync(path.join(TAILS, f), 'utf8'))
    for (const [k, v] of Object.entries(o)) {
      if (mergedTail[k] !== undefined) continue
      mergedTail[k] = v
    }
  }
  // which worklist keys are still uncovered
  for (const k of Object.keys(work)) if (!(k in mergedTail)) missing.push(k)

  if (missing.length) {
    console.log(`${code}: INCOMPLETE — ${Object.keys(mergedTail).length}/${Object.keys(work).length} keys (${files.length} chunk files); still missing e.g. ${missing.slice(0, 4).join(', ')}`)
    continue
  }
  // write the merged tail file
  fs.writeFileSync(path.join(TAILS, code + '.tail.out.json'), JSON.stringify(mergedTail, null, 2) + '\n', 'utf8')

  // deep-merge into the payload
  const head = JSON.parse(fs.readFileSync(path.join(PAY, code + '.json'), 'utf8'))
  const merged = deepMerge(head, mergedTail)
  const covered = Object.keys(merged).filter((k) => enSet.has(k)).length
  const tokFail = []
  for (const [k, toks] of Object.entries(enTok)) {
    if (!(k in merged)) continue
    const v = merged[k]
    if (typeof v !== 'string' || toks.some((t) => !v.includes(t))) tokFail.push(k)
  }
  if (covered < enLeaves.length) {
    console.log(`${code}: FAIL — merged covers ${covered}/${enLeaves.length} en paths`)
    continue
  }
  if (tokFail.length) {
    console.log(`${code}: FAIL — placeholder lost on ${tokFail.length} key(s): ${tokFail.slice(0, 5).join(', ')}`)
    continue
  }
  fs.writeFileSync(path.join(PAY, code + '.json'), JSON.stringify(merged, null, 2) + '\n', 'utf8')
  console.log(`${code}: OK — ${Object.keys(merged).length} keys, covers ${covered}/${enLeaves.length} en paths`)
  ready++
}
console.log(`\n${ready}/${codes.length} locale(s) merged`)
