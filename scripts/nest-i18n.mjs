import fs from 'fs'
import path from 'path'

const dir = 'D:/Code/shopify/motai-static/src/i18n'

function nest(obj) {
  if (Array.isArray(obj)) return obj.map(nest)
  if (obj && typeof obj === 'object') {
    const out = {}
    const dotted = []
    // Phase A: plain keys
    for (const [k, v] of Object.entries(obj)) {
      if (!k.includes('.')) out[k] = v
      else dotted.push([k, v])
    }
    // Phase B: dotted keys walked in on top (merging with existing objects)
    for (const [k, v] of dotted) {
      const parts = k.split('.')
      let cur = out
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null || Array.isArray(cur[parts[i]])) {
          cur[parts[i]] = {}
        }
        cur = cur[parts[i]]
      }
      const last = parts[parts.length - 1]
      // if target already holds an object from a plain key, merge; else set
      if (cur[last] && typeof cur[last] === 'object' && !Array.isArray(cur[last])) {
        cur[last] = { ...cur[last], ...(typeof v === 'object' ? v : { _v: v }) }
      } else {
        cur[last] = v
      }
    }
    // Phase C: recurse
    for (const k of Object.keys(out)) {
      if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = nest(out[k])
    }
    return out
  }
  return obj
}

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue
  const p = path.join(dir, f)
  const data = JSON.parse(fs.readFileSync(p, 'utf8'))
  const nested = nest(data)
  fs.writeFileSync(p, JSON.stringify(nested, null, 2))
  console.log('nested', f, '| apps.metal =', JSON.stringify(nested.apps?.metal)?.slice(0, 50))
}
console.log('done')
