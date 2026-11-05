/**
 * Restore the "location.mapTitle" key (Google Maps iframe title) in all 11
 * locale files. It was removed in commit 25bc386 when the map embed was
 * stripped, then re-added when the iframe came back. Values are the original
 * translations recovered from git history (25bc386^). Idempotent: skips a
 * locale that already has location.mapTitle.
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const LOCALES = ['en', 'zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

const MAPTITLE = {
  en: 'MoTai factory location on Google Maps',
  zh: '墨泰工厂在 Google 地图上的位置',
  de: 'Standort des MoTai-Werks in Google Maps',
  es: 'Ubicación de la fábrica MoTai en Google Maps',
  fr: "Localisation de l'usine MoTai sur Google Maps",
  it: 'Posizione della fabbrica MoTai su Google Maps',
  pt: 'Localização da fábrica MoTai no Google Maps',
  ru: 'Местоположение завода MoTai на Google Maps',
  ja: 'Googleマップ上のMoTai工場所在地',
  ko: 'Google 지도의 MoTai 공장 위치',
  ar: 'موقع مصنع MoTai على خرائط جوجل'
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  if (!obj.location) obj.location = {}
  if (obj.location.mapTitle) { console.log(`${loc}: already has location.mapTitle — skipped`); continue }

  // Insert mapTitle right after imgCaption to keep a stable order.
  const next = {}
  for (const [k, v] of Object.entries(obj)) {
    next[k] = v
    if (k === 'location') next.location = { imgAlt: v.imgAlt, imgCaption: v.imgCaption, mapTitle: MAPTITLE[loc] }
  }
  if (!(next.location && next.location.mapTitle)) next.location.mapTitle = MAPTITLE[loc]

  const roundtrip = JSON.stringify(next, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  fs.writeFileSync(p, roundtrip + tail, 'utf8')
  console.log(`${loc}: restored location.mapTitle`)
}
