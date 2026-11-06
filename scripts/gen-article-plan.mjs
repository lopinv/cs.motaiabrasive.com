#!/usr/bin/env node
/**
 * gen-article-plan.mjs — deterministic generator for the 1000-article EN plan.
 *
 * Crosses the keyword matrix (industry core + product + material + application
 * + B2B purchase, from the MoTai keyword spec) with 11 content archetypes to
 * produce exactly TARGET unique topics. Each entry carries everything a writer
 * and a validator need: primary keyword, a keyword-composited conversational
 * title, TF-IDF-ordered keyword set, category, image, internal-link slots,
 * authority external-link slots, a section scaffold (question-tree) and a BLUF
 * seed. It is pure and reproducible — re-running yields the same plan.
 *
 * Output: scripts/pipeline/en/plan.json
 * Run:    node scripts/gen-article-plan.mjs [--sample] [--target N]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'pipeline', 'en')
const OUT = join(ROOT, 'plan.json')

const args = process.argv.slice(2)
const SAMPLE = args.includes('--sample')
const targetArg = args.find((a) => a.startsWith('--target='))
const target = targetArg ? parseInt(targetArg.split('=')[1], 10) : 1000

/* Reproducible RNG (mulberry32 — full-period, no short cycles). */
let s = 0x9e3779b9
function rnd() {
  s |= 0; s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
function pick(a) { return a[Math.floor(rnd() * a.length)] }
function pickInt(n) { return Math.floor(rnd() * n) }

/* Shared link whitelist (single source of truth with validate.mjs). */
import { INTERNAL, EXTERNAL } from './pipeline/en/links.mjs'

/* ------------------------------------------------------------------ */
/* Internal link targets — alias the shared INTERNAL whitelist so the    */
/* plan and the validator never drift apart. No invented slugs.        */
/* ------------------------------------------------------------------ */
const IMAGES = [
  'belt-533-75', 'belt-610-100', 'belt-1520-630', 'belt-2200-1330',
  'discs', 'mesh-5', 'mesh-6', 'psa-3', 'psa-4', 'psa-5', 'disc-6-solid',
  'flap-plastic', 'flap-steel', 'flap-fiberglass'
]

// Alias the shared table to the short names the helpers below use.
const COLLECT = { belts: INTERNAL.belts, discs: INTERNAL.discs, flap: INTERNAL.flap, all: INTERNAL.all }
const PRODUCTS = {
  '533x75': INTERNAL['533x75'], '610x100': INTERNAL['610x100'], '1520x630': INTERNAL['1520x630'], '2200x1330': INTERNAL['2200x1330'],
  hloop: INTERNAL.hloop, psa3: INTERNAL.psa3, psa4: INTERNAL.psa4, psa5: INTERNAL.psa5,
  mesh5: INTERNAL.mesh5, mesh6: INTERNAL.mesh6, solid6: INTERNAL.solid6
}
const MODELS = {
  gxk51: INTERNAL.gxk51, y399: INTERNAL.y399, gpc71: INTERNAL.gpc71, y999: INTERNAL.y999,
  xz330: INTERNAL.xz330, kx167: INTERNAL.kx167, scy728: INTERNAL.scy728, rcy97: INTERNAL.rcy97,
  mt32: INTERNAL.mt32, gxk56: INTERNAL.gxk56, ax168: INTERNAL.ax168
}
const DISCS = { gold8: INTERNAL.gold8, gold17: INTERNAL.gold17, ceramic15: INTERNAL.ceramic15, red8: INTERNAL.red8, gray8: INTERNAL.gray8 }
const FLAPS = { plastic: INTERNAL.plastic, steel: INTERNAL.steel, fiberglass: INTERNAL.fiberglass }
const APPS = { metal: INTERNAL.metal, wood: INTERNAL.wood, auto: INTERNAL.auto, stainless: INTERNAL.stainless, ship: INTERNAL.ship, prep: INTERNAL.prep }
const STATIC = { oem: INTERNAL.oem, factory: INTERNAL.factory, about: INTERNAL.about, glossary: INTERNAL.glossary, quote: INTERNAL.quote }


/* Keyword families (from the MoTai keyword spec). `primary` keywords are
 * the ones a title must contain; `pool` fills the 3–5 extracted set. */
const FAM = {
  core: {
    primary: ['Abrasive Manufacturer', 'Abrasive Supplier', 'Industrial Abrasives', 'Abrasive Products', 'Coated Abrasives', 'Sanding Products'],
    pool: ['Abrasive', 'Abrasives', 'Abrasive Materials', 'Abrasive Tools', 'Surface Finishing Products', 'Abrasive Factory', 'Abrasive Manufacturer in China']
  },
  belts: {
    primary: ['Abrasive Belts', 'Sanding Belts', 'Industrial Sanding Belts', 'Wide Abrasive Belts', 'Wood Sanding Belts', 'Metal Sanding Belts', 'Aluminum Oxide Abrasive Belts', 'Zirconia Abrasive Belts', 'Silicon Carbide Abrasive Belts', 'Abrasive Belt Manufacturer'],
    pool: ['Sanding Belt', 'Wide Sanding Belt', 'Abrasive Belt Supplier', 'Coated Abrasives', 'Resin Bond', 'Polyester Backing', 'Aluminum Oxide', 'Zirconia Alumina']
  },
  discs: {
    primary: ['Sanding Discs', 'Abrasive Sanding Discs', 'Hook and Loop Sanding Discs', 'Mesh Sanding Discs', '5 Inch Sanding Discs', '6 Inch Sanding Discs', 'Dustless Sanding Discs', 'Perforated Sanding Discs', 'Non-Woven Sanding Discs', 'Sanding Disc Manufacturer'],
    pool: ['PSA Disc', 'Hook and Loop', 'Dustless', 'Perforated', 'Aluminum Oxide', 'Ceramic Grain', 'Sanding Discs Wholesale']
  },
  flap: {
    primary: ['Flap Discs', 'Abrasive Flap Discs', 'Flap Disc Manufacturer', 'Flap Disc Supplier', 'Zirconia Flap Discs', 'Aluminum Oxide Flap Discs', 'Fiberglass Backing Flap Discs', 'Plastic Backing Flap Discs', 'Steel Backing Flap Discs', '115mm Flap Discs'],
    pool: ['Grinding', 'Deburring', 'Weld Grinding', 'Zirconia Alumina', 'Fiberglass Backing', 'Steel Backing', 'Plastic Backing', 'Flap Discs Wholesale']
  },
  sandpaper: {
    primary: ['Sandpaper', 'Abrasive Paper', 'Sandpaper Sheets', 'Sandpaper Rolls', 'Round Sandpaper', 'Shaped Sandpaper', 'Waterproof Sandpaper', 'Wet and Dry Sandpaper', 'Sandpaper Manufacturer', 'Sandpaper Wholesale'],
    pool: ['Dry Sandpaper', 'Wet and Dry', 'Waterproof', 'Abrasive Paper', 'Aluminum Oxide', 'Silicon Carbide']
  },
  pads: {
    primary: ['Sanding Pads', 'Sanding Backing Pad', 'Hook and Loop Sanding Pad', '5 Inch Sanding Pad', '6 Inch Sanding Pad', 'Sanding Pad with Holes', 'Random Orbital Sander Pad', 'Sanding Pad Manufacturer', 'Sanding Pad Wholesale'],
    pool: ['Hook and Loop', 'Perforated Pad', 'Holeless Pad', 'Random Orbital', 'Dustless', 'Dust Extraction']
  },
  material: {
    primary: ['Aluminum Oxide', 'Zirconia Alumina', 'Silicon Carbide', 'Ceramic Abrasive Grain', 'Diamond Abrasive', 'Abrasive Cloth', 'Polyester Backing', 'Cotton Cloth Backing', 'Fiberglass Backing', 'Resin Bond'],
    pool: ['Abrasive Grain', 'Grain Type', 'Hook and Loop Backing', 'Anti-Clogging Coating', 'Abrasive Paper', 'Backing']
  },
  app_metal: {
    primary: ['Metal Grinding', 'Stainless Steel Finishing', 'Metal Surface Preparation', 'Weld Seam Grinding', 'Metal Deburring'],
    pool: ['Metal Fabrication', 'Deoxidizing', 'Rust', 'Steel Plate', 'Weld', 'Flap Discs', 'Abrasive Belts', 'Surface Finishing']
  },
  app_wood: {
    primary: ['Wood Sanding', 'Furniture Sanding', 'Wide Belt Sanding', 'Wood Panel Sanding', 'MDF Sanding'],
    pool: ['Woodworking', 'Furniture', 'Wide Belt', 'Sanding Belt', 'Abrasive Belts', 'Furniture Finishing']
  },
  app_auto: {
    primary: ['Automotive Sanding', 'Car Paint Sanding', 'Auto Body Sanding', 'Primer Sanding', 'Automotive Surface Preparation'],
    pool: ['Auto Body', 'Primer', 'Paint', 'Dustless', 'Mesh Sanding Discs', 'Sanding Discs', 'Hook and Loop']
  },
  app_ship: {
    primary: ['Shipbuilding Surface Preparation', 'Steel Plate Grinding', 'Industrial Polishing', 'Rust Removal', 'Heavy Duty Grinding'],
    pool: ['Shipyard', 'Coating', 'Stainless Steel', 'Abrasive Belts', 'Flap Discs', 'Wide Belt Sanding']
  },
  b2b: {
    primary: ['Abrasive Products Wholesale', 'Abrasive OEM Manufacturer', 'Private Label Abrasives', 'Custom Abrasive Products', 'Bulk Abrasive Supplies', 'Abrasive Products Exporter', 'Abrasive Manufacturer China', 'Industrial Abrasive Supplier'],
    pool: ['Abrasive Factory', 'Abrasive Distributor', 'OEM', 'Private Label', 'Abrasive Belts Wholesale', 'Flap Discs Wholesale', 'Sanding Discs Wholesale']
  }
}

const GRITS = ['60', '80', '100', '120', '150', '180', '220', '240', '320', '400', '600', '800', '1000', '1200', '1500', '1800', '2000', '2400', '2800', '3000', '4000', '5000']
const STANDARDS = ['FEPA', 'ANSI', 'ISO 848', 'E-grit (micro)', 'P-grit (FEPA)']
const PAPER = ['F', 'E', 'C', 'B', 'D', 'A']
const BELT_SIZES = ['533 × 75', '610 × 100', '1520 × 630', '2200 × 1330']

function clipTitle(base, kw) {
  const MAX = 58
  if (base.length <= MAX) return base
  // Prefer the fallback: keep the primary keyword, add a short suffix.
  if ((kw + ' Guide').length <= MAX) return kw + ' Guide'
  // Otherwise truncate at a word boundary.
  let t = base.slice(0, MAX + 1)
  const sp = t.lastIndexOf(' ')
  if (sp > kw.length) t = t.slice(0, sp)
  return t.includes(kw) ? t : kw + ' Guide'
}

function imageFor(fam) {
  const byFam = { belts: ['belt-533-75', 'belt-610-100', 'belt-1520-630', 'belt-2200-1330'], discs: ['discs', 'psa-3', 'psa-4', 'psa-5', 'mesh-5', 'mesh-6', 'disc-6-solid'], flap: ['flap-plastic', 'flap-steel', 'flap-fiberglass'], sandpaper: ['psa-3', 'psa-4', 'psa-5'], pads: ['mesh-5', 'mesh-6'], material: ['discs', 'belt-610-100'], b2b: ['flap-steel', 'discs'], core: ['belt-533-75', 'discs'], app_metal: ['flap-fiberglass', 'flap-steel'], app_wood: ['belt-610-100', 'psa-5'], app_auto: ['psa-5', 'mesh-5'], app_ship: ['flap-steel', 'belt-1520-630'] }
  return pick(byFam[fam] || IMAGES)
}

function internalLinksFor(fam) {
  const links = []
  const fam2col = { belts: COLLECT.belts, discs: COLLECT.discs, flap: COLLECT.flap, sandpaper: COLLECT.discs, pads: COLLECT.discs, b2b: COLLECT.all, core: COLLECT.all, app_metal: COLLECT.all, app_wood: COLLECT.belts, app_auto: COLLECT.discs, app_ship: COLLECT.all, material: COLLECT.discs }
  links.push(fam2col[fam] || COLLECT.all)
  if (fam === 'belts') links.push(PRODUCTS['610x100'], MODELS['gxk51'], APPS.wood)
  else if (fam === 'discs' || fam === 'sandpaper') links.push(PRODUCTS.hloop, DISCS.gold8, APPS.auto)
  else if (fam === 'flap') links.push(FLAPS.fiberglass, FLAPS.steel, APPS.metal)
  else if (fam === 'pads') links.push(PRODUCTS.mesh5, PRODUCTS.solid6, APPS.wood)
  else if (fam === 'material') links.push(DISCS.ceramic15, COLLECT.belts, APPS.metal)
  else if (fam === 'b2b') links.push(STATIC.oem, STATIC.factory, COLLECT.all)
  else if (fam === 'app_metal') links.push(FLAPS.fiberglass, APPS.metal, COLLECT.flap)
  else if (fam === 'app_wood') links.push(PRODUCTS['610x100'], MODELS['y399'], APPS.wood)
  else if (fam === 'app_auto') links.push(DISCS.gold17, PRODUCTS.mesh5, APPS.auto)
  else if (fam === 'app_ship') links.push(FLAPS.steel, APPS.ship, COLLECT.flap)
  else if (fam === 'core') links.push(COLLECT.all, STATIC.factory, STATIC.quote)
  else links.push(APPS.prep, COLLECT.all, STATIC.quote)
  if (fam === 'app_ship' || fam === 'app_metal' || fam === 'core') links.push(APPS.stainless)
  links.push(STATIC.glossary, STATIC.quote)
  // de-dupe by target, keep order
  const seen = new Set(); return links.filter((l) => (seen.has(l.to) ? false : (seen.add(l.to), true))).slice(0, 7)
}

function externalsFor(fam, title) {
  // Always offer a safety authority (OSHA PPE or CCOHS abrasive-wheels) so
  // every article can anchor an E-E-A-T trust link, plus topic-specific
  // material/standard pages that are actually on-topic.
  const set = new Set(['oshaPPE', 'ccohsWheels'])
  const t = title.toLowerCase()
  if (/grit|fepa|ansi|standard|grade|paper/.test(t)) set.add('fepa')
  if (/aluminum|alumina/.test(t)) set.add('aluox')
  if (/zircon/.test(t)) set.add('zircon')
  if (/silicon carbide|carbide/.test(t)) set.add('sic')
  if (/carbon|diamond/.test(t)) set.add('carbon')
  if (/stainless|steel plate|metal/.test(t)) set.add('steel')
  if (/fiberglass|glass/.test(t)) set.add('glass')
  if (/dust|ppe|safe|risk|compliance/.test(t)) set.add('dust')
  if (/oem|factory|export|wholesale|supplier|manufacturer/.test(t)) set.add('iso')
  const arr = [...set]
  return arr.slice(0, 4).map((k) => EXTERNAL[k])
}

function scaffold(id, kw, title, fam) {
  const base = [
    { h: `The short answer on ${kw}`, body: 'BLUF: open with the direct decision rule — what to pick, the one number that governs it, and the two scenarios where it does not apply. No preamble.' },
    { h: `How ${kw} actually works`, body: 'Grain, backing, bond and how the three trade against cut, finish and life. Cite a concrete spec.' },
    { h: 'Choosing by material and finish line', body: 'Match grit sequence and grain type to the substrate; give a worked example with grits.' },
    { h: 'Speed, dust and safety', body: 'Max line speed vs RPM, PPE, dust control; cite OSHA/CCOHS.' },
    { h: 'Cost, life and lead time', body: 'Wear rate, cost-per-surface, MOQ, OEM/private-label lead times.' },
    { h: 'Common mistakes and how to fix them', body: 'Loading, glazing, edge-peel, line-speed mismatch, grit-sequence skips.' },
    { h: 'FAQ', body: 'Six Q&A pairs a real buyer asks; include the standard to name in any enquiry.' }
  ]
  const variant = [
    id === 'besttop' ? { h: `What ${kw} buyers should shortlist`, body: 'Selection criteria ranked; what distributors ask for before a sample.' } : null,
    id === 'failure' ? { h: 'Diagnosing the symptom', body: 'Map each failure to grain vs bond vs speed vs PPE.' } : null,
    id === 'compliance' ? { h: 'Regulatory and safety baseline', body: 'OSHA/CCOHS obligations, rated speed, eye/face/respirator, dust extraction.' } : null,
    id === 'oem' ? { h: 'From blank to branded', body: 'Label, packing, spec sheet; MOQ and tooling; lead-time math.' } : null,
    id === 'standard' ? { h: 'Reading the standard line on the label', body: 'Paper/F, E, P, grain, grade, backing decode.' } : null
  ].filter(Boolean)
  return variant.length ? variant.concat(base.slice(2)).slice(0, 7) : base
}

function extractKwSet(fam, primary, slot, id) {
  const f = FAM[fam]
  const set = new Set([primary])
  if (slot && /[0-9]/.test(slot)) set.add(slot)
  const pool = f.pool || []
  const i = (primary.length + (slot ? slot.length : 0)) % (pool.length + 1)
  for (let n = 0; n < 4 && i + n < pool.length; n++) set.add(pool[(i + n) % pool.length])
  if (['b2b', 'belts', 'discs', 'flap', 'sandpaper'].includes(fam)) set.add(pick(FAM.b2b.pool))
  let arr = [...set]
  if (arr.length < 3) arr = arr.concat(pool.slice(0, 3 - arr.length))
  return arr.slice(0, 5)
}

/* Template recipes: each mk(fam) returns { kw, slot, title, image }. */
const TEMPLATES = [
  { id: 'howto', cat: 'selection-guide', count: 130, family: ['belts', 'discs', 'flap', 'sandpaper', 'pads', 'app_metal', 'app_wood', 'app_auto'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const slot = pick(GRITS)
      const tails = ['the Right Grit', 'Your Sanding Disc', 'an Abrasive Belt', 'a Flap Disc', 'a Sandpaper Grade', 'the Right One', 'the Grit Ladder', 'the Backing']
      const lead = pick(['How to Pick', 'How to Choose', 'How to Use', 'How to Match', 'How to Read'])
      const base = `${lead} ${kw}: ${pick(tails)}`
      return { kw, slot, title: base, image: imageFor(fam) }
    } },
  { id: 'besttop', cat: 'buyer-resources', count: 110, family: ['belts', 'discs', 'flap', 'sandpaper', 'pads', 'material', 'app_metal', 'app_wood', 'app_auto', 'app_ship'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const forWhom = pick(['Buyers', 'Distributors', 'Fabricators', 'Workshops', 'Contractors', 'Shop Owners', 'Grinders'])
      const n = pick(['7', '8', '10', '12'])
      const base = `${n} Questions ${forWhom} Ask About ${kw}`
      return { kw, slot: pick(GRITS), title: base, image: imageFor(fam) }
    } },
  { id: 'compare', cat: 'selection-guide', count: 130, family: ['belts', 'discs', 'flap', 'sandpaper', 'material', 'app_metal', 'app_wood', 'app_auto', 'app_ship'],
    mk: (fam) => {
      const f = FAM[fam]
      const a = pick(f.primary); let b = pick(f.primary)
      while (b === a) b = pick(f.primary)
      const g = pick(GRITS)
      const forms = [`${a} vs ${b}`, `${a} vs ${b}: What Changes`, `${a} and ${b} — When to Use Which`, `${a} vs ${b} at Grit ${g}`, `${a} vs ${b} for Finishing`]
      const base = pick(forms)
      return { kw: a, slot: g, title: base, image: imageFor(fam) }
    } },
  { id: 'product', cat: 'selection-guide', count: 110, family: ['belts', 'discs', 'flap', 'sandpaper', 'pads'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const g = pick(GRITS)
      const base = pick([
        `How ${kw} Work: Grit ${g} Explained`,
        `Anatomy of ${kw} at Grit ${g}`,
        `What ${kw} Do: Grit ${g} in Practice`,
        `What to Know Before Ordering ${kw}`,
        `Inside ${kw}: Grit ${g} and Backing`
      ])
      return { kw, slot: g, title: base, image: imageFor(fam) }
    } },
  { id: 'sizing', cat: 'buyer-resources', count: 90, family: ['belts', 'discs', 'flap', 'pads', 'sandpaper'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary); const g = pick(GRITS)
      const lead = pick(['Sizing Guide for', 'Specs That Matter in', 'The Numbers Behind', 'Reading the Label on', 'Choosing the Size of'])
      const base = `${lead} ${kw} (Grit ${g})`
      return { kw, slot: g, title: base, image: imageFor(fam) }
    } },
  { id: 'usage', cat: 'application-notes', count: 90, family: ['app_metal', 'app_wood', 'app_auto', 'app_ship', 'belts', 'flap'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const lead = pick(['Practical Notes on', 'In the Shop:', 'Field Notes: How We Run', 'Day-to-Day Use of', 'Honest Talk About'])
      const base = `${lead} ${kw}`
      return { kw, slot: pick(GRITS), title: base, image: imageFor(fam) }
    } },
  { id: 'failure', cat: 'application-notes', count: 90, family: ['belts', 'discs', 'flap', 'sandpaper', 'app_metal', 'app_wood', 'app_auto', 'app_ship'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const probs = ['Grain Loading', 'Disc Glazing', 'Belt Burn-through', 'Early Edge Peel', 'Grain Flattening', 'Sanding Marks', 'Tool Vibration', 'Clogging', 'Chattering']
      const lead = pick(['Why', 'How to Fix', 'Cutting Through', 'Troubleshooting', 'When You See'])
      const base = pick([
        `${lead} ${pick(probs)} Happens (and ${kw} Fixes)`,
        `${pick(probs)} in ${kw}? How to Fix It`,
        `Fixing ${pick(probs)} on ${kw}`
      ])
      return { kw, slot: pick(GRITS), title: base, image: imageFor(fam) }
    } },
  { id: 'standard', cat: 'selection-guide', count: 70, family: ['belts', 'discs', 'sandpaper', 'flap', 'pads'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary); const std = pick(STANDARDS)
      const base = pick([
        `What ${std} Means for ${kw}`,
        `How to Read the ${std} Grit on ${kw}`,
        `${std} vs ANSI Grit: Which to Ask For on ${kw}`
      ])
      return { kw, slot: std, title: base, image: imageFor(fam) }
    } },
  { id: 'material', cat: 'application-notes', count: 60, family: ['material'],
    mk: () => {
      const f = FAM.material
      const a = pick(f.primary); let b = pick(f.primary)
      while (b === a) b = pick(f.primary)
      const forms = [`${a} vs ${b} in Coated Abrasives`, `${a} Grain: What It Really Cuts Like`, `What ${a} Does for Finishing`, `${a} vs ${b}: Choosing the Grain`]
      const kw = a
      return { kw, slot: b, title: pick(forms), image: imageFor('material') }
    } },
  { id: 'oem', cat: 'oem-guide', count: 50, family: ['b2b', 'belts', 'discs', 'flap'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const lead = pick(['OEM & Private Label', 'Putting Your Label On', 'From Factory to Brand:', 'Custom Runs of', 'Spec\u2011Sheet Notes for'])
      const base = pick([`${lead} ${kw}`, `What OEM ${kw} Runs Cost to Spec`, `Private Label ${kw} at Scale`])
      return { kw, slot: pick(GRITS), title: base, image: imageFor('b2b') }
    } },
  { id: 'compliance', cat: 'selection-guide', count: 40, family: ['app_metal', 'discs', 'flap', 'belts', 'app_ship'],
    mk: (fam) => {
      const f = FAM[fam]; const kw = pick(f.primary)
      const lead = pick(['Safety & Compliance Notes for', 'Working Within Limits:', 'A Compliance Read on', 'Dust, Speed & PPE in'])
      const base = `${lead} ${kw}`
      return { kw, slot: null, title: base, image: imageFor(fam) }
    } }
]
/* total: 130+110+130+110+90+90+90+90+70+60+50+40 = 960; top up below */

