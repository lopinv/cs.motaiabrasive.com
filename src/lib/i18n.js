import en from '../i18n/en.json'

/**
 * Languages load dynamically from whatever i18n/<lang>.json files exist at build
 * time. Adding a new language file automatically extends LANGS, the language
 * switcher, and every page's getStaticPaths. en.json is the guaranteed baseline.
 */
const files = import.meta.glob('../i18n/*.json', { eager: true })

function deepMerge(base, extra) {
  const out = { ...base }
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base?.[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v)
    } else {
      out[k] = v
    }
  }
  return out
}

export const TRANSLATIONS = {}
for (const [path, mod] of Object.entries(files)) {
  const code = path.split('/').pop().replace('.json', '')
  TRANSLATIONS[code] = code === 'en' ? mod.default : deepMerge(en, mod.default)
}

export const LANGS = Object.keys(TRANSLATIONS)

export function defaultLang() {
  const l = process.env.SITE_LANG || 'en'
  return LANGS.includes(l) ? l : 'en'
}

export function t(lang, path) {
  const root = TRANSLATIONS[lang] ?? TRANSLATIONS.en
  let cur = root
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[key]
  }
  return typeof cur === 'string' ? cur : undefined
}
