const fs = require('fs')
const path = require('path')
const dir = path.join('D:\\Code\\shopify\\motai-static\\src\\i18n')
const get = (o, p) => p.split('.').reduce((c, k) => (c && c[k] !== undefined ? c[k] : undefined), o)
const fields = [
  'home.heroTitle', 'home.eyebrow', 'home.builtTitle', 'home.featuredTitle', 'home.partnerTitle',
  'home.valuesTitle', 'home.processTitle', 'home.oemTitle', 'cta.explore',
  'oem.h1', 'oem.sub', 'oem.pr1t', 'oem.pr2t', 'oem.pr3t', 'oem.pr4t', 'oem.pr5t', 'oem.pr6t',
  'factory.h1', 'factory.ctaTitle', 'about.h1', 'contact.h1', 'quotePage.h1', 'clients.h1',
  'tdk.home.title', 'tdk.home.description',
  'tdk.about.title', 'tdk.about.description',
  'tdk.factory.title', 'tdk.factory.description',
  'tdk.oem.title', 'tdk.oem.description',
  'tdk.contact.title', 'tdk.contact.description',
  'tdk.colt.belts.title', 'tdk.colt.discs.title', 'tdk.colt.flap.title', 'tdk.colt.all.title',
  'tdk.product.title', 'tdk.product.description',
  'tdk.model.title', 'tdk.model.description',
  'tdk.disc.title', 'tdk.disc.description',
  'tdk.flap.title', 'tdk.flap.description'
]
for (const f of fs.readdirSync(dir).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  console.log('=== ' + f + ' ===')
  for (const p of fields) {
    const v = get(j, p)
    if (v === undefined) console.log(p + ' = <MISSING>')
    else console.log(p + ' = ' + JSON.stringify(v))
  }
}
