/**
 * Two i18n cleanups, both idempotent:
 *   1. Drop now-orphaned location keys `mapTitle` + `openInMaps` (the map
 *      iframe and its "Open in Google Maps" button were removed; LocationBlock
 *      now shows factory photo + address text only).
 *   2. Add the `quickBar` block (bottom quick-contact bar: label/whatsapp/quote)
 *      to every locale — machine-translated, pending native review.
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const LOCALES = ['en', 'zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

// quickBar copy per locale.
const QUICKBAR = {
  en: { label: 'Quick contact', whatsapp: 'WhatsApp', quote: 'Request a quote' },
  zh: { label: '快速联系', whatsapp: 'WhatsApp', quote: '请求报价' },
  de: { label: 'Schnellkontakt', whatsapp: 'WhatsApp', quote: 'Angebot anfordern' },
  es: { label: 'Contacto rápido', whatsapp: 'WhatsApp', quote: 'Solicitar presupuesto' },
  fr: { label: 'Contact rapide', whatsapp: 'WhatsApp', quote: 'Demander un devis' },
  it: { label: 'Contatto rapido', whatsapp: 'WhatsApp', quote: 'Richiedi un preventivo' },
  pt: { label: 'Contacto rápido', whatsapp: 'WhatsApp', quote: 'Pedir orçamento' },
  ru: { label: 'Быстрый контакт', whatsapp: 'WhatsApp', quote: 'Запросить расчёт' },
  ja: { label: 'お問い合わせ', whatsapp: 'WhatsApp', quote: '見積もりを依頼' },
  ko: { label: '빠른 문의', whatsapp: 'WhatsApp', quote: '견적 요청' },
  ar: { label: 'تواصل سريع', whatsapp: 'WhatsApp', quote: 'طلب عرض سعر' }
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)

  let changed = false

  // 1) strip orphaned location keys
  if (obj.location && ('mapTitle' in obj.location || 'openInMaps' in obj.location)) {
    delete obj.location.mapTitle
    delete obj.location.openInMaps
    changed = true
  }

  // 2) add quickBar if missing
  if (!obj.quickBar) {
    obj.quickBar = QUICKBAR[loc]
    changed = true
  }

  if (!changed) { console.log(`${loc}: up-to-date — skipped`); continue }

  const roundtrip = JSON.stringify(obj, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  fs.writeFileSync(p, roundtrip + tail, 'utf8')
  console.log(`${loc}: location slimmed to [${Object.keys(obj.location).join(',')}], quickBar=${obj.quickBar.label}`)
}
