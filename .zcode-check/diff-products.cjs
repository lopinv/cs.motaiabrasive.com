const fs = require('fs')
const live = JSON.parse(fs.readFileSync('C:\\Users\\admin\\AppData\\Local\\Temp\\motai\\products-live.json', 'utf8'))
const local = JSON.parse(fs.readFileSync('D:\\Code\\shopify\\motai-static\\src\\data\\products.json', 'utf8'))

function parseSizes(txt) {
  const m = txt.match(/Sizes:\s*(.+?)\.\s*Grits:/i)
  if (!m) return []
  return m[1].split(',').map((s) => s.trim().toLowerCase().replace(/\s+/g, ' '))
}
function parseGrits(txt) {
  const m = txt.match(/Grits:\s*(.+?)\.\s*(Wholesale|Specifications|MOQ)/i)
  if (!m) return []
  return m[1].split(',').map((s) => s.trim())
}

const byHandle = {}
for (const p of local) byHandle[p.handle] = p
console.log('live handles:', live.products.map(p => p.handle).sort().join(', '))
console.log('local handles:', local.map(p => p.handle).sort().join(', '))
console.log('---')
for (const p of live.products) {
  const txt = (p.body_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const lSizes = parseSizes(txt)
  const lGrits = parseGrits(txt)
  const loc = byHandle[p.handle]
  const mSizes = loc ? loc.sizes.map(s => s.toLowerCase().replace(/\s+/g,' ')) : ['<MISSING>']
  const mGrits = loc ? loc.grits.map(g => g.toLowerCase()) : ['<MISSING>']
  const sizesMatch = JSON.stringify(lSizes) === JSON.stringify(mSizes)
  const gritsMatch = JSON.stringify(lGrits) === JSON.stringify(mGrits)
  const img = (p.images && p.images[0] ? p.images[0].src : '').replace(/^https:\/\/.*?cdn\.shop\//, '')
  console.log(p.handle.padEnd(32) + ' | sizes:' + (sizesMatch?'OK':'DIFF ') + ' grits:' + (gritsMatch?'OK':'DIFF') + ' | imgs:' + (p.images?p.images.length:0) + ' | img0:' + img)
  if (!sizesMatch) { console.log('   live sizes: ' + JSON.stringify(lSizes)); console.log('   local sizes: ' + JSON.stringify(mSizes)) }
  if (!gritsMatch) { console.log('   live grits: ' + JSON.stringify(lGrits)); console.log('   local grits: ' + JSON.stringify(mGrits)) }
}
