/**
 * 为博客分类列表页分页新增 blogPager i18n 键组（27 语种）。
 *
 * 分页器只需 5 个骨架文案；en 人工撰写，其余语种机翻（待母语审校，
 * 沿用 tocTitle / blogSidebar 惯例）。「下一页/上一页」用动词短语，
 * 其余用可数名词与模板串。
 * 幂等：已含 blogPager 的语种跳过。
 */
const fs = require('fs')
const path = require('path')

const I18N = path.join(__dirname, '..', 'src', 'i18n')
const LOCALES = fs.readdirSync(I18N).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()

// 顺序：[navLabel, prev, next, pageOf, rangeLabel]
//   pageOf  : "第 2 / 10 页"，含 {page} {total} 两个占位符
//   range   : "第 25–48 篇，共 223 篇"，含 {from} {to} {count}
const T = {
  en: ['Blog pages', 'Previous', 'Next', 'Page {page} of {total}', 'Guides {from}–{to} of {count}'],
  zh: ['博客分页', '上一页', '下一页', '第 {page} / {total} 页', '第 {from}–{to} 篇，共 {count} 篇'],
  'zh-Hant': ['博客分頁', '上一頁', '下一頁', '第 {page} / {total} 頁', '第 {from}–{to} 篇，共 {count} 篇'],
  de: ['Blogseiten', 'Zurück', 'Weiter', 'Seite {page} von {total}', 'Leitfäden {from}–{to} von {count}'],
  es: ['Páginas del blog', 'Anterior', 'Siguiente', 'Página {page} de {total}', 'Guías {from}–{to} de {count}'],
  fr: ['Pages du blog', 'Précédent', 'Suivant', 'Page {page} sur {total}', 'Guides {from}–{to} sur {count}'],
  it: ['Pagine del blog', 'Precedente', 'Successiva', 'Pagina {page} di {total}', 'Guide {from}–{to} di {count}'],
  pt: ['Páginas do blog', 'Anterior', 'Seguinte', 'Página {page} de {total}', 'Guias {from}–{to} de {count}'],
  ru: ['Страницы блога', 'Назад', 'Далее', 'Страница {page} из {total}', 'Руководства {from}–{to} из {count}'],
  ja: ['ブログのページ', '前へ', '次へ', '{total} ページ中 {page} ページ目', '全 {count} 件中 {from}–{to} 件'],
  ko: ['블로그 페이지', '이전', '다음', '{total}페이지 중 {page}페이지', '전체 {count}건 중 {from}–{to}건'],
  ar: ['صفحات المدونة', 'السابق', 'التالي', 'الصفحة {page} من {total}', 'أدلة {from}–{to} من {count}'],
  he: ['דפי הבלוג', 'הקודם', 'הבא', 'עמוד {page} מתוך {total}', 'מדריכים {from}–{to} מתוך {count}'],
  fa: ['صفحه‌های وبلاگ', 'قبلی', 'بعدی', 'صفحه {page} از {total}', 'راهنماهای {from}–{to} از {count}'],
  hi: ['ब्लॉग पृष्ठ', 'पिछला', 'अगला', '{total} में से {page} पृष्ठ', '{count} में से {from}–{to} गाइड'],
  th: ['หน้าของบล็อก', 'ก่อนหน้า', 'ถัดไป', 'หน้า {page} จาก {total}', 'คู่มือ {from}–{to} จาก {count}'],
  vi: ['Trang blog', 'Trước', 'Sau', 'Trang {page}/{total}', 'Hướng dẫn {from}–{to} trong {count}'],
  id: ['Halaman blog', 'Sebelumnya', 'Berikutnya', 'Halaman {page} dari {total}', 'Panduan {from}–{to} dari {count}'],
  ms: ['Halaman blog', 'Sebelum', 'Seterusnya', 'Halaman {page} daripada {total}', 'Panduan {from}–{to} daripada {count}'],
  cs: ['Stránky blogu', 'Předchozí', 'Další', 'Stránka {page} z {total}', 'Průvodci {from}–{to} z {count}'],
  sk: ['Stránky blogu', 'Predchádzajúca', 'Ďalšia', 'Stránka {page} z {total}', 'Sprievodcovia {from}–{to} z {count}'],
  pl: ['Strony bloga', 'Poprzednia', 'Następna', 'Strona {page} z {total}', 'Przewodniki {from}–{to} z {count}'],
  da: ['Blogsider', 'Forrige', 'Næste', 'Side {page} af {total}', 'Guider {from}–{to} af {count}'],
  sv: ['Bloggsidor', 'Föregående', 'Nästa', 'Sida {page} av {total}', 'Guider {from}–{to} av {count}'],
  no: ['Bloggsider', 'Forrige', 'Neste', 'Side {page} av {total}', 'Guider {from}–{to} av {count}'],
  fi: ['Blogisivut', 'Edellinen', 'Seuraava', 'Sivu {page}/{total}', 'Oppaat {from}–{to}/{count}'],
  tr: ['Blog sayfaları', 'Önceki', 'Sonraki', '{total} sayfadan {page}. sayfa', '{count} rehberden {from}–{to}']
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  if (obj.blogPager) { console.log(`${loc}: already has blogPager — skipped`); continue }

  const v = T[loc] ?? T.en
  const block = {
    navLabel: v[0],
    prev: v[1],
    next: v[2],
    pageOf: v[3],
    range: v[4]
  }
  // blogPager 紧跟 blogSidebar 之后（同为博客页骨架文案）。
  const out = {}
  for (const [k, val] of Object.entries(obj)) {
    out[k] = val
    if (k === 'blogSidebar') out.blogPager = block
  }
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8')
  console.log(`${loc}: added blogPager`)
}
