const fs = require('fs')
const j = JSON.parse(fs.readFileSync('C:/Users/admin/AppData/Local/Temp/motai/products-live.json', 'utf8'))
console.log('count:', j.products.length)
for (const p of j.products) {
  const v = p.variants[0] || {}
  console.log(JSON.stringify({
    handle: p.handle,
    title: p.title,
    type: p.product_type,
    variant_title: v.title,
    sku: v.sku || '',
    images: p.images.length,
    tags: (p.tags || []).slice(0, 8)
  }))
}
