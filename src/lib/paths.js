import { LANGS } from './i18n.js'

/**
 * Cross helper: given a list of "extras" (each an object like {handle:"x"}),
 * return one getStaticPaths entry per (lang, extra) combination.
 */
export function langPaths(extras = [{}]) {
  return LANGS.flatMap((lang) =>
    extras.map((extra) => ({ params: { lang, ...extra } }))
  )
}
