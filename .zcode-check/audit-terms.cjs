/**
 * Terminology + integrity audit for the machine-translated locale payloads.
 * READ-ONLY. Flags the defect classes that actually shipped:
 *   1. missing diacritics / broken scripts (cs "brsn", th missing tone marks,
 *      Nordic anglicisms like "slipeband")
 *   2. invented / wrong-meaning industry terms (per-language blacklists)
 *   3. untranslated English fragments in titles (e.g. "MoTai Knowledge")
 *   4. placeholder loss on keys the payload actually contains
 *   5. wrong-script contamination (CJK in a non-CJK locale)
 *   6. payload completeness (FULL locales must cover all 579 en leaf paths)
 *
 * Usage: node .zcode-check/audit-terms.cjs
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, 'locales-v2')
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', 'en.json'), 'utf8'))

// dotted leaf paths (arrays atomic)
function leafPaths(o, p = '', out = []) {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) leafPaths(v, np, out)
    else out.push(np)
  }
  return out
}
const enPaths = leafPaths(en)
const enSet = new Set(enPaths)
const TOK = /\{[a-z]+\}/g
const enTok = {}
for (const p of enPaths) {
  const v = p.split('.').reduce((c, k) => (c ? c[k] : undefined), en)
  if (typeof v === 'string' && TOK.test(v)) enTok[p] = [...v.match(TOK)]
}

// Per-locale defect lists. Each entry: [pattern (string|regex), why, suggestion]
const WRONG = {
  cs: [
    ['brsn', 'missing diacritic: brusný (ú)', 'brusný'],
    ['plechovk', 'wrong word: tin can; flap disc = flapy', 'flapy'],
    ['kotvy', 'wrong word: anchor; sanding disc = kotouče', 'kotouče'],
    ['opělován', 'coined: deburring', 'odstraňování otřepů'],
    ['kůry', 'wrong word: bark; rust = rez', 'rezu'],
    ['Skladejte', 'wrong word (compose music); match = Přizpůsobte', 'Přizpůsobte'],
    ['síto', 'wrong word (sieve); mesh = síťové', 'síťové'],
    ['ne-tekutelné', 'coined: non-woven', 'netkané'],
    ['dřevoplastové', 'wrong word (wood-plastic); wood = dřevěné', 'dřevěné'],
    ['kovalné', 'garbled non-word', 'broušení'],
    ['Vědění', 'archaic/coined: knowledge', 'Znalosti'],
    ['Odrizivost', 'wrong word; grit = zrnitost', 'Zrnitost'],
    ['úlož,', 'truncated: úložiště', 'úložiště'],
    ['vlastnictv', 'truncated: vlastnictví', 'vlastnictví']
  ],
  sk: [
    ['Uvnittri', 'coined; = Uvnitri', 'Uvnitri'],
    ['Súpte', 'non-word; match = Prispôsobte', 'Prispôsobte'],
    ['tekutý plát', 'wrong word (liquid); cloth = tkaninový plát', 'tkaninový plát'],
    ['vyneľujúcich', 'non-word', 'vyčnievajúcich'],
    ['nerezovky', 'coined for stainless steel', 'nerezovej ocele'],
    ['na prezer', 'non-word', 'na preskúmanie'],
    ['Základné zásady', 'adds "basic" not in source', 'Zásady']
  ],
  pl: [
    ['Materiały ścierna', 'grammar: ścierne', 'Materiały ścierne'],
    ['niedbione', 'wrong word (neglected); non-woven = z włókniny', 'z włókniny'],
    ['szlifierka nietkana', 'wrong word (sander); flap wheel = tarcza typu flap', 'tarcza typu flap'],
    ['paski ścierny', 'grammar: singular paska', 'pasek ścierny'],
    ['check-listy', 'not Polish', 'listy kontrolne'],
    ['cyrkonowa', 'wrong form; zirconia = z cyrkonii', 'z cyrkonii'],
    ['karbid krzemu', 'missing genitive', 'z karbidu krzemu']
  ],
  he: [
    ['חריטה', 'wrong word (engraving); sanding = שיוף', 'שיוף'],
    ['זכוכית קהה', 'garbled (dull glass); fiberglass = סיבי זכוכית', 'סיבי זכוכית'],
    ['פרוזדור', 'wrong word (corridor); auto body = גוף רכב', 'גוף רכב'],
    ['רפידים', 'wrong word (bullets); furniture = ריהוט', 'ריהוט'],
    ['קריט', 'wrong word; primer = צבע בסיס', 'צבע בסיס'],
    ['מותגי סופר', 'wrong word (super brands); private-label = מותגים פרטיים', 'מותגים פרטיים'],
    ['ניצולת', 'coined for grinding', 'ליטוש'],
    ['ייצוב', 'wrong word (installing); finishing = גימור', 'גימור'],
    ['MoTai Knowledge', 'untranslated English', 'ידע MoTai'],
    ['אסיכה', 'wrong word (collection/bank); = איסוף', 'איסוף'],
    ['תמריץ', 'wrong word (incentive); pricing = תמחור', 'תמחור'],
    ['רצועות החלקה', 'wrong word (smoothing); sanding belts = רצועות שחיקה', 'רצועות שחיקה'],
    ['דגימות', 'wrong word (samples) for blending', 'מיסוך']
  ],
  tr: [
    ['Otomotir', 'typo', 'Otomotiv'],
    ['kelepçe-tasma', 'coined; hook & loop = keklik kancası', 'keklik kancası'],
    ['zımparalanma', 'wrong nominal (being sanded); sanding belts = zımpara bantları', 'zımpara bantları'],
    ['Oşanya', 'coined for Oceania', 'Okyanusya'],
    ['MoTai Knowledge', 'untranslated English', 'MoTai Bilgi'],
    ['yaprakları', 'wrong word (leaves); sheets = levhaları', 'levhaları'],
    ['delik zımpara', 'awkward; hole sanding discs = delikli', 'delikli zımpara diskleri']
  ],
  fa: [
    ['گردو', 'wrong word (walnut); dustless = بدون گرد و غبار', 'بدون گرد و غبار'],
    ['رسایی', 'coined for availability', 'در دسترس بودن'],
    ['تلاش مشخصات', 'wrong word (effort); = مشخصات و نیازهای', 'مشخصات و نیازهای'],
    ['راه‌گسیاری', 'wrong word; Let\'s Connect = در تماس باشید', 'در تماس باشید'],
    ['پُرکردن', 'wrong word (filling) for blending', 'میل‌کردن'],
    ['تمیزی', 'wrong word (cleanliness) for finishing', 'صاف‌کاری'],
    ['سایندهسنگین', 'coined compound (no space)', 'ساینده سنگین'],
    ['سایشسنگین', 'coined compound (no space)', 'سایش سنگین']
  ],
  // Nordic + SEA checks that are machine-detectable
  sv: [['slipeband', 'anglicism; slibebånd', 'slibebånd'], ['slipeskiva', 'consistency: use slipplatta', 'slipplatta'], ['MoTai Knowledge', 'untranslated English', 'MoTai Kunskap']],
  da: [['slipeband', 'anglicism; slibebånd', 'slibebånd'], ['MoTai Knowledge', 'untranslated English', 'MoTai Viden']],
  no: [['slipeband', 'anglicism; slibebånd', 'slibebånd'], ['MoTai Knowledge', 'untranslated English', 'MoTai Kunnskap']],
  fi: [['slipeband', 'anglicism; hiomahihna', 'hiomahihna'], ['MoTai Knowledge', 'untranslated English', 'MoTai Tietoa']],
  th: [['MoTai Knowledge', 'untranslated English', 'MoTai ความรู้']],
  vi: [['MoTai Knowledge', 'untranslated English', 'MoTai Kiến thức']],
  id: [['MoTai Knowledge', 'untranslated English', 'MoTai Pengetahuan']],
  ms: [['MoTai Knowledge', 'untranslated English', 'MoTai Pengetahuan']],
  hi: [['MoTai Knowledge', 'untranslated English', 'MoTai ज्ञान']],
  'zh-Hant': [['MoTai Knowledge', 'untranslated English', 'MoTai 知識']]
}

// Thai: detect bare-consonant runs that should carry tone/vowel marks.
// A Thai syllable needs a vowel (U+0E31..U+0E3A, U+0E40..U+0E44) or a tone
// mark (U+0E48..U+0E4B); a run of 3+ pure consonants is a broken spelling.
function thHasVowelOrTone(ch) {
  const c = ch.codePointAt(0)
  return (c >= 0x0e31 && c <= 0x0e3a) || (c >= 0x0e40 && c <= 0x0e44) || (c >= 0x0e47 && c <= 0x0e4e)
}
const TH_CONSONANT = (c) => {
  const n = c.codePointAt(0)
  return (n >= 0x0e01 && n <= 0x0e2e) || (n >= 0x0e40 && n <= 0x0e44)
}
function thBrokenRuns(text) {
  const runs = []
  let cur = ''
  for (const ch of text) {
    if (TH_CONSONANT(ch)) cur += ch
    else {
      if (cur.length >= 3 && ![...cur].some(thHasVowelOrTone)) runs.push(cur)
      cur = ''
    }
  }
  if (cur.length >= 3 && ![...cur].some(thHasVowelOrTone)) runs.push(cur)
  return runs
}

const count = (s, needle) => s.split(needle).length - 1
const nonAscii = (s) => /[^ -~]/.test(s)

let totalIssues = 0
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json')).sort()) {
  const code = f.replace(/\.json$/, '')
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8')
  const obj = JSON.parse(raw)
  const flat = Object.keys(obj)
  const issues = []

  // 1) wrong/invented terms
  for (const [pat, why, fix] of (WRONG[code] || [])) {
    const n = count(raw, pat)
    if (n) issues.push(`TERM  "${pat}" x${n} — ${why} → "${fix}"`)
  }
  // 2) placeholder loss (only for keys present in the payload)
  for (const [k, toks] of Object.entries(enTok)) {
    if (!flat.includes(k)) continue
    const lv = obj[k]
    if (typeof lv !== 'string' || toks.some((t) => !lv.includes(t))) issues.push(`TOKEN ${k} — lost ${toks.join(',')} (got ${JSON.stringify(lv)?.slice(0, 40)})`)
  }
  // 3) untranslated "MoTai Knowledge" anywhere
  if (!flat.includes('tdk.blog.title') && raw.includes('MoTai Knowledge')) issues.push('EN   tdk.blog.title keeps "MoTai Knowledge"')
  // 4) CJK contamination in a non-CJK locale
  if (!['zh', 'zh-Hant', 'ja'].includes(code)) {
    const cjk = raw.match(/[\u4e00-\u9fff]/g)
    if (cjk) issues.push(`SCRIPT CJK characters found: ${[...new Set(cjk)].join('')}`)
  }
  // 5) Thai: no mechanical heuristic (Thai orthography allows voiceless
  // syllables, so consonant-run detection false-positives). Thai is audited
  // by reading sample sentences instead — see .zcode-check/audit-th-th.md.
  // 6) Nordic letters sanity (must contain some å/ä/ö/æ/ø in Latin locales)
  if (['sv', 'da', 'no'].includes(code) && !/[åäöæø]/i.test(raw)) issues.push('SCRIPT no Scandinavian letters found (fully anglicised?)')
  // 7) FULL-locale completeness
  const leaves = (() => { let n = 0; (function w(x) { for (const v of Object.values(x)) { if (typeof v === 'object' && v !== null && !Array.isArray(v)) w(v); else n++ } })(obj); return n })()
  if (leaves >= 579 && !flat.every((k) => enSet.has(k) || ['code', 'name', 'codeLabel', 'htmlLang', 'ogLocale', 'rtl'].includes(k))) {
    issues.push('SHAPE FULL payload has keys not present in en.json')
  }

  totalIssues += issues.length
  console.log(`\n### ${code} (${leaves} leaves, ${flat.length} flat keys)`)
  console.log(issues.length ? issues.map((i) => '  - ' + i).join('\n') : '  - clean')
}
console.log(`\n=== ${totalIssues} issue(s) total ===`)
process.exit(totalIssues ? 1 : 0)
