/**
 * links.mjs — single source of truth for every link a generated article may
 * use. Both the validator (validate.mjs) and the writer prompt spec read from
 * here, so an article can only ever link to pages that actually exist in the
 * build and to authority URLs that were verified live. No invented slugs.
 *
 * Internal hrefs are locale-prefixed at render time (the template calls
 * localizedUrl()); the bare path here is the canonical en form.
 */

// ---- Internal links (real routes produced by this build) ----
export const INTERNAL = {
  // Collections
  belts: { to: '/collections/abrasive-belts', text: 'the abrasive belt range' },
  discs: { to: '/collections/sanding-discs', text: 'the sanding disc range' },
  flap: { to: '/collections/flap-discs', text: 'the flap disc range' },
  all: { to: '/collections/all', text: 'all abrasive products' },
  // Products (handles from products.json)
  '533x75': { to: '/products/533x75-abrasive-belt', text: 'the 533 × 75 mm abrasive belt' },
  '610x100': { to: '/products/610x100-abrasive-belt', text: 'the 610 × 100 mm abrasive belt' },
  '1520x630': { to: '/products/1520x630-abrasive-belt', text: 'the 1520 × 630 mm abrasive belt' },
  '2200x1330': { to: '/products/2200x1330-abrasive-belt', text: 'the 2200 × 1330 mm wide belt' },
  hloop: { to: '/products/hook-loop-sanding-discs', text: 'hook-and-loop sanding discs' },
  psa3: { to: '/products/3-inch-psa-sanding-disc', text: 'the 3-inch PSA sanding disc' },
  psa4: { to: '/products/4-inch-psa-sanding-disc', text: 'the 4-inch PSA sanding disc' },
  psa5: { to: '/products/5-inch-psa-sanding-disc', text: 'the 5-inch PSA sanding disc' },
  mesh5: { to: '/products/5-inch-mesh-sanding-disc', text: '5-inch mesh sanding discs' },
  mesh6: { to: '/products/6-inch-mesh-sanding-disc', text: '6-inch mesh sanding discs' },
  solid6: { to: '/products/6-inch-solid-sanding-disc', text: 'the 6-inch non-hole sanding disc' },
  // Models
  'gxk51': { to: '/model/gxk-51', text: 'the GXK-51 abrasive belt' },
  'y399': { to: '/model/y399', text: 'the Y399 abrasive belt' },
  'gpc71': { to: '/model/gpc71', text: 'the GPC71 abrasive belt' },
  'y999': { to: '/model/y999', text: 'the Y999 abrasive belt' },
  'xz330': { to: '/model/xz-330', text: 'the XZ-330 abrasive belt' },
  'kx167': { to: '/model/kx-167', text: 'the KX-167 abrasive belt' },
  'scy728': { to: '/model/scy728', text: 'the SCY728 abrasive belt' },
  'rcy97': { to: '/model/rcy97', text: 'the RCY97 abrasive belt' },
  'mt32': { to: '/model/mt-32', text: 'the MT-32 abrasive belt' },
  'gxk56': { to: '/model/gxk56', text: 'the GXK56 abrasive belt' },
  'ax168': { to: '/model/ax-168', text: 'the AX-168 abrasive belt' },
  // Disc views
  gold8: { to: '/disc/gold8', text: 'the 5-inch 8-hole hook-and-loop disc' },
  gold17: { to: '/disc/gold17', text: 'the 6-inch 17-hole hook-and-loop disc' },
  ceramic15: { to: '/disc/ceramic15', text: 'the 150 mm ceramic hook-and-loop disc' },
  red8: { to: '/disc/red8', text: 'the 8-hole red sanding disc' },
  gray8: { to: '/disc/gray8', text: 'the P3000 fine 8-hole disc' },
  // Flap backings
  plastic: { to: '/flap/plastic', text: 'the plastic-backing flap disc' },
  steel: { to: '/flap/steel', text: 'the steel-backing flap disc' },
  fiberglass: { to: '/flap/fiberglass', text: 'the fiberglass-backing flap disc' },
  // Applications
  metal: { to: '/applications/metal-fabrication', text: 'metal fabrication abrasive use' },
  wood: { to: '/applications/woodworking', text: 'woodworking sanding use' },
  auto: { to: '/applications/automotive', text: 'automotive repair sanding use' },
  stainless: { to: '/applications/stainless-steel', text: 'stainless steel finishing use' },
  ship: { to: '/applications/shipbuilding', text: 'shipbuilding surface preparation use' },
  prep: { to: '/applications/surface-preparation', text: 'industrial surface preparation use' },
  // Static
  oem: { to: '/oem', text: 'the OEM & private-label service page' },
  factory: { to: '/factory', text: 'the manufacturing & quality page' },
  about: { to: '/about', text: 'about MoTai' },
  glossary: { to: '/glossary', text: 'the abrasives glossary' },
  quote: { to: '/quote', text: 'request a quotation' }
}

