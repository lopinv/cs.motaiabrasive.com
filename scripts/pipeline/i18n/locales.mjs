/**
 * locales.mjs — target locales for the article translation pipeline.
 *
 * The site builds one URL tree per i18n/<code>.json, so every translated
 * article lives at articles/<code>/<slug>.md and its internal links are
 * `<code>`-prefixed (e.g. /de/collections/abrasive-belts). The EN source
 * stays in articles/en/.
 */
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url)) // scripts/pipeline/i18n
const i18nDir = path.resolve(here, '..', '..', '..', 'src', 'i18n')

/** Every locale the site ships, minus the EN source. */
export const TARGET_LOCALES = readdirSync(i18nDir)
  .map((f) => f.replace(/\.json$/, ''))
  .filter((c) => c !== 'en')
  .sort()

/** CJK locales count CJK characters (not words) for the 5000–6000 band. */
export const CJK = new Set(['zh', 'zh-Hant', 'ja', 'ko'])

export const isCJK = (code) => CJK.has(code)

/**
 * Heading markers the validator looks for. The translator MUST use these
 * exact strings as the FAQ heading and the final "before you buy" heading.
 * (The EN validator hardcodes English; this is the per-locale equivalent.)
 */
export const MARKERS = {
  ar: { faq: 'الأسئلة الشائعة', buy: 'قبل الشراء' },
  cs: { faq: 'FAQ', buy: 'Před nákupem' },
  da: { faq: 'FAQ', buy: 'Før du køber' },
  de: { faq: 'FAQ', buy: 'Vor dem Kauf' },
  es: { faq: 'FAQ', buy: 'Antes de comprar' },
  fi: { faq: 'FAQ', buy: 'Ennen ostamista' },
  fr: { faq: 'FAQ', buy: "Avant d'acheter" },
  hi: { faq: 'FAQ', buy: 'खरीदने से पहले' },
  id: { faq: 'FAQ', buy: 'Sebelum membeli' },
  it: { faq: 'FAQ', buy: 'Prima di acquistare' },
  ja: { faq: 'よくある質問', buy: '購入前に' },
  ko: { faq: '자주 묻는 질문', buy: '구매 전에' },
  ms: { faq: 'FAQ', buy: 'Sebelum membeli' },
  no: { faq: 'FAQ', buy: 'Før du kjøper' },
  pl: { faq: 'FAQ', buy: 'Przed zakupem' },
  pt: { faq: 'FAQ', buy: 'Antes de comprar' },
  ru: { faq: 'FAQ', buy: 'Перед покупкой' },
  sk: { faq: 'FAQ', buy: 'Pred nákupom' },
  sv: { faq: 'FAQ', buy: 'Innan du köper' },
  th: { faq: 'คำถามที่พบบ่อย', buy: 'ก่อนซื้อ' },
  vi: { faq: 'FAQ', buy: 'Trước khi mua' },
  'zh-Hant': { faq: '常見問題', buy: '購買前須知' },
  zh: { faq: '常見問題', buy: '購買前須知' },
}
// zh uses simplified for the /zh/ tree; zh-Hant for /zh-Hant/.
MARKERS.zh = { faq: '常见问题', buy: '购买前须知' }

export const isRTL = (code) => code === 'ar'

/** Per-locale frontmatter length bands (char counts). */
export const LENGTHS = (code) => {
  const cjk = CJK.has(code)
  return {
    metaDescription: cjk ? [80, 170] : [120, 170],
    intro: cjk ? [30, 160] : [40, 160],
  }
}

/** 5000–6000 band: CJK characters for CJK locales, words otherwise. */
export const WORD_BAND = { min: 5000, max: 6000 }
