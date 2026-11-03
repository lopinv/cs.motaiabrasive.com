const fs = require('fs')
for (const f of ['src/i18n/zh.json', 'src/i18n/ja.json']) {
  const p = 'D:\\Code\\shopify\\motai-static\\' + f
  let c = fs.readFileSync(p, 'utf8')
  const n = c.split('磨泰').length - 1
  c = c.replace(/磨泰/g, '墨泰')
  fs.writeFileSync(p, c, 'utf8')
  // sanity: JSON still valid, and no 磨泰 left
  JSON.parse(fs.readFileSync(p, 'utf8'))
  const left = fs.readFileSync(p, 'utf8').split('磨泰').length - 1
  console.log(f + ': replaced ' + n + ', remaining 磨泰=' + left + ', 墨泰 count=' + fs.readFileSync(p, 'utf8').split('墨泰').length - 1)
}
