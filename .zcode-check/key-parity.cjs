const fs = require('fs')
const path = require('path')
const dir = 'D:\\Code\\shopify\\motai-static\\src\\i18n'
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'))
const flat = (o, p = []) => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? flat(v, [...p, k]) : [[...p, k].join('.'), v])
const enKeys = new Set(flat(en).map((x) => x[0]))
const extra = (o, p = []) => Object.entries(o).filter(([k, v]) =>
  !(typeof v === 'object' && v !== null) && !enKeys.has([...p, k].join('.')))
for (const f of fs.readdirSync(dir).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir + '/' + f), 'utf8'))
  const missing = [...enKeys].filter((k) => flat(j).find((x) => x[0] === k) === undefined)
  const extraK = extra(j).map((x) => x[0])
  console.log(f + ' missing=' + missing.length + (missing.length ? ' [' + missing.slice(0, 12).join(', ') + ']' : '') +
    ' extra=' + extraK.length + (extraK.length ? ' [' + extraK.slice(0, 8).join(', ') + ']' : ''))
}
