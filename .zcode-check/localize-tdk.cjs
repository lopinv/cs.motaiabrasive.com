/**
 * Replace the whole "tdk" block in the 10 non-en i18n files with machine
 * translations of the new en tdk shape (adds tdk.application.<6 slugs> which
 * the old blocks lacked — those pages currently inherit EN via deepMerge).
 * Content lives in tdk.latin1.json (de/es/fr/it/pt/ru) + tdk.cjk.json
 * (ar/zh/ja/ko); non-en values are machine translations, pending native
 * review. Idempotent: a locale already carrying tdk.application is skipped.
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const T1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'tdk.latin1.json'), 'utf8'))
const T2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'tdk.latin2.json'), 'utf8'))
const T3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'tdk.cjk.json'), 'utf8'))
const TDK = { ...T1, ...T2, ...T3 }
const LOCALES = ['zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

// Shape guard: every block must carry the application sub-block.
for (const loc of LOCALES) {
  if (!TDK[loc]?.application || Object.keys(TDK[loc].application).length !== 6) {
    throw new Error('tdk block for ' + loc + ' missing tdk.application with 6 slugs')
  }
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  // Idempotent by default; a locale name passed as a CLI arg forces re-apply
  // (used after correcting the machine-translation content in a data file).
  const force = process.argv.includes(loc)
  if (obj.tdk?.application && !force) { console.log(`${loc}: already new-shape tdk — skipped`); continue }

  // Format precheck: round-trip must be byte-stable so the diff is the tdk
  // block only. (Same convention as add-floatchat-i18n.cjs.)
  const roundtrip = JSON.stringify(obj, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  if (roundtrip + tail !== raw) console.log(`${loc}: NOTE — re-serializing whole file (round-trip differs)`)

  obj.tdk = TDK[loc] // tdk is the last top-level key in these files; position preserved
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + tail, 'utf8')
  console.log(`${loc}: replaced tdk block (+ application, 6 slugs)${force ? ' [forced]' : ''}`)
}
