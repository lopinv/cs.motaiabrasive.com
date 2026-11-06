/**
 * Native-review helper for the machine-translated locales.
 *
 * Surfaces the places where a native reviewer should look hardest:
 *   1. TERMINOLOGY — per-locale blacklist of wrong/invented words
 *   2. ORTHOGRAPHY — simplified chars in zh-Hant, missing diacritics, etc.
 *   3. CONSISTENCY — same English source rendered with multiple terms
 *   4. ENGLISH_RESIDUE — values still identical to English
 *
 * Usage: node .zcode-check/review-locales.cjs [code ...]
 */
const fs = require('fs')
const path = require('path')

const I18N = path.join(__dirname, '..', 'src', 'i18n')
const en = JSON.parse(fs.readFileSync(path.join(I18N, 'en.json'), 'utf8'))

function flat(o, p = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) flat(v, np, out)
    else out[np] = v
  }
  return out
}
const enF = flat(en)

// Values that legitimately stay identical to English.
const KEEP_AS_IS = [
  '↗', 'MoTai Abrasives', 'MoTai', 'WhatsApp', 'OEM', 'PSA', 'FEPA', 'ANSI', 'ISO 848', 'MOQ', 'QC', 'B2B',
  'Google Analytics', 'gtag.js', 'motai-01@motaiabrasive.com', 'src/data/trust.json',
  'motaiabrasive.com', 'www.motaiabrasive.com', 'Hubei MoTai Abrasives Materials Co., Ltd.',
  'No. 88 Yuli Avenue' // factory address — proper noun, intentionally untranslated
]
const isKeepAsIs = (v) => KEEP_AS_IS.some((k) => v === k || v.includes(k))

// Per-locale wrong-term blacklist (from review rounds). [pattern, why, fix]
const TERMS = {
  cs: [
    ['brsn', 'chybí diakritika → brusný', 'brusný'],
    ['plechovk', 'plechovka = konzerva → flap', 'flap'],
    ['kotvy', 'kotva = anchor → kotouč', 'kotouč'],
    ['opělován', 'založené → odstraňování otřepů', 'odstraňování otřepů'],
    ['síto', 'síto = sieve → síťové', 'síťové'],
    ['ne-tekutelné', 'založené → netkané', 'netkané'],
    ['dřevoplastové', 'dřevoplast → dřevěné', 'dřevěné'],
    ['Vědění', 'archaické → Znalosti', 'Znalosti'],
    ['Odrizivost', 'nesprávné → Zrnitost', 'Zrnitost']
  ],
  sk: [
    ['Uvnittri', 'založené → Uvnitri', 'Uvnitri'],
    ['Súpte', 'neexistujúce → Prispôsobte', 'Prispôsobte'],
    ['tekutý plát', 'tekutý = liquid → tkaninový', 'tkaninový'],
    ['vyneľujúcich', 'neexistujúce → vyčnievajúcich', 'vyčnievajúcich'],
    ['nerezovky', 'založené → nerezovej oceli', 'nerezovej oceli'],
    ['na prezer', 'neexistujúce → na preskúmanie', 'na preskúmanie']
  ],
  pl: [
    ['niedbione', 'niedbione = neglected → z włókniny', 'z włókniny'],
    ['szlifierka nietkana', 'szlifierka = sander → tarcza typu flap', 'tarcza typu flap'],
    ['check-listy', 'transkrypcja → listy kontrolne', 'listy kontrolne'],
    ['Materiały ścierna', 'grammar → Materiały ścierne', 'Materiały ścierne']
  ],
  he: [
    ['ניצולת', 'coined → ליטוש', 'ליטוש'],
    ['ייצוב', 'installing → גימור', 'גימור'],
    ['חריטה', 'engraving → שיוף', 'שיוף'],
    ['זכוכית קהה', 'garbled → סיבי זכוכית', 'סיבי זכוכית'],
    ['פרוזדור', 'corridor → גוף רכב', 'גוף רכב'],
    ['רפידים', 'bullets → ריהוט', 'ריהוט'],
    ['קריט', 'not a term → צבע בסיס', 'צבע בסיס'],
    ['מותגי סופר', 'super brands → מותגים פרטיים', 'מותגים פרטיים'],
    ['אסיכה', 'collection → איסוף', 'איסוף'],
    ['תמריץ', 'incentive → תמחור', 'תמחור'],
    ['רצועות החלקה', 'smoothing → רצועות שחיקה', 'רצועות שחיקה'],
    ['דגימות', 'samples → מיסוך', 'מיסוך']
  ],
  tr: [
    ['kelepçe-tasma', 'uydurma → keklik kancası', 'keklik kancası'],
    ['zımparalanma', 'passive → zımpara', 'zımpara'],
    ['Oşanya', 'uydurma → Okyanusya', 'Okyanusya'],
    ['Otomotir', 'typo → Otomotiv', 'Otomotiv']
  ],
  fa: [
    ['گردو', 'walnut → بدون گرد و غبار', 'بدون گرد و غبار'],
    ['رسایی', 'coined → در دسترس بودن', 'در دسترس بودن'],
    ['تلاش مشخصات', 'effort → مشخصات و نیازهای', 'مشخصات و نیازهای'],
    ['راه‌گسیاری', 'wrong → در تماس باشید', 'در تماس باشید'],
    ['پُرکردن', 'filling → میل‌کردن', 'میل‌کردن'],
    ['تمیزی', 'cleanliness → صاف‌کاری', 'صاف‌کاری']
  ],
  th: [
    ['ตราสินค้าของคุณเอง', 'literal → แบรนด์ของคุณ', 'แบรนด์ของคุณ'],
    ['หูเบ่ย', 'typo → หูเป่ย', 'หูเป่ย'],
    ['เกานหนิง', 'typo → เซี่ยงหนิง', 'เซี่ยงหนิง'],
    ['สเปค', 'typo → สเปก', 'สเปก'],
    ['ความละเอียด', 'resolution → เกรต', 'เกรต'],
    ['จำนวนแพ็ค', 'แพ็ค → จำนวนบรรจุ', 'จำนวนบรรจุ']
  ],
  id: [['Finising', 'typo → Penyelesaian', 'Penyelesaian']],
  sv: [['slipeskiva', 'consistency → slipplatta', 'slipplatta']],
  da: [], no: [], fi: [], ms: [], vi: [], hi: [], 'zh-Hant': []
}

