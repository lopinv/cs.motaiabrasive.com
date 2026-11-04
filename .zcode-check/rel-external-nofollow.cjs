/** One-off: convert external link rel to "noopener nofollow" (keep referer). */
const fs = require('fs')
const files = [
  'src/components/CtaBand.astro',
  'src/components/ProductCard.astro',
  'src/components/Footer.astro',
  'src/components/Header.astro',
  'src/components/FloatingContact.astro',
  'src/components/LocationBlock.astro',
  'src/components/pages/Home.astro',
  'src/pages/[lang]/contact.astro',
  'src/pages/[lang]/quote.astro',
  'src/pages/[lang]/disc/[key].astro',
  'src/pages/[lang]/flap/[key].astro',
  'src/pages/[lang]/model/[slug].astro',
  'src/pages/[lang]/products/[handle].astro'
]
let total = 0
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8')
  s = s.split('rel="noopener noreferrer"').join('rel="noopener nofollow"')
  // bare "noopener" are external motaiabrasive.com quote/sample links -> nofollow too.
  // The flap internal link (href={lu('/quote')}) is internal -> leave bare.
  if (!f.includes('flap')) s = s.split('rel="noopener"').join('rel="noopener nofollow"')
  fs.writeFileSync(f, s)
  const c = (s.match(/rel="noopener nofollow"/g) || []).length
  total += c
  console.log(f.padEnd(40), 'nofollow =', c)
}
console.log('TOTAL nofollow occurrences:', total)
