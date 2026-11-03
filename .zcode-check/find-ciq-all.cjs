const fs = require('fs')
const path = require('path')
const root = 'D:\\Code\\shopify\\motai-static'
const pat = 'confirmed in the quotation'
for (const sub of ['src/i18n', 'src/data']) {
  const d = path.join(root, sub)
  for (const f of fs.readdirSync(d)) {
    if (!/\.(json|js)$/.test(f)) continue
    const c = fs.readFileSync(path.join(d, f), 'utf8')
    let i = 0, n = 0
    while ((i = c.indexOf(pat, i)) !== -1) { i += pat.length; n++ }
    if (n) console.log(sub + '/' + f + ' :: ' + n)
  }
}
