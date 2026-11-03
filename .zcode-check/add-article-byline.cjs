const fs = require('fs')
const val = {
  de: ['Geprüft vom MoTai Abrasives Technikteam', 'Zuletzt überarbeitet am {date}'],
  fr: ["Vérifié par l'équipe technique MoTai Abrasives", 'Dernière révision le {date}'],
  es: ['Revisado por el equipo técnico de MoTai Abrasives', 'Última revisión: {date}'],
  it: ['Riveduto dal team tecnico MoTai Abrasives', 'Ultima revisione: {date}'],
  pt: ['Revisado pela equipa técnica da MoTai Abrasives', 'Última revisão: {date}'],
  ru: ['Проверено техническим отделом MoTai Abrasives', 'Последняя проверка: {date}'],
  ja: ['MoTai Abrasives 技術チームがレビュー済み', '最終レビュー日：{date}'],
  ko: ['MoTai Abrasives 기술팀 검토', '마지막 검토: {date}'],
  ar: ['راجعها الفريق التقني في MoTai Abrasives', 'آخر مراجعة: {date}']
}
for (const [l, [rb, lr]] of Object.entries(val)) {
  const p = 'src/i18n/' + l + '.json'
  const raw = fs.readFileSync(p, 'utf8')
  if (/"reviewedBy"/.test(raw)) { console.log('skip', l); continue }
  const j = JSON.parse(raw)
  j.article = Object.assign({}, j.article, { reviewedBy: rb, lastReviewed: lr })
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf8')
  JSON.parse(fs.readFileSync(p, 'utf8')) // verify
  console.log('updated', l)
}
