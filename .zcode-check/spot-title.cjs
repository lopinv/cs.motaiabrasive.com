const fs = require('fs')
for (const f of ['/zh/index.html', '/ja/index.html', '/en/index.html']) {
  const t = fs.readFileSync('D:\\Code\\shopify\\motai-static\\dist' + f, 'utf8').match(/<title>([^<]+)</)
  console.log(f + ' -> ' + (t ? t[1] : '(no title)'))
}
console.log('done')
