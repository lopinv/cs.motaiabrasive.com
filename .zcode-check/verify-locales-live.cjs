/**
 * Live verification of all locale sub-sites: every locale must serve a page
 * with a localized <title> and the full alternate-link set (27 locales + the
 * two regional variants es-MX/pt-BR + x-default = 30).
 *
 * Usage: node .zcode-check/verify-locales-live.cjs [baseUrl]
 */
const https = require('https')

const BASE = process.argv[2] || 'https://cs.motaiabrasive.com'
const LANGS = ['en', 'zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar', 'hi', 'zh-Hant', 'sv', 'da', 'no', 'fi', 'th', 'vi', 'id', 'ms', 'pl', 'cs', 'sk', 'he', 'tr', 'fa']

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = ''
      res.on('data', (c) => { d += c })
      res.on('end', () => resolve(d))
    }).on('error', (e) => resolve('ERR ' + e.message))
  })
}

;(async () => {
  let ok = 0
  const problems = []
  for (const L of LANGS) {
    const h = await get(`${BASE}/${L}/`)
    if (h.startsWith('ERR')) { problems.push(`${L}: ${h}`); continue }
    const title = (h.match(/<title>([^<]+)/) || [])[1] || ''
    const alt = (h.match(/rel="alternate"/g) || []).length
    const dir = (h.match(/dir="(rtl|ltr)"/) || [])[1] || '?'
    // the English title must NOT appear in a non-English locale
    const isEnglish = title === 'Abrasive Manufacturer & Industrial Abrasive Supplier | MoTai'
    if (alt === 30 && !isEnglish) ok++
    else problems.push(`${L}: alt=${alt} dir=${dir} englishTitle=${isEnglish} title=${title.slice(0, 40)}`)
  }
  console.log(`locales OK (30 alternate links + localized title): ${ok}/${LANGS.length}`)
  if (problems.length) console.log('PROBLEMS:\n' + problems.join('\n'))
  const sm = await get(`${BASE}/sitemap.xml`)
  console.log('sitemap urls:', (sm.match(/<loc>/g) || []).length)
  process.exit(ok === LANGS.length ? 0 : 1)
})()
