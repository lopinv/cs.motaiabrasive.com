/**
 * Terminology correction pass for the machine-translated locale payloads.
 *
 * Each locale gets an explicit word-form map (not loose find/replace): the
 * MT output used wrong-meaning or non-existent industry words (Czech
 * "plechovky" = tin cans, Hebrew "ניצולת" = waste utilisation, Turkish
 * "kelepçe-tasma" = invented, Persian "گردو" = walnut) and dropped
 * diacritics (Czech "brsn" for "brusný"). Longest-form-first replacement
 * keeps inflections intact.
 *
 * Idempotent: re-running finds nothing left to replace.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, 'locales-v2')

// locale -> [ [from, to], ... ]  (applied longest-from-first)
const FIX = {
  cs: [
    // sanding disc family (kotvy = anchors -> kotouče)
    ['kotoučeů', 'kotoučů'], ['kotoučeami', 'kotouči'], ['kotoučích', 'kotoučů'],
    ['kotouče', 'kotouče'], ['kotouč', 'kotouč'],
    // flap disc family (plechovky = tin cans -> flapy)
    ['plechovek', 'flapů'], ['plechovkám', 'flapům'], ['plechovkách', 'flapů'],
    ['plechovky', 'flapy'], ['plechovce', 'flapy'], ['plechovku', 'flap'], ['plechovka', 'flap'],
    ['brusných plechovek', 'brusných flapů'], ['brusné plechovky', 'brusné flapy'],
    // "brsn*" -> "brusn*" (missing ú)
    ['brsn', 'brusn'],
    // mesh = síťové (síto = sieve)
    ['síťové a bezdírové', 'síťové a bezdírové'], ['a síto', 'a síťové'], ['síto a', 'síťové a'],
    ['brusné síto kotouče', 'brusné síťové kotouče'], ['síťové kotouče', 'síťové kotouče'],
    // "pásovou broušení" (broken genitive) -> "pásy"
    ['široké pásovou broušení', 'široké pásy'], ['průmyslové pásovou broušení', 'průmyslové pásy'],
    ['pásovou broušení', 'pásy'], ['dřevoplastové pásovou broušení', 'dřevěné pásy'],
    ['kovové pásovou broušení', 'kovové pásy'],
    // deburring = odstraňování otřepů (opělování is not a word)
    ['opělování a broušení', 'odstraňování otřepů a broušení'], ['opělování kovu', 'odstraňování otřepů'],
    ['a opělování', 'a odstraňování otřepů'], ['opělování', 'odstraňování otřepů'],
    // rust = rez (kůry = bark)
    ['odstranění kůry', 'odstranění rzi'], ['kůry', 'rzi'],
    // match = Přizpůsobte (Skladejte = compose music)
    ['Skladejte', 'Přizpůsobte'],
    // non-woven = netkané
    ['ne-tekutelné', 'netkané'],
    // wood = dřevěné
    ['dřevoplastové', 'dřevěné'],
    // garbled "hotové kovalné nerezové"
    ['hotové kovalné nerezové', 'broušení nerezové oceli'],
    ['hotové broušení plechovými', 'koncové broušení kotouči'],
    ['plechovými kotoučeami', 'kotouči'],
    // knowledge = Znalosti
    ['Vědění', 'Znalosti'],
    // grit = zrnitost
    ['Odrizivost', 'Zrnitost'],
    // truncated words
    ['úlož,', 'úložiště,'], ['vlastnictv', 'vlastnictví'],
    // diamond = diamant (křemík = quartz)
    ['cirkon a křemík', 'cirkon a diamant'], ['z cirkoniu a křemíku', 'z cirkoniu a diamantu'],
    ['flapy z křemíku', 'flapy z diamantu']
  ],
  sk: [
    ['Uvnittri', 'Uvnitri'],
    ['Súpte', 'Prispôsobte'],
    ['tekutý plát', 'tkaninový plát'],
    ['vyneľujúcich', 'vyčnievajúcich'],
    ['nerezovky', 'nerezovej oceli'],
    ['na prezer', 'na preskúmanie'],
    ['Základné zásady', 'Zásady'],
    ['v pásov, kotúčov', 'v pásoch, kotúčoch']
  ],
  pl: [
    ['Materiały ścierna', 'Materiały ścierne'],
    ['niedbione', 'z włókniny'],
    ['szlifierka nietkana', 'tarcza typu flap z włókniny'],
    ['paski ścierny', 'pasek ścierny'],
    ['check-listy', 'listy kontrolne'],
    ['cyrkonowa', 'z cyrkonii'],
    ['karbid krzemu', 'z karbidu krzemu']
  ],
  he: [
    ['זכוכית קהה', 'סיבי זכוכית'],
    ['פרוזדור', 'גוף רכב'],
    ['רפידים', 'ריהוט'],
    ['קריט', 'צבע בסיס'],
    ['מותגי סופר', 'מותגים פרטיים'],
    ['ניצולת', 'ליטוש'],
    ['ייצוב', 'גימור'],
    ['MoTai Knowledge', 'ידע MoTai'],
    ['אסיכה', 'איסוף'],
    ['תמריץ', 'תמחור'],
    ['רצועות החלקה', 'רצועות שחיקה'],
    ['דיסקי חריטה', 'דיסקי שיוף'],
    ['דיסקים לחריטה', 'דיסקים לשיוף'],
    ['חריטת גוף', 'שיוף גוף'],
    ['חריטיית גוף', 'שיוף גוף'],
    ['חריטה של צבע', 'שיוף צבע'],
    ['חריטיה של גוף', 'שיוף גוף'],
    ['חריטיית צבע', 'שיוף צבע'],
    ['דגימות וייצוב', 'מיסוך וגימור'],
    ['לניצולת, דגימות', 'לליטוש, למיסוך'],
    ['לניצולת', 'לליטוש'],
    ['לייצוב', 'לגימור'],
    ['ייצוב מתכות', 'גימור מתכות'],
    ['ייצוב פלדה', 'גימור פלדה'],
    ['בייצוב', 'בגימור'],
    ['וייצוב', 'וגימור']
  ],
  tr: [
    ['Otomotir', 'Otomotiv'],
    ['kelepçe-tasma', 'keklik kancası'],
    ['zımparalanma bantları', 'zımpara bantları'],
    ['zımparalanma', 'zımpara'],
    ['Oşanya', 'Okyanusya'],
    ['MoTai Knowledge', 'MoTai Bilgi'],
    ['yaprakları', 'levhaları'],
    ['delik zımpara diskleri', 'delikli zımpara diskleri']
  ],
  fa: [
    ['بدون گردو', 'بدون گرد و غبار'],
    ['رسایی', 'در دسترس بودن'],
    ['تلاش مشخصات', 'مشخصات و نیازهای'],
    ['راه‌گسیاری ما', 'در تماس باشید'],
    ['پُرکردن', 'میل‌کردن'],
    ['سایندهسنگین', 'ساینده سنگین'],
    ['سایشسنگین', 'سایش سنگین']
  ],
  sv: [['slipeskiva', 'slipplatta']],
  da: [['MoTai Knowledge', 'MoTai Viden']],
  no: [['MoTai Knowledge', 'MoTai Kunnskap']],
  fi: [['MoTai Knowledge', 'MoTai Tietoa']],
  th: [['MoTai Knowledge', 'MoTai ความรู้']],
  vi: [['MoTai Knowledge', 'MoTai Kiến thức']],
  id: [['MoTai Knowledge', 'MoTai Pengetahuan']],
  ms: [['MoTai Knowledge', 'MoTai Pengetahuan']],
  hi: [['MoTai Knowledge', 'MoTai ज्ञान']],
  'zh-Hant': [['MoTai Knowledge', 'MoTai 知識']]
}

// "finishing" in Persian: تمیزی (cleanliness) -> صاف‌کاری
const FA_FINISH = ['تمیزی فلزات', 'تمیزی فلز', 'تمیزی سطح', 'تمیزی و', 'و تمیزی', 'تمیزی.']

let changed = 0
for (const [loc, pairs] of Object.entries(FIX)) {
  const p = path.join(DIR, loc + '.json')
  if (!fs.existsSync(p)) { console.log(loc + ': payload missing'); continue }
  const obj = JSON.parse(fs.readFileSync(p, 'utf8'))
  let hits = 0
  // Count and replace against the CURRENT object state (not the raw text), so
  // chained fixes (e.g. "brusné plechovky" -> "brusné flapy") compose.
  const apply = (pairs) => {
    for (const [from, to] of [...pairs].sort((a, b) => b[0].length - a[0].length)) {
      if (from === to) continue
      const walk = (o) => {
        for (const k of Object.keys(o)) {
          if (typeof o[k] === 'string') {
            if (o[k].includes(from)) {
              const n = o[k].split(from).length - 1
              o[k] = o[k].split(from).join(to)
              hits += n
            }
          } else if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) walk(o[k])
          else if (Array.isArray(o[k])) o[k] = o[k].map((v) => (typeof v === 'string' ? v.split(from).join(to) : v))
        }
      }
      walk(obj)
    }
  }
  apply(pairs)
  if (loc === 'fa') apply(FA_FINISH.map((x) => [x, x.replace('تمیزی', 'صاف‌کاری')]))
  if (hits) {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8')
    console.log(`${loc}: ${hits} replacement(s) applied`)
    changed += hits
  } else console.log(`${loc}: clean`)
}
console.log(`\n${changed} replacement(s) total`)
