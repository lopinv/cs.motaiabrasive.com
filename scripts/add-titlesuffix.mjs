import fs from 'fs'
import path from 'path'

const dir = 'D:/Code/shopify/motai-static/src/i18n'

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue
  const p = path.join(dir, f)
  const d = JSON.parse(fs.readFileSync(p, 'utf8'))
  d.meta = d.meta || {}
  if (!d.meta.titleSuffix) d.meta.titleSuffix = 'MoTai Abrasives'
  fs.writeFileSync(p, JSON.stringify(d, null, 2))
  console.log('titleSuffix set in', f)
}
