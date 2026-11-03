/** One-off: add nav.language label to all 11 i18n files (idempotent). */
const fs = require('fs')
const val = {
  en: 'Language',
  zh: '语言',
  de: 'Sprache',
  fr: 'Langue',
  es: 'Idioma',
  it: 'Lingua',
  pt: 'Idioma',
  ru: 'Язык',
  ja: '言語',
  ko: '언어',
  ar: 'اللغة'
}
for (const [l, v] of Object.entries(val)) {
  const p = 'src/i18n/' + l + '.json'
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (j.nav?.language) { console.log('skip', l); continue }
  // insert `language` as the first nav key (matches nav bar order)
  j.nav = { language: v, ...j.nav }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf8')
  const back = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (!back.nav.language) throw new Error('language key missing after write: ' + l)
  console.log('added', l, '->', back.nav.language)
}
