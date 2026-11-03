import fs from 'fs'
const base = 'D:/Code/shopify/motai-static/src/i18n/'
const fixes = { es: 'Color', zh: '颜色' }
for (const [l, color] of Object.entries(fixes)) {
  const p = base + l + '.json'
  const d = JSON.parse(fs.readFileSync(p, 'utf8'))
  d.flapPage = d.flapPage || {}
  d.flapPage.color = color
  fs.writeFileSync(p, JSON.stringify(d, null, 2))
  console.log(l, 'flapPage.color added')
}
