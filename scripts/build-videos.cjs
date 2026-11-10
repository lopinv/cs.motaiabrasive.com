/**
 * Rebuild src/data/videos.json (the site's video data source) and the English
 * source copy in src/i18n/en.json under videos.clip.<id>.
 *
 * Input : scripts/data/yt-meta.json — id/title/description/lengthSeconds/
 *         publishDate, collected from the channel by fetch-yt-meta.cjs.
 *         The hand-written footage copy (COPY bullets + body) lives in
 *         scripts/data/videos-copy.json so this script stays reviewable.
 * Output: src/data/videos.json
 *         src/i18n/en.json  (videos / tdk.videos / tdk.video / nav.videos,
 *                            using parsed-then-written round-trip that keeps
 *                            en.json's CRLF line endings)
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const meta = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/yt-meta.json'), 'utf8'))
const COPY = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/videos-copy.json'), 'utf8'))
const EXTRA = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/videos-extra.json'), 'utf8'))

const iso = (s) => 'PT' + (s >= 60 ? Math.floor(s / 60) + 'M' : '') + (s % 60 ? (s % 60) + 'S' : '')
const pad = (n) => String(n).padStart(2, '0')

const entries = meta.map((v) => {
  const sec = Number(v.lengthSeconds) || 0
  const c = COPY[v.id]
  if (!c) throw new Error('missing hand-written copy for ' + v.id)
  return {
    id: v.id,
    youtubeId: v.id,
    titleKey: `videos.clip.${v.id}.title`,
    descriptionKey: `videos.clip.${v.id}.body`,
    line: c.line,
    kind: v.kind,
    seconds: sec,
    duration: iso(sec),
    durationLabel: `${Math.floor(sec / 60)}:${pad(sec % 60)}`,
    publishDate: (v.publishDate || '').slice(0, 10),
    thumb: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    bodyKey: `videos.clip.${v.id}.body`,
    bulletKeys: c.bullets.map((_, i) => `videos.clip.${v.id}.b${i + 1}`),
    related: c.related || [],
    youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
    specKeys: (EXTRA[v.id]?.specs || []).map((_, i) => `videos.clip.${v.id}.s${i + 1}`),
    faqKeys: (EXTRA[v.id]?.faq || []).map((_, i) => ({
      q: `videos.clip.${v.id}.q${i + 1}`,
      a: `videos.clip.${v.id}.a${i + 1}`
    }))
  }
})

fs.writeFileSync(path.join(root, 'src/data/videos.json'), JSON.stringify(entries, null, 1) + '\n')
console.log('wrote src/data/videos.json — ' + entries.length + ' entries')

// ---- English source copy -------------------------------------------------
const enPath = path.join(root, 'src/i18n/en.json')
const enRaw = fs.readFileSync(enPath, 'utf8')
const en = JSON.parse(enRaw)
const crlf = enRaw.includes('\r\n')

const UI = {
  h1: 'Factory & product videos',
  sub: 'Watch how we convert, check and pack abrasives — then ask about the specification you saw.',
  intro: 'Filmed in our Xianning, Hubei plant and at customer job sites. Long videos run two to three minutes; short clips cover one stage each.',
  allTitle: 'All videos',
  lineBelts: 'Abrasive belts',
  lineDiscs: 'Sanding discs',
  lineFlap: 'Flap discs',
  lineSponge: 'Sanding sponge blocks',
  lineOem: 'OEM & packing',
  countLabel: '{count} videos',
  watch: 'Watch on YouTube',
  play: 'Play this video',
  details: 'What the footage shows',
  relatedTitle: 'Related products',
  relatedNone: 'Tell us the specification you need and we will quote against it.',
  published: 'Published',
  readMore: 'View details',
  back: 'All videos',
  videoLabel: 'Video',
  shortsLabel: 'Short clip',
  transcriptNote: 'Descriptions are written from the footage; exact specifications are agreed in the quotation.',
  ctaTitle: 'Seen something you want to order?',
  ctaSub: 'Send the specification you need and we will confirm it against your application.',
  specTitle: 'What we confirm against your enquiry',
  specIntro: 'The specification points that decide price, lead time and fit — settled in the quotation before the run.',
  faqTitle: 'Questions buyers ask about this video',
  faqIntro: 'The two questions this footage raises most often from distributors and fabrication shops.',
  whyTitle: 'Why buyers use MoTai as their abrasive source',
  why1t: 'Converting under one roof',
  why1b: 'Cloth, cutting, slitting, hot pressing, checking and packing happen on the same site, so the spec you confirm is the spec that ships.',
  why2t: 'Stock for standard sizes',
  why2b: 'Standard widths and grits are racked and ready, which keeps replenishment orders short for distributors.',
  why3t: 'OEM and private label',
  why3b: 'Your logo, labels, sizes and packaging, quoted against your confirmed specification with a feasibility review.',
  moreTitle: 'More from this production line',
  moreIntro: 'Other footage covering the same product family.',
  noneTitle: 'Nothing to confirm?',
  noneBody: 'Send the application, material and volume — we reply with the specification, lead time and price.',
  metaDuration: 'Duration',
  metaPublished: 'Published',
  metaLine: 'Product line',
  linesTitle: 'Browse by product line',
  linesIntro: 'Choose the family you convert or resell, or start at the top and work down.',
  totalLabel: 'Videos published',
  longLabel: 'Long-form factory and product tours',
  shortLabel: 'Single-stage short clips',
  jumpLabel: 'Jump to section',
  factoryLink: 'See the manufacturing page',
  trustEyebrow: 'AT A GLANCE',
  trustTitle: 'The plant behind these videos',
  trustSub: 'Three product lines supplied to seven destination regions, from one site.',
  trustNote: 'Figures describe the plant shown in the footage; order-level terms are confirmed in the quotation.'
}
en.videos = { ...UI, clip: {} }
for (const v of meta) {
  const c = COPY[v.id]
  const x = EXTRA[v.id] || {}
  const clip = { title: v.title, body: c.body }
  c.bullets.forEach((b, i) => { clip[`b${i + 1}`] = b })
  ;(x.specs || []).forEach((t, i) => { clip[`s${i + 1}`] = t })
  ;(x.faq || []).forEach((f, i) => { clip[`q${i + 1}`] = f.q; clip[`a${i + 1}`] = f.a })
  en.videos.clip[v.id] = clip
}
if (!en.nav) en.nav = {}
en.nav.videos = 'Videos'
en.tdk.videos = {
  title: 'Factory & Product Videos — Abrasive Manufacturing Footage | MoTai',
  description: 'Watch MoTai\'s abrasive plant in Xianning, Hubei: production lines, hot pressing, quality checks, packing and shipment — plus product footage of belts, discs and flap discs.',
  keywords: 'abrasive factory video, abrasive manufacturing footage, abrasive belt production line, flap disc video, sanding disc video, MoTai factory tour, abrasive OEM video'
}
en.tdk.video = {
  title: '{title} — MoTai Factory & Product Videos',
  description: 'Factory and product video from MoTai Abrasives, Xianning, Hubei. {title}',
  keywords: '{line}, abrasive video, abrasive factory footage, MoTai video, abrasive manufacturing, abrasive supplier video'
}

let out = JSON.stringify(en, null, 2) + '\n'
if (crlf) out = out.replace(/\n/g, '\r\n')
fs.writeFileSync(enPath, out)
console.log('updated src/i18n/en.json (videos/clip ' + Object.keys(en.videos.clip).length + ', crlf=' + crlf + ')')
