/**
 * Trailing-slash convention audit (run after `npm run build`):
 * canonicals, hreflang, JSON-LD URLs, sitemap and feed links must all be
 * directory-style (<dir>/), root / excepted. Exits 1 on any no-slash leak.
 */
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(dist, 'dist', rel), 'utf8')
let failures = 0
const fail = (msg) => { failures++; console.log('  FAIL ' + msg) }

/** True when u is an absolute locale URL (https://host/en/..., /zh-Hant/...) that lacks a trailing slash. */
function isLeak(u) {
  const p = u.replace(/^https:\/\/[^/]+/, '')
  const first = p.slice(1).split('/')[0]
  if (!/^[a-z]{2}(-[A-Za-z]+)?$/.test(first)) return false // root or asset (products.csv, sitemap.xml, ...)
  return !u.endsWith('/')
}

function audit(name, text, urlRegex) {
  const leaks = [...text.matchAll(urlRegex)].map((m) => m[1]).filter(isLeak)
  if (leaks.length) fail(`${name}: ${leaks.length} no-slash locale URL(s), e.g. ${leaks.slice(0, 3).join(' | ')}`)
  else console.log(`  ok   ${name}`)
}

// Host is read from the product page's canonical so the audit stays valid
// when the build is published under a custom SITE_URL domain.
const prod0 = read('en/products/533x75-abrasive-belt/index.html')
const host = prod0.match(/<link rel="canonical" href="https:\/\/([^/]+)/)[1]
// [a-z]{2}(-[A-Za-z]+)? admits hyphenated route codes like zh-Hant.
const urlPat = () => new RegExp(`"(https://${host.replace(/\./g, '\\.')}/[a-z]{2}(-[A-Za-z]+)?[^"]*)"`, 'g')

console.log('=== canonical / hreflang / JSON-LD (en product page) ===')
const prod = prod0
const canon = prod.match(/<link rel="canonical" href="([^"]+)"/)[1]
console.log('  canonical: ' + canon)
if (!canon.endsWith('/')) fail('canonical not trailing-slash')
const hlEn = prod.match(/hreflang="en" href="([^"]+)"/)[1]
console.log('  hreflang en: ' + hlEn)
if (!hlEn.endsWith('/')) fail('hreflang en not trailing-slash')
audit('JSON-LD', prod, urlPat())

console.log('=== collection page ItemList ===')
const col = read('en/collections/all/index.html')
audit('en/collections/all', col, urlPat())

console.log('=== sitemap.xml ===')
const sm = read('sitemap.xml')
audit('sitemap', sm, new RegExp(`<loc>(https://${host.replace(/\./g, '\\.')}/[a-z]{2}(-[A-Za-z]+)?[^<]*)</loc>`, 'g'))
const smCount = (sm.match(/<loc>/g) || []).length
console.log(`  total sitemap urls: ${smCount}`)

console.log('=== sitemap.txt ===')
const st = read('sitemap.txt')
audit('sitemap.txt', st, new RegExp(`^https://${host.replace(/\./g, '\\.')}/[a-z]{2}(-[A-Za-z]+)?.+$`, 'gm'))
const stLines = st.split(/\r?\n/).filter(Boolean).length
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort()
const stUrlsSorted = st.split(/\r?\n/).filter(Boolean).map((l) => l.trim()).sort()
if (stLines !== smCount) fail(`sitemap.txt has ${stLines} URLs but sitemap.xml has ${smCount}`)
else if (JSON.stringify(smUrls) !== JSON.stringify(stUrlsSorted)) fail('sitemap.txt URL set differs from sitemap.xml')
else console.log(`  ok   sitemap.txt (${stLines} URLs, identical to sitemap.xml)`)

console.log('=== feed products.csv ===')
const csv = read('products.csv')
audit('feed links', csv, urlPat())

console.log('=== _redirects ===')
const rd = read('_redirects').split(/\r?\n/).filter((l) => l && !l.startsWith('#'))
const rdLeak = rd.filter((l) => {
  const parts = l.trim().split(/\s+/)
  return parts[2] === '301' && !parts[1].endsWith('/')
})
if (rdLeak.length) fail(`_redirects: ${rdLeak.length} 301 target(s) without trailing slash, e.g. ${rdLeak[0]}`)
else console.log(`  ok   _redirects (${rd.length} rules)` + (rdLeak.length ? '' : ' — all 301 targets slash-terminated'))

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL OK')
process.exit(failures ? 1 : 0)