// ---- Authority external links (verified live as of 2026-11-04) ----
// OSHA .gov deep pages verify with HTTP 200; Wikipedia material pages and
// CCOHS abrasive-wheels verify live. Writers must cite only these and only
// the standard numbers that actually exist — no invented test bodies.
export const EXTERNAL = {
  oshaPPE: { url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.132', text: 'OSHA 29 CFR 1910.132 — PPE general requirements' },
  oshaTools: { url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.244', text: 'OSHA 29 CFR 1910.244 — portable power tools' },
  ccohsWheels: { url: 'https://www.ccohs.ca/oshanswers/safety_haz/abrasive_wheels', text: 'CCOHS "Abrasive Wheels" occupational health answers' },
  fepa: { url: 'https://en.wikipedia.org/wiki/FEPA', text: 'the FEPA grit standard (ISO 848)' },
  aluox: { url: 'https://en.wikipedia.org/wiki/Aluminium_oxide', text: 'the properties of aluminium oxide' },
  zircon: { url: 'https://en.wikipedia.org/wiki/Zirconium_dioxide', text: 'the properties of zirconia alumina' },
  sic: { url: 'https://en.wikipedia.org/wiki/Silicon_carbide', text: 'the properties of silicon carbide' },
  carbon: { url: 'https://en.wikipedia.org/wiki/Carbon_black', text: 'carbon abrasive grain' },
  glass: { url: 'https://en.wikipedia.org/wiki/Fiberglass', text: 'fiberglass backing' },
  steel: { url: 'https://en.wikipedia.org/wiki/Stainless_steel', text: 'stainless steel finishing fundamentals' },
  dust: { url: 'https://en.wikipedia.org/wiki/Dust', text: 'abrasive dust and airborne particulates' },
  iso: { url: 'https://www.iso.org/', text: 'ISO standards' }
}

// ---- Banned absolute / superlative claims (广告法 red-line) ----
export const BANNED = [
  'absolutely safe', 'zero risk', 'zero wear', 'zero-glaze', 'never wear', 'never-glaze',
  'lifetime', 'permanent', 'guarantee', 'guaranteed', 'infallible', 'incredible',
  'the best', 'best-ever', 'best in class', 'world-class', 'industry-leading',
  'unmatched', 'unbeatable', 'the only', 'only one', 'no.1', 'number one', 'no-1',
  'revolutionary', 'game-changer', 'game changer', 'miracle', 'magical',
  '100% safe', '100% effective', '100% damage-free', 'no damage', 'damage-free',
  'perfect', 'flawless', 'absolutely zero', 'zero risk'
]

// ---- Concrete, defensible spec values writers may use (from products.json
//      + collections.json). Anything else must be hedged ("confirm with sales").
// ----
export const SPEC_NOTES = [
  'Available belts: 533×75, 610×100, 1520×630, 2200×1330 mm (aluminum oxide).',
  'Sanding discs: 3/4/5/6-inch PSA, 5/6-inch mesh, 6-inch non-hole; hook-and-loop in 3/4/5/6-inch; grits 60–5000.',
  'Flap disc backings: plastic (general), steel (demanding/deburring), fiberglass (high-speed).',
  'Grain options: aluminum oxide, zirconia alumina, silicon carbide, ceramic.',
  'OEM/private-label: label, packing and spec-sheet customization; confirm MOQ and lead time with sales.',
  'Never state a max line speed or RPM for a model unless it is printed on that model — otherwise write "confirm the rated speed with sales and keep the tool below it."'
]

export const INTERNAL_KEYS = Object.keys(INTERNAL)
export const EXTERNAL_KEYS = Object.keys(EXTERNAL)
