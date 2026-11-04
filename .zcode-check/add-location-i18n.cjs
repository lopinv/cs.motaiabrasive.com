/**
 * Insert a "location" i18n block (factory photo caption + map labels) right
 * after the "floatChat" block in all 11 locale files. Idempotent: skips a
 * locale that already has it. Non-en values are machine translations,
 * pending native review (same convention as the other non-en blocks).
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const LOCALES = ['en', 'zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

const BLOCKS = {
  en: {
    imgAlt: 'MoTai factory building in Xianning, Hubei',
    imgCaption: 'MoTai factory — Xianning, Hubei, China',
    mapTitle: 'MoTai factory location on Google Maps',
    openInMaps: 'Open in Google Maps'
  },
  zh: {
    imgAlt: '湖北咸宁的墨泰工厂建筑',
    imgCaption: '墨泰工厂 —— 中国湖北咸宁',
    mapTitle: '墨泰工厂在 Google 地图上的位置',
    openInMaps: '在 Google 地图中打开'
  },
  de: {
    imgAlt: 'MoTai-Fabrikgebäude in Xianning, Hubei',
    imgCaption: 'MoTai-Werk — Xianning, Hubei, China',
    mapTitle: 'Standort des MoTai-Werks in Google Maps',
    openInMaps: 'In Google Maps öffnen'
  },
  es: {
    imgAlt: 'Edificio de la fábrica MoTai en Xianning, Hubei',
    imgCaption: 'Fábrica MoTai — Xianning, Hubei, China',
    mapTitle: 'Ubicación de la fábrica MoTai en Google Maps',
    openInMaps: 'Abrir en Google Maps'
  },
  fr: {
    imgAlt: 'Bâtiment de l\'usine MoTai à Xianning, Hubei',
    imgCaption: 'Usine MoTai — Xianning, Hubei, Chine',
    mapTitle: 'Localisation de l\'usine MoTai sur Google Maps',
    openInMaps: 'Ouvrir dans Google Maps'
  },
  it: {
    imgAlt: 'Edificio della fabbrica MoTai a Xianning, Hubei',
    imgCaption: 'Fabbrica MoTai — Xianning, Hubei, Cina',
    mapTitle: 'Posizione della fabbrica MoTai su Google Maps',
    openInMaps: 'Apri su Google Maps'
  },
  pt: {
    imgAlt: 'Edifício da fábrica MoTai em Xianning, Hubei',
    imgCaption: 'Fábrica MoTai — Xianning, Hubei, China',
    mapTitle: 'Localização da fábrica MoTai no Google Maps',
    openInMaps: 'Abrir no Google Maps'
  },
  ru: {
    imgAlt: 'Здание завода MoTai в Сианьне, провинция Хубэй',
    imgCaption: 'Завод MoTai — Сианьнь, Хубэй, Китай',
    mapTitle: 'Местоположение завода MoTai на Google Maps',
    openInMaps: 'Открыть в Google Maps'
  },
  ja: {
    imgAlt: '湖北省咸寧市のMoTai工場建物',
    imgCaption: 'MoTai工場——湖北省咸寧市、中国',
    mapTitle: 'Googleマップ上のMoTai工場所在地',
    openInMaps: 'Googleマップで開く'
  },
  ko: {
    imgAlt: '후베이성 선닝의 MoTai 공장 건물',
    imgCaption: 'MoTai 공장 — 후베이성 선닝, 중국',
    mapTitle: 'Google 지도의 MoTai 공장 위치',
    openInMaps: 'Google 지도에서 열기'
  },
  ar: {
    imgAlt: 'مبنى مصنع MoTai في شيانينغ، هوبي',
    imgCaption: 'مصنع MoTai — شيانينغ، هوبي، الصين',
    mapTitle: 'موقع مصنع MoTai على خرائط جوجل',
    openInMaps: 'فتح في خرائط جوجل'
  }
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  if (obj.location) { console.log(`${loc}: already has location — skipped`); continue }
  const next = {}
  for (const [k, v] of Object.entries(obj)) {
    next[k] = v
    if (k === 'floatChat') next.location = BLOCKS[loc]
  }
  if (!('location' in next)) throw new '"floatChat" anchor key missing in ' + loc
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8')
  console.log(`${loc}: inserted location block`)
}
