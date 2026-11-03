const fs = require('fs')
for (const f of ['src/i18n/zh.json', 'src/i18n/ja.json']) {
  const c = fs.readFileSync('D:\\Code\\shopify\\motai-static\\' + f, 'utf8')
  const ctx = []
  let i = 0
  while ((i = c.indexOf('磨泰', i)) !== -1) {
    ctx.push(c.slice(Math.max(0, i - 14), i + 16).replace(/\s+/g, ' '))
    i += 2
  }
  const uniq = [...new Set(ctx)]
  console.log('=== ' + f + ' (' + ctx.length + ' total, ' + uniq.length + ' distinct) ===')
  for (const u of uniq.slice(0, 40)) console.log('  ' + u)
  console.log('already has 墨泰:', c.includes('墨泰'))
}
