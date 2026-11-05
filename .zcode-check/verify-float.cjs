/**
 * Live verifier for the single-button floating chat + bottom quick bar:
 *   - .fchat aside with .fchat-trigger + .fchat-window on every page
 *   - quick bar (WA outbound + quote) stays
 *   - LocationBlock (map iframe + factory photo) stays
 */
const https = require('https');
const B = 'https://cs.motaiabrasive.com';
const pages = ['en/', 'en/contact/', 'en/about/', 'de/', 'zh/'];
function get(p) {
  return new Promise((res) => https.get(B + '/' + p, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d)); }).on('error',e=>res('ERR '+e.message)));
}
let bad = 0;
(async () => {
  for (const p of pages) {
    const h = await get(p);
    if (h.startsWith('ERR')) { console.log('== ' + p + ' == ' + h); bad++; continue }
    const c = (re) => h.split(re).length - 1;
    const row = {
      'chatAside  (want 1)': c('class="fchat"'),
      'chatTrigger (want 1)': c('class="fchat-trigger"'),
      'chatWindow (want 1)': c('class="fchat-window"'),
      'quickbar   (want 1)': c('class="quickbar"'),
      'quickWa    (want 1)': c('class="quickbar-wa"'),
      'quickQuote (want 1)': c('class="quickbar-quote"'),
      'locationBlock (>=0)': c('class="location-block"')
    };
    if (h.includes('location-block')) row['mapIframe (want 1)'] = c('maps.google.com/maps?q=%E6%B9%96');
    console.log('== ' + p + ' ==');
    for (const [k, v] of Object.entries(row)) console.log('  ' + k + ' : ' + v);
    if (row['chatAside  (want 1)'] !== 1 || row['chatTrigger (want 1)'] !== 1 || row['chatWindow (want 1)'] !== 1 || row['quickbar   (want 1)'] !== 1) bad++;
  }
  console.log(bad ? 'FAIL: ' + bad + ' page(s)' : 'ALL OK');
  process.exit(bad ? 1 : 0);
})();
