const fs = require('fs')
const p = 'D:\\Code\\shopify\\motai-static\\src\\i18n\\en.json'
const j = JSON.parse(fs.readFileSync(p, 'utf8'))
j.home.featuredSub = 'Sizes and grits are documented in the catalogue; MOQ and availability come with the offer.'
j.modelPage.disclaimer = 'Model-family details are for selection reference; MoTai supply specs, availability and fit are settled with your quotation.'
j.applications.faqs[1].a = 'Yes — list the grits and quantity per grade; availability and lead time come back with the offer.'
j.contact.formNote = 'This form requests an offer and does not place an order. Enquiries go to our sales inbox; specs and commercial terms are settled with the offer.'
j.glossary.note = 'Standard industry definitions for abrasive consumables; grade and backing details for an order are settled with the quotation.'
j.faq.moq.a = 'MOQ comes back with the offer, alongside availability and terms.'
j.faq.oem.a = 'Yes. Logo, labels, custom sizes and packing are checked for feasibility, then confirmed with your offer.'
j.gloss.moq.def = 'Minimum order quantity — comes with the offer, alongside availability and terms.'
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf8')
console.log('en.json: 8 phrases rewritten')
const d = 'D:\\Code\\shopify\\motai-static\\src\\data\\disc-views.json'
const dj = JSON.parse(fs.readFileSync(d, 'utf8'))
const s = JSON.stringify(dj)
console.log('disc-views has fingerprint:', s.includes('confirmed in the quotation'))
