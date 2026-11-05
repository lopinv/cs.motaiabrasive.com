/**
 * Add an "article.tocTitle" key (long-form table-of-contents label) to all
 * 11 locale files. Machine-translated for non-en, pending native review.
 * Idempotent: skips a locale that already has article.tocTitle.
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const LOCALES = ['en', 'zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

const TOC = {
  en: 'On this page',
  zh: '本页目录',
  de: 'Auf dieser Seite',
  es: 'En esta página',
  fr: 'Sur cette page',
  it: 'In questa pagina',
  pt: 'Nesta página',
  ru: 'На этой странице',
  ja: 'この記事の目次',
  ko: '이 페이지에서',
  ar: 'في هذه الصفحة'
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  if (!obj.article) throw new Error('no article block in ' + loc)
  if (obj.article.tocTitle) { console.log(`${loc}: already has article.tocTitle — skipped`); continue }

  // Insert as the last key of the article object, preserving key order.
  const nextArticle = { ...obj.article }
  nextArticle.tocTitle = TOC[loc]
  const next = {}
  for (const [k, v] of Object.entries(obj)) {
    next[k] = k === 'article' ? nextArticle : v
  }
  const roundtrip = JSON.stringify(next, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  fs.writeFileSync(p, roundtrip + tail, 'utf8')
  console.log(`${loc}: added article.tocTitle`)
}
