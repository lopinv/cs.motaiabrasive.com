/**
 * Unify UI-label consistency: where several locale keys translate the SAME
 * English source string but with different wording, force every key in the
 * group to the canonical rendering. Canonical precedence: cta.* > nav.* >
 * footer.* > the group's most frequent rendering (ties -> first key).
 *
 * Only UI-critical prefixes are touched (buttons, links, nav labels, meta
 * labels). Long page copy is left alone: a process step reworded on /factory
 * vs /home is legitimate editorial variance, not an inconsistency.
 *
 *   node .zcode-check/unify-ui-terms.cjs [code ...]
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const I18N = path.join(root, 'src', 'i18n')
const en = JSON.parse(fs.readFileSync(path.join(I18N, 'en.json'), 'utf8'))

const flat = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const np = p ? p + '.' + k : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) flat(v, np, out)
    else out[np] = v
  }
  return out
}
const enF = flat(en)

// Unify only labels a user can see repeated across pages (same widget).
const UI_PREFIXES = ['cta.', 'nav.', 'footer.', 'home.cta', 'home.finalCta', 'about.cta', 'factory.cta', 'oem.cta', 'applications.cta', 'quotePage.btn', 'article.discuss', 'home.prepTitle', 'purchasing.title1', 'home.regionsSub', 'about.globalSub', 'home.oemTitle']
const isUi = (k) => UI_PREFIXES.some((p) => k === p.replace(/\.$/, '') || k.startsWith(p))

const codes = process.argv.slice(2)
const targets = codes.length ? codes : fs.readdirSync(I18N).filter((f) => f.endsWith('.json') && f !== 'en.json').map((f) => f.replace('.json', ''))

let totalFixed = 0
for (const code of targets) {
  const locPath = path.join(I18N, code + '.json')
  const nested = JSON.parse(fs.readFileSync(locPath, 'utf8'))
  const F = flat(nested)

  const bySrc = {}
  for (const [k, v] of Object.entries(F)) {
    if (!isUi(k) || typeof v !== 'string') continue
    const s = enF[k]
    if (typeof s !== 'string' || s.length < 8) continue
    ;(bySrc[s] ||= []).push([k, v])
  }

  const changes = []
  for (const [s, vs] of Object.entries(bySrc)) {
    const uniq = [...new Set(vs.map((x) => x[1]))]
    if (uniq.length < 2) continue
    // canonical: prefer cta.* / nav.* keys, else the most frequent rendering
    const pref = vs.filter((x) => /^(cta|nav)\./.test(x[0]))
    let canonical
    if (pref.length) canonical = pref[0][1]
    else {
      const count = {}
      for (const [, v] of vs) count[v] = (count[v] || 0) + 1
      const best = Math.max(...Object.values(count))
      canonical = Object.entries(count).find(([, n]) => n === best)[0]
    }
    for (const [k, v] of vs) {
      if (v !== canonical) changes.push([k, v, canonical])
    }
  }

  if (!changes.length) continue

  // apply to the nested structure
  const setDot = (obj, dotted, value) => {
    const parts = dotted.split('.')
    let cur = obj
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]]
    cur[parts[parts.length - 1]] = value
  }
  for (const [k, , canonical] of changes) setDot(nested, k, canonical)
  fs.writeFileSync(locPath, JSON.stringify(nested, null, 2) + '\n', 'utf8')
  totalFixed += changes.length
  console.log(`${code}: ${changes.length} label(s) unified (e.g. ${changes[0][0]})`)
}
console.log(`\n${totalFixed} label(s) unified across ${targets.length} locale(s)`)
