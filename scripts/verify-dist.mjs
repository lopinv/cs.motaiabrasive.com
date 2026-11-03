import fs from 'fs'

const base = 'D:/Code/shopify/motai-static/dist'

function check(file, label) {
  const h = fs.readFileSync(`${base}/${file}`, 'utf8')
  const grab = (re) => {
    const m = h.match(re)
    return m ? m[0].slice(0, 240) : 'NOT FOUND'
  }
  console.log('===', label, '(' + file + ')')
  console.log('  TITLE   :', grab(/<title>.*?<\/title>/).replace(/\n/g, ' '))
  console.log('  DESC    :', grab(/<meta name="description"[^>]*>/).slice(0, 160))
  console.log('  CANON   :', grab(/<link rel="canonical"[^>]*>/).slice(0, 120))
  console.log('  HREFLANG ar:', grab(/hreflang="ar"[^>]*>/).slice(0, 100))
  console.log('  X-DEFAULT:', grab(/hreflang="x-default"[^>]*>/).slice(0, 100))
  console.log('  OG-TITLE:', grab(/property="og:title"[^>]*>/).slice(0, 120))
  console.log('  OG-IMG  :', grab(/property="og:image"[^>]*>/).slice(0, 160))
  console.log('  WA      :', (h.match(/https:\/\/wa\.me\/8618118635597\?text=[^"&]+/) ?? ['NOT FOUND'])[0].slice(0, 160))
  console.log('  QUOTE   :', (h.match(/https:\/\/www\.motaiabrasive\.com\/collections\/all\?view=[^"&]*(&[^"<>]+)?/) ?? ['NOT FOUND'])[0].slice(0, 160))
  const ld = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []
  const types = ld.map((x) => {
    try {
      const o = JSON.parse(x.replace(/<script type="application\/ld\+json">|<\/script>/g, ''))
      return o['@type'] || 'MIXED'
    } catch {
      return 'PARSE_FAIL'
    }
  })
  console.log('  JSON-LD :', types.join(' + '))
  const imgs = h.match(/cdn\.shopify\.com|motaiabrasive\.com\/cdn[^"'\s]*webp/g) || []
  console.log('  REMOTE IMG:', imgs.length, 'tags,', imgs[0] ?? '')
}

check('en/index.html', 'EN home')
check('zh/index.html', 'ZH home')
check('ar/index.html', 'AR home (RTL)')
check('en/products/533x75-abrasive-belt/index.html', 'EN product')
check('en/model/y399/index.html', 'EN model')
check('en/disc/gold8/index.html', 'EN disc variant')
check('en/flap/fiberglass/index.html', 'EN flap')
check('en/collections/abrasive-belts/index.html', 'EN collection')
check('en/blog/grit-standards-fepa-ansi/index.html', 'EN blog article')
check('en/quote/index.html', 'EN quote page')
check('en/glossary/index.html', 'EN glossary')
check('ar/factory/index.html', 'AR factory (RTL page)')

// dir=rtl check
const ar = fs.readFileSync(`${base}/ar/index.html`, 'utf8')
console.log('AR html dir=', (ar.match(/<html[^>]*>/) ?? [''])[0])
const en = fs.readFileSync(`${base}/en/index.html`, 'utf8')
console.log('EN html dir=', (en.match(/<html[^>]*>/) ?? [''])[0])
console.log('404 file:', fs.existsSync(`${base}/404.html`))
console.log('_redirects:', fs.existsSync(`${base}/_redirects`) ? 'copied' : 'MISSING')