// High-confidence simplified-only characters — the traditional form differs.
// Shared 简繁 characters (款/況/首/全/高/里/面/…) are deliberately excluded.
const SIMPLIFIED_ONLY = '产单发让与说经时传体对业图阳决环坚备复农应听总则细织给销录镇闪闭项顺须预领颜额风饥饮马鸡门间号记识试词话调谈请课计证设访训议讲谢质贩贸货买卖国关'

let findings = 0
const codes = process.argv.slice(2)
const files = codes.length ? codes : fs.readdirSync(I18N).filter((f) => f.endsWith('.json') && f !== 'en.json').map((f) => f.replace('.json', ''))

for (const code of files) {
  const p = path.join(I18N, code + '.json')
  if (!fs.existsSync(p)) continue
  const F = flat(JSON.parse(fs.readFileSync(p, 'utf8')))
  const issues = []

  // 1) terminology
  for (const [pat, why, fix] of (TERMS[code] || [])) {
    const re = new RegExp(pat, 'g')
    const hits = Object.entries(F).filter(([, v]) => typeof v === 'string' && re.test(v))
    if (hits.length) issues.push(`TERM ${hits.length}x "${pat}" — ${why} → "${fix}" (e.g. ${hits[0][0]})`)
  }
  // 2) orthography
  if (code === 'zh-Hant') {
    const chars = [...SIMPLIFIED_ONLY]
    const hits = Object.entries(F).filter(([, v]) => typeof v === 'string' && chars.some((c) => v.includes(c)))
    if (hits.length) issues.push(`SCRIPT simplified chars in zh-Hant: ${hits.slice(0, 3).map(([k, v]) => k + ' (' + chars.filter((c) => v.includes(c)).join('') + ')').join('; ')}`)
  }
  // 3) consistency
  const bySource = {}
  for (const [k, v] of Object.entries(F)) {
    const src = enF[k]
    if (typeof src !== 'string' || typeof v !== 'string' || src.length < 12 || isKeepAsIs(v)) continue
    ;(bySource[src] ||= []).push([k, v])
  }
  const inconsistent = Object.entries(bySource).filter(([, vs]) => new Set(vs.map(([, v]) => v)).size > 1)
  if (inconsistent.length) {
    issues.push(`CONSISTENCY ${inconsistent.length} source string(s) with multiple renderings (e.g. "${inconsistent[0][1][0][0]}" vs "${inconsistent[0][1][1]?.[0]}")`)
  }
  // 4) English residue
  const residue = Object.entries(F).filter(([k, v]) => typeof v === 'string' && enF[k] === v && !isKeepAsIs(v) && /[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(v))
  if (residue.length) issues.push(`ENGLISH ${residue.length} value(s) still identical to English: ${residue.slice(0, 5).map(([k]) => k).join(', ')}`)

  findings += issues.length
  console.log(`\n### ${code} ${issues.length ? '(' + issues.length + ' findings)' : '(clean)'}`)
  for (const i of issues) console.log('  - ' + i)
}
console.log(`\n=== ${findings} finding(s) to review ===`)
