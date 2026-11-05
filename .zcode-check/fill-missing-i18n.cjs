/**
 * Backfill the 4 leaf keys that all 10 non-en locale files lack (they silently
 * fall back to English via deepMerge in src/lib/i18n.js):
 *   about.profileName / about.profileBody
 *   blogIndex.updatedLabel / blogIndex.governance
 * Machine-translated per locale (same "机翻 + 待母语审校" convention as the
 * rest of the non-en content). Idempotent: skips a locale that already has all
 * 4. New 13 locales get these keys from their payloads, so this only touches
 * the pre-existing 10 files.
 */
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'i18n')
const LOCALES = ['zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

const V = {
  zh: {
    profileName: '速览',
    profileBody: '位于湖北咸宁的涂附磨具制造商：三大产品线供应七大目标市场，磨粒覆盖 40 至 5000 目。',
    updatedLabel: '更新',
    governance: '指南由墨泰磨料技术团队撰写并审校；产品规格变更时会再次复核。'
  },
  de: {
    profileName: 'Auf einen Blick',
    profileBody: 'Hersteller von Beschichtungsschleifmitteln in Xianning, Hubei: drei Produktlinien, beliefert in sieben Zielregionen, Körnungsbereich von 40 bis 5000.',
    updatedLabel: 'Aktualisiert',
    governance: 'Die Leitfäden werden vom MoTai-Abrasives-Team verfasst und geprüft und erneut geprüft, wenn sich Produktspezifikationen ändern.'
  },
  es: {
    profileName: 'De un vistazo',
    profileBody: 'Fabricante de abrasivos de recubrimiento en Xianning, Hubei: tres líneas de producto que surten siete regiones de destino, con una cobertura de granos de 40 a 5000.',
    updatedLabel: 'Actualizado',
    governance: 'Las guías son redactadas y revisadas por el equipo técnico de MoTai Abrasives y se revisan de nuevo cuando cambian las especificaciones de producto.'
  },
  fr: {
    profileName: 'En bref',
    profileBody: "Fabricant d'abrasifs enrevêtus à Xianning, Hubei : trois gammes de produits livrées vers sept régions de destination, avec une granulométrie de 40 à 5000.",
    updatedLabel: 'Mis à jour',
    governance: "Les guides sont rédigés et relus par l'équipe technique MoTai Abrasives et re-examinés lorsque les spécifications des produits changent."
  },
  it: {
    profileName: 'In breve',
    profileBody: 'Produttore di abrasivi rivestiti a Xianning, Hubei: tre linee di prodotto fornite a sette regioni di destinazione, con granulometria da 40 a 5000.',
    updatedLabel: 'Aggiornato',
    governance: 'Le guide sono scritti e revisionati dal team tecnico MoTai Abrasives e riesaminati quando cambiano le specifiche dei prodotti.'
  },
  pt: {
    profileName: 'À vista',
    profileBody: 'Fabricante de abrasivos revestidos em Xianning, Hubei: três linhas de produto fornecidas para sete regiões de destino, com granulometria de 40 a 5000.',
    updatedLabel: 'Atualizado',
    governance: 'Os guias são escritos e revisados pela equipe técnica da MoTai Abrasives e revisados novamente quando as especificações dos produtos mudam.'
  },
  ru: {
    profileName: 'Обзор',
    profileBody: 'Производитель шлифовальных лент и абразивных дисков в Сианьине (пров. Хубэй): три продуктовые линии, поставки в семь регионов, диапазон крупности от 40 до 5000.',
    updatedLabel: 'Обновлено',
    governance: 'Руководства создаются и проверяются технической командой MoTai Abrasives и повторно проверяются при изменении спецификаций продуктов.'
  },
  ja: {
    profileName: '概要',
    profileBody: '湖北省咸寧にある被覆研削材メーカー：3つの製品ラインを7つの供給先地域に提供し、粒度は40〜5000まで対応。',
    updatedLabel: '最終更新',
    governance: 'ガイドは MoTai Abrasives の技術チームが作成・レビューし、製品の仕様変更時に再レビューされます。'
  },
  ko: {
    profileName: '한눈에 보기',
    profileBody: '후베이 성 선녕의 도포형 연마재 제조사: 3개 제품 라인이 7개 수급 지역을 공급하며, 입자 크기(그릿)는 40~5000을 커버합니다.',
    updatedLabel: '수정됨',
    governance: '가이드는 MoTai Abrasives 기술 팀이 작성하고 검토하며, 제품 사양이 변경될 때 재검토합니다.'
  },
  ar: {
    profileName: 'نظرة عامة',
    profileBody: 'مصنع مواد الكشط المطلية في شيانيانغ، خوبي: ثلاث خطوط منتجات تخدم سبع مناطق وجهة، وتغطية حبيبات من 40 إلى 5000.',
    updatedLabel: 'تم التحديث',
    governance: 'تُكتب الأدلة ويُراجعها فريق MoTai Abrasives التقني وتُراجَع مجددًا عند تغيّر مواصفات المنتج.'
  }
}

for (const loc of LOCALES) {
  const p = path.join(dir, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  const have = ['profileName', 'profileBody'].every((k) => obj.about?.[k]) &&
    ['updatedLabel', 'governance'].every((k) => obj.blogIndex?.[k])
  if (have) { console.log(`${loc}: already has all 4 — skipped`); continue }

  if (!obj.about) obj.about = {}
  if (!obj.blogIndex) obj.blogIndex = {}
  for (const k of ['profileName', 'profileBody']) if (!obj.about[k]) obj.about[k] = V[loc][k]
  for (const k of ['updatedLabel', 'governance']) if (!obj.blogIndex[k]) obj.blogIndex[k] = V[loc][k]

  const roundtrip = JSON.stringify(obj, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  fs.writeFileSync(p, roundtrip + tail, 'utf8')
  console.log(`${loc}: backfilled about.profileName/profileBody + blogIndex.updatedLabel/governance`)
}
