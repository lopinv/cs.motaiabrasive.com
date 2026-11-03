const fs = require('fs')
const j = JSON.parse(fs.readFileSync('D:\\Code\\shopify\\motai-static\\src\\i18n\\en.json', 'utf8'))
function find(o, pat, p) {
  for (const k in o) {
    const v = o[k]
    if (typeof v === 'object' && v) find(v, pat, p + '.' + k)
    else if (typeof v === 'string' && v.includes(pat)) console.log(p + '.' + k + ' = ' + JSON.stringify(v).slice(0, 160))
  }
}
find(j, 'confirmed in the quotation', '')
find(j, 'Wholesale quotation', '')
