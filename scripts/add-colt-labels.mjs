import fs from 'fs'
import path from 'path'

const dir = 'D:/Code/shopify/motai-static/src/i18n'

const labels = {
  en: { belts: 'Abrasive Belts', discs: 'Sanding Discs', flap: 'Flap Discs', all: 'All Products' },
  zh: { belts: '砂带', discs: '砂纸片', flap: '百叶片', all: '全部产品' },
  es: { belts: 'Cintas abrasivas', discs: 'Discos de lijado', flap: 'Discos de aleta', all: 'Todos los productos' },
  de: { belts: 'Abrasivschleifbänder', discs: 'Schleifscheiben', flap: 'Flapscheiben', all: 'Alle Produkte' },
  fr: { belts: 'Courrois abrasifs', discs: 'Disques de ponçage', flap: 'Disques à ailettes', all: 'Tous les produits' },
  ar: { belts: 'أحزمة الصقل', discs: 'أقراص الصنفرة', flap: 'أقراص ذنبلية', all: 'كل المنتجات' },
  pt: { belts: 'Fitas abrasivas', discs: 'Discos de lixamento', flap: 'Discos de leque', all: 'Todos os produtos' },
  ru: { belts: 'Абразивные ленты', discs: 'Шлифовальные диски', flap: 'Лепестковые круги', all: 'Все товары' },
  it: { belts: 'Nastri abrasivi', discs: 'Dischi di levigatura', flap: 'Dischi a patta', all: 'Tutti i prodotti' },
  ja: { belts: '研ぎベルト', discs: 'サンディングディスク', flap: 'フラップディスク', all: '全製品' },
  ko: { belts: '연마 벨트', discs: '샌딩 디스크', flap: '플래피 디스크', all: '전체 제품' }
}

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')) continue
  const lang = f.replace('.json', '')
  const p = path.join(dir, f)
  const d = JSON.parse(fs.readFileSync(p, 'utf8'))
  const L = labels[lang]
  if (!L) {
    console.log('skip', lang, '(no labels)')
    continue
  }
  for (const key of ['belts', 'discs', 'flap', 'all']) {
    d.colt[key] = d.colt[key] && typeof d.colt[key] === 'object' ? d.colt[key] : {}
    d.colt[key].label = L[key]
  }
  fs.writeFileSync(p, JSON.stringify(d, null, 2))
  console.log('labelled', lang)
}
