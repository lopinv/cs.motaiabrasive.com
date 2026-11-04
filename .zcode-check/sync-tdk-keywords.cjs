/**
 * Sync the 5 expanded TDK keyword fields (home/about/colt.belts/colt.discs/
 * colt.all) into the 10 non-en locale files. Content is in
 * tdk.keywords-sync.json (machine translations of the en values). Idempotent:
 * a locale whose home keywords already equal the sync value is skipped.
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const SYNC = JSON.parse(fs.readFileSync(path.join(__dirname, 'tdk.keywords-sync.json'), 'utf8'))
const LOCALES = Object.keys(SYNC)

// target path inside tdk for each field key
const TARGETS = {
  home: ['home'],
  about: ['about'],
  belts: ['colt', 'belts'],
  discs: ['colt', 'discs'],
  all: ['colt', 'all']
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  const tdk = obj.tdk
  if (!tdk) throw new Error('no tdk block in ' + loc)

  // idempotence check on the home field
  if (tdk.home.keywords === SYNC[loc].home) { console.log(`${loc}: already synced — skipped`); continue }

  for (const [field, pathParts] of Object.entries(TARGETS)) {
    const tgt = pathParts.reduce((c, k) => (c ? c[k] : undefined), tdk)
    if (!tgt || !('keywords' in tgt)) throw new Error(`missing tdk target ${pathParts.join('.')} in ${loc}`)
    tgt.keywords = SYNC[loc][field]
  }

  const roundtrip = JSON.stringify(obj, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  if (roundtrip + tail !== raw) console.log(`${loc}: NOTE — re-serializing whole file`)
  fs.writeFileSync(p, roundtrip + tail, 'utf8')
  console.log(`${loc}: synced 5 keyword fields`)
}
