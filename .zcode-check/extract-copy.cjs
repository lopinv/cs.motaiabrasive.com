const fs = require('fs')
const path = require('path')
const dir = path.join('D:\\Code\\shopify\\motai-static\\src\\i18n')
const keys = [
  ['home', 'heroTitle'], ['home', 'builtTitle'], ['home', 'partnerTitle'],
  ['home', 'processTitle'], ['home', 'oemTitle'], ['about', 'h1'],
  ['factory', 'h1'], ['oem', 'h1'], ['contact', 'h1'], ['quotePage', 'h1'],
  ['clients', 'h1']
]
for (const f of fs.readdirSync(dir).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  console.log('=== ' + f + ' ===')
  for (const [a, b] of keys) {
    console.log(a + '.' + b + ' = ' + JSON.stringify(j[a] && j[a][b]))
  }
  const tdk = j.tdk || {}
  for (const p of ['home', 'about', 'factory', 'oem', 'contact']) {
    if (tdk[p]) console.log('tdk.' + p + '.title = ' + JSON.stringify(tdk[p].title))
  }
  if (tdk.colt) for (const c of ['belts', 'discs', 'flap', 'all']) {
    if (tdk.colt[c]) console.log('tdk.colt.' + c + '.title = ' + JSON.stringify(tdk.colt[c].title))
  }
  if (tdk.product) console.log('tdk.product.title = ' + JSON.stringify(tdk.product.title))
}