function buildPlan(target) {
  const seenTitles = new Set()
  const seenCombo = new Set()
  const plan = []
  const addEntry = (t, fam, res) => {
    const title = clipTitle(res.title, res.kw)
    const combo = `${t.id}|${fam}|${res.kw}|${res.slot || ''}`
    if (seenTitles.has(title) || seenCombo.has(combo)) return false
    const slug = title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/-$/g, '')
      .slice(0, 64)
    seenTitles.add(title); seenCombo.add(combo)
    plan.push({
      n: 0, // assigned at the end
      slug,
      type: t.id, category: t.cat, family: fam,
      keyword: res.kw, slot: res.slot, title,
      kwSet: extractKwSet(fam, res.kw, res.slot, t.id),
      image: res.image,
      internals: internalLinksFor(fam),
      externals: externalsFor(fam, title),
      outline: scaffold(t.id, res.kw, title, fam),
      wordTarget: 5000 + pickInt(500) // 5000–5499
    })
    return true
  }

  for (const t of TEMPLATES) {
    let guard = 0
    while (plan.filter((p) => p.type === t.id).length < t.count && guard < t.count * 60) {
      guard++
      const fam = pick(t.family)
      addEntry(t, fam, t.mk(fam)) // dedupe inside; loop until t.count reached
    }
  }

  // Top up any shortfall by cycling archetypes with fresh combos.
  if (plan.length < target) {
    for (const t of TEMPLATES) {
      let guard = 0
      while (plan.length < target && guard < 2000) {
        guard++
        const fam = pick(t.family)
        if (addEntry(t, fam, t.mk(fam))) continue
        if (guard % 500 === 0) break // avoid a tight loop on a near-exhausted archetype
      }
      if (plan.length >= target) break
    }
  }

  const sliced = plan.slice(0, target)
  sliced.forEach((e, i) => (e.n = i + 1))
  return sliced
}

function main() {
  const plan = buildPlan(target)
  const perType = {}
  plan.forEach((e) => (perType[e.type] = (perType[e.type] || 0) + 1))
  console.log('per-type:', JSON.stringify(perType), 'total:', plan.length, 'distinct titles:', new Set(plan.map((e) => e.title)).size)
  if (SAMPLE) {
    console.log('sample count:', plan.length)
    plan.slice(0, 30).forEach((e) =>
      console.log(`#${e.n} [${e.type}/${e.family}] ${e.title}\n    kw=${e.keyword} kwSet=${e.kwSet.join(' / ')}\n    externals=${e.externals.map((x) => x.url).join(' | ')}\n`)
    )
    return
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), target, count: plan.length, plan }, null, 2))
  console.log(`wrote ${plan.length} entries -> ${OUT}`)
}

main()
