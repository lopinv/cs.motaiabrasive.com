const fs = require('fs')
const t = (f, label, re) => {
  const h = fs.readFileSync('D:\\Code\\shopify\\motai-static\\dist' + f, 'utf8')
  const m = h.match(re)
  console.log(f + ' :: ' + label + ' :: ' + (m ? m[1].replace(/\s+/g, ' ').slice(0, 130) : 'MISSING'))
}
t('/en/index.html', 'title', /<title>([^<]+)</)
t('/en/index.html', 'desc', /<meta name="description" content="([^"]{0,160})/)
t('/en/products/hook-loop-sanding-discs/index.html', 'title', /<title>([^<]+)</)
t('/en/products/hook-loop-sanding-discs/index.html', 'desc', /<meta name="description" content="([^"]{0,160})/)
t('/en/collections/abrasive-belts/index.html', 'title', /<title>([^<]+)</)
t('/en/model/gxk-51/index.html', 'title', /<title>([^<]+)</)
t('/en/factory/index.html', 'h1', /<h1[^>]*>([^<]+)</)
t('/ar/index.html', 'title', /<title>([^<]+)</)
t('/zh/index.html', 'title', /<title>([^<]+)</)
t('/ja/index.html', 'title', /<title>([^<]+)</)
// fingerprint scan across all pages: old patterns must be gone
const dir = 'D:\\Code\\shopify\\motai-static\\dist'
const pats = [
  'Professional Abrasive Manufacturer',
  'A partner behind every surface',
  "Let's build your next order",
  'Your Brand. Our Abrasive Solutions',
  'From abrasive sheet to your next shipment',
  'Wholesale quotation required',
  'confirmed in the quotation',
  'Abrasives. People. Partnership'
]
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = d + '/' + e.name
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.html')) out.push(p)
  }
  return out
}
const htmls = walk(dir)
let hits = 0
for (const p of htmls) {
  const h = fs.readFileSync(p, 'utf8')
  for (const pat of pats) if (h.includes(pat)) { console.log('FINGERPRINT LEFT :: ' + p + ' :: ' + pat); hits++ }
}
console.log('html pages scanned: ' + htmls.length + ' :: remaining fingerprints: ' + hits)
