const https = require('https');
const B = 'https://cs.motaiabrasive.com';
const pages = ['en/', 'en/contact/', 'en/about/'];
function get(p) {
  return new Promise((res) => https.get(B + '/' + p, (r) => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d)); }).on('error',e=>res('ERR '+e.message)));
}
(async () => {
  for (const p of pages) {
    const h = await get(p);
    const c = (re) => h.split(re).length - 1;
    console.log('== ' + p + ' ==');
    console.log('  newBackToTopAnchor :', c('class="back-to-top" aria-label="Back to top" href="#top"'));
    console.log('  oldInlineOnclick   :', c(/onclick="scrollTo/g));
    console.log('  waWindow           :', c('class="wa-window"'));
    console.log('  interceptorScript  :', c("querySelector('.wa-trigger')"));
    console.log('  locationBlock      :', c('class="location-block"'));
    console.log('  mapIframe          :', c('maps.google.com/maps?q=%E6%B9%96'));
    console.log('  factoryImg         :', c('factory-user-v18.webp?v=38784070387920271291793254217'));
  }
})();
