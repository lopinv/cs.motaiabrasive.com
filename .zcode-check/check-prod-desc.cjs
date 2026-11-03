const fs = require('fs')
for (const l of ['en', 'zh', 'ja', 'ko', 'ar', 'de', 'es', 'fr', 'it', 'pt', 'ru']) {
  const t = JSON.parse(fs.readFileSync('D:\\Code\\shopify\\motai-static\\src\\i18n\\' + l + '.json', 'utf8')).tdk.product
  console.log(l + ': ' + JSON.stringify(t.description))
}
