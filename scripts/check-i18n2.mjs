import fs from 'fs'
import path from 'path'

const dir = 'D:/Code/shopify/motai-static/src/i18n'
const ref = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'))

function keys(o, p = '') {
  let out = []
  for (const k of Object.keys(o)) {
    const kp = p ? p + '.' + k : k
    if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) out = out.concat(keys(o[k], kp))
    else out.push(kp)
  }
  return out
}
const refKeys = new Set(keys(ref))
let allOk = true
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json') || f === 'en.json') continue
  const p = path.join(dir, f)
  let d
  try {
    d = JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    console.log(f, 'JSON ERROR', e.message)
    allOk = false
    continue
  }
  const ks = new Set(keys(d))
  const missing = [...refKeys].filter((k) => !ks.has(k))
  const extra = [...ks].filter((k) => !refKeys.has(k))
  if (missing.length || extra.length) allOk = false
  console.log(
    f.padEnd(8),
    'missing=' + missing.length,
    missing.slice(0, 6).join(' | '),
    extra.length ? 'extra=' + extra.length + ' ' + extra.slice(0, 6).join(', ') : ''
  )
}
console.log(allOk ? 'ALL OK' : 'HAS GAPS')
