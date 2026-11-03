import fs from 'fs'
const base = 'D:/Code/shopify/motai-static/src/'
const fixes = {
  'pages/[lang]/disc/[key].astro': ["pick('colt.discs')", "pick('colt.discs.label')"],
  'pages/[lang]/flap/[key].astro': ["pick('colt.flap')", "pick('colt.flap.label')"],
  'pages/[lang]/model/[slug].astro': ["pick('colt.belts')", "pick('colt.belts.label')"]
}
for (const [f, [a, b]] of Object.entries(fixes)) {
  const p = base + f
  let c = fs.readFileSync(p, 'utf8')
  const o = c
  c = c.split(a).join(b)
  if (c !== o) {
    fs.writeFileSync(p, c)
    console.log('fixed', f)
  } else {
    console.log('no change', f)
  }
}
