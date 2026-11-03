/**
 * One-off E-E-A-T i18n patch: add `terms` block, `tdk.terms`, `footer.terms`,
 * `glossary.reviewNote` and update `quotePage.consent` for all 11 languages.
 * en/zh are hand-refined; other 9 are first-draft grade (pending native review).
 * Re-inserts keys in stable positions (terms right after privacy).
 */
const fs = require('fs')

function afterKey(obj, anchor, key, val) {
  const out = {}
  for (const k of Object.keys(obj)) {
    out[k] = obj[k]
    if (k === anchor) out[key] = val
  }
  return out
}

const D = '3 November 2026'
const DATA = {
  en: {
    terms: {
      h1: 'Terms of Use',
      sub: 'The conditions that apply when you use this site and send MoTai an enquiry.',
      s1t: 'Use of this site',
      s1b: 'This site is a B2B information and enquiry service operated by Hubei MoTai Abrasives Materials Co., Ltd. Content — product specifications, guides, glossary and blog — is provided in good faith for general information. Using the site means you accept these terms; if you do not, do not submit an enquiry.',
      s2t: 'Enquiries are not offers',
      s2b: 'An enquiry-form submission is an invitation to negotiate, not a binding order. MoTai is not obliged to respond to every enquiry, and no purchase is committed until a quotation is confirmed in writing by both parties.',
      s3t: 'Quotations and pricing',
      s3b: 'All prices are quote-based. Quotations list sizes, grits, packaging, trade terms and validity periods; final figures are settled at the confirmed specification and are subject to raw-material and freight movement.',
      s4t: 'Intellectual property',
      s4b: 'Site content, product descriptions, graphics and the MoTai brand are the property of MoTai Abrasives and may not be reproduced commercially. Third-party references (e.g. model sources) are for buyer orientation only and do not imply endorsement.',
      s5t: 'Liability and governing law',
      s5b: "MoTai is not liable for decisions made in reliance on general information in this site. These terms are governed by the laws of the People's Republic of China; disputes are settled under the sales contract between the parties.",
      updated: 'Last updated ' + D
    },
    tdkTerms: {
      title: 'Terms of Use — MoTai Abrasives',
      description: 'Terms for this B2B abrasive site: enquiry handling, quote-based pricing, intellectual property and governing law.',
      keywords: ['terms of use', 'MoTai', 'B2B abrasive supplier']
    },
    footerTerms: 'Terms of Use',
    glossaryNote: 'Terms are reviewed by the MoTai Abrasives technical team — last reviewed ' + D + '.',
    consent: 'I agree to the Privacy Policy, the Terms of Use, and the use of my details to respond to this enquiry. *'
  },
  zh: {
    terms: {
      h1: '使用条款',
      sub: '使用本站及向墨泰提交询盘时适用的条件。',
      s1t: '网站使用',
      s1b: '本站由墨泰磨料（湖北）有限公司运营，提供 B2B 信息与询盘服务。产品规格、指南、术语表与博客内容基于善意提供，仅供一般信息参考。使用本站即表示接受本条款；如不接受，请勿提交询盘。',
      s2t: '询盘不构成要约',
      s2b: '询盘表单提交是磋商邀请，不是有约束力的订单。墨泰不须回复每一份询盘，且在双方以书面确认报价之前，不产生任何采购承诺。',
      s3t: '报价与价格',
      s3b: '所有价格均为报价制。报价列明尺寸、目数、包装、贸易条款与有效期；最终价格以确认的规格为准，并可能随原材料与运费波动调整。',
      s4t: '知识产权',
      s4b: '本站内容、产品描述、图形及墨泰品牌归墨泰磨料所有，不得商业性复制。第三方参考（如型号出处）仅供买家定位，不构成背书。',
      s5t: '责任与准据法',
      s5b: '墨泰对基于本站一般信息所做的决策不承担责任。本条款适用中华人民共和国法律；争议按双方销售合同约定解决。',
      updated: '最后更新：2026 年 11 月 3 日'
    },
    tdkTerms: {
      title: '使用条款 — 墨泰磨料',
      description: 'B2B 磨料网站使用条款：询盘处理、报价制价格、知识产权与准据法。',
      keywords: ['使用条款', '墨泰', 'B2B 磨料']
    },
    footerTerms: '使用条款',
    glossaryNote: '术语由墨泰磨料技术团队审阅——最近审阅：2026 年 11 月 3 日。',
    consent: '我同意隐私政策、使用条款，并同意为回复此询盘使用我的信息。*'
  },
  de: {
    terms: {
      h1: 'Nutzungsbedingungen',
      sub: 'Die Bedingungen für die Nutzung dieser Website und das Senden einer Anfrage an MoTai.',
      s1t: 'Nutzung der Website',
      s1b: 'Diese Website ist ein B2B-Informations- und Anfrage-Dienst von Hubei MoTai Abrasives Materials Co., Ltd. Inhalte (Spezifikationen, Leitfäden, Glossar, Blog) werden in gutem Glauben zur allgemeinen Information bereitgestellt. Mit der Nutzung akzeptieren Sie diese Bedingungen; andernfalls stellen Sie keine Anfrage.',
      s2t: 'Anfragen sind keine Angebote',
      s2b: 'Eine per Formular übermittelte Anfrage ist eine Verhandlungseinladung, keine verbindliche Bestellung. MoTai ist nicht verpflichtet, jede Anfrage zu beantworten; ein Kauf ist erst mit schriftlich bestätigtem Angebot beider Seiten verbindlich.',
      s3t: 'Angebote und Preise',
      s3b: 'Alle Preise sind Angebotspreise. Angebote nennen Maße, Körnungen, Verpackung, Incoterms und Gültigkeit; Endwerte werden mit der bestätigten Spezifikation festgelegt und können sich mit Rohmaterial und Fracht bewegen.',
      s4t: 'Geistiges Eigentum',
      s4b: 'Inhalte, Produktbeschreibungen, Grafiken und die Marke MoTai gehören MoTai Abrasives und dürfen nicht kommerziell kopiert werden. Drittreferenzen dienen nur der Orientierung und stellen keine Empfehlung dar.',
      s5t: 'Haftung und anwendbares Recht',
      s5b: 'MoTai haftet nicht für Entscheidungen, die auf allgemeinen Informationen dieser Website beruhen. Maßgeblich ist das Recht der Volksrepublik China; Streitigkeiten werden nach dem Kaufvertrag der Parteien geregelt.',
      updated: 'Zuletzt aktualisiert am 3. November 2026'
    },
    tdkTerms: {
      title: 'Nutzungsbedingungen — MoTai Abrasives',
      description: 'Bedingungen für diese B2B-Schleifmittelseite: Anfragen, Angebotspreise, geistiges Eigentum und anwendbares Recht.',
      keywords: ['Nutzungsbedingungen', 'MoTai', 'B2B-Schleifmittel']
    },
    footerTerms: 'Nutzungsbedingungen',
    glossaryNote: 'Begriffe geprüft vom MoTai-Technikteam — zuletzt überarbeitet am 3. November 2026.',
    consent: 'Ich stimme der Datenschutzerklärung, den Nutzungsbedingungen und der Verwendung meiner Angaben zur Beantwortung dieser Anfrage zu. *'
  },
  fr: {
    terms: {
      h1: "Conditions d'utilisation",
      sub: "Les conditions applicables à l'utilisation de ce site et à l'envoi d'une demande à MoTai.",
      s1t: "Utilisation du site",
      s1b: "Ce site est un service d'information et de demande B2B exploité par Hubei MoTai Abrasives Materials Co., Ltd. Les contenus (spécifications, guides, glossaire, blog) sont fournis de bonne foi à titre d'information générale. En utilisant le site, vous acceptez ces conditions ; sinon, n'envoyez pas de demande.",
      s2t: "Une demande n'est pas une offre",
      s2b: "Le formulaire de demande est une invitation à négocier, pas une commande contraignante. MoTai n'est pas tenu de répondre à chaque demande ; aucune commande n'est engagée avant confirmation écrite d'un devis par les deux parties.",
      s3t: 'Devis et prix',
      s3b: "Tous les prix sont donnés sur devis. Un devis précise tailles, grains, emballage, incoterms et durée de validité ; les montants finaux sont fixés sur la spécification confirmée et peuvent évoluer avec la matière première et le fret.",
      s4t: 'Propriété intellectuelle',
      s4b: "Contenus, descriptions, visuels et marque MoTai sont la propriété de MoTai Abrasives et ne peuvent pas être copiés à des fins commerciales. Les références à des tiers servent d'orientation et n'impliquent aucune recommandation.",
      s5t: "Responsabilité et droit applicable",
      s5b: "MoTai n'est pas responsable des décisions prises sur la base d'informations générales de ce site. Ces conditions sont soumises au droit de la République populaire de Chine ; les litiges sont réglés selon le contrat de vente entre les parties.",
      updated: "Dernière mise à jour le 3 novembre 2026"
    },
    tdkTerms: {
      title: "Conditions d'utilisation — MoTai Abrasives",
      description: "Conditions de ce site B2B : traitement des demandes, prix sur devis, propriété intellectuelle et droit applicable.",
      keywords: ["conditions d'utilisation", 'MoTai', 'abrasifs B2B']
    },
    footerTerms: "Conditions d'utilisation",
    glossaryNote: 'Termes vérifiés par l\'équipe technique MoTai — dernière révision le 3 novembre 2026.',
    consent: "J'accepte la Politique de confidentialité, les Conditions d'utilisation et l'utilisation de mes coordonnées pour répondre à cette demande. *"
  },
  es: {
    terms: {
      h1: 'Términos de uso',
      sub: 'Las condiciones aplicables al uso de este sitio y al envío de una consulta a MoTai.',
      s1t: 'Uso de este sitio',
      s1b: 'Este sitio es un servicio B2B de información y consultas operado por Hubei MoTai Abrasives Materials Co., Ltd. El contenido (especificaciones, guías, glosario, blog) se ofrece de buena fe con fines informativos. Al usar el sitio acepta estos términos; si no, no envíe consultas.',
      s2t: 'Las consultas no son ofertas',
      s2b: 'El formulario es una invitación a negociar, no un pedido vinculante. MoTai no está obligado a responder todas las consultas y ninguna compra queda comprometida hasta que ambas partes confirmen un presupuesto por escrito.',
      s3t: 'Presupuestos y precios',
      s3b: 'Todos los precios son por presupuesto. El presupuesto indica tamaños, granos, embalaje, términos comerciales y validez; las cifras finales se fijan sobre la especificación confirmada y pueden variar con la materia prima y el flete.',
      s4t: 'Propiedad intelectual',
      s4b: 'El contenido, las descripciones, los gráficos y la marca MoTai pertenecen a MoTai Abrasives y no pueden reproducirse con fines comerciales. Las referencias de terceros sirven de orientación y no implican recomendación.',
      s5t: 'Responsabilidad y ley aplicable',
      s5b: 'MoTai no se responsabiliza de decisiones tomadas sobre información general de este sitio. Estos términos rigen por la ley de la República Popular China; las disputas se resuelven según el contrato de venta entre las partes.',
      updated: 'Última actualización 3 de noviembre de 2026'
    },
    tdkTerms: {
      title: 'Términos de uso — MoTai Abrasives',
      description: 'Términos de este sitio B2B: consultas, precios por presupuesto, propiedad intelectual y ley aplicable.',
      keywords: ['términos de uso', 'MoTai', 'abrasivos B2B']
    },
    footerTerms: 'Términos de uso',
    glossaryNote: 'Términos revisados por el equipo técnico de MoTai — última revisión 3 de noviembre de 2026.',
    consent: 'Acepto la Política de Privacidad, los Términos de Uso y el uso de mis datos para responder a esta consulta. *'
  },
  it: {
    terms: {
      h1: 'Termini di utilizzo',
      sub: "Le condizioni applicabili all'uso di questo sito e all'invio di una richiesta a MoTai.",
      s1t: 'Uso di questo sito',
      s1b: "Questo sito è un servizio B2B di informazione e richieste gestito da Hubei MoTai Abrasives Materials Co., Ltd. I contenuti (specifiche, guide, glossario, blog) sono forniti in buona fede a scopo informativo. Usando il sito si accettano questi termini; in caso contrario non inviare richieste.",
      s2t: 'Le richieste non sono offerte',
      s2b: "Il modulo è un invito a negoziare, non un ordine vincolante. MoTai non è tenuto a rispondere a ogni richiesta; nessun acquisto è impegnativo fino alla conferma scritta di un preventivo tra le parti.",
      s3t: 'Preventivi e prezzi',
      s3b: 'Tutti i prezzi sono su preventivo. Il preventivo indica misure, grana, imballaggio, incoterms e validità; le cifre definitive sono fissate sulla specifica confermata e possono variare con materia prima e nolo.',
      s4t: 'Proprietà intellettuale',
      s4b: 'Contenuti, descrizioni, grafica e marchio MoTai sono di MoTai Abrasives e non possono essere riprodotti commercialmente. I riferimenti a terzi sono di orientamento e non implicano approvazione.',
      s5t: 'Responsabilità e legge applicabile',
      s5b: "MoTai non è responsabile di decisioni basate su informazioni generali di questo sito. I termini sono regolati dal diritto della Repubblica Popolare Cinese; le controversie si risolvono secondo il contratto di vendita tra le parti.",
      updated: 'Ultimo aggiornamento 3 novembre 2026'
    },
    tdkTerms: {
      title: 'Termini di utilizzo — MoTai Abrasives',
      description: 'Termini di questo sito B2B: richieste, prezzi su preventivo, proprietà intellettuale e legge applicabile.',
      keywords: ['termini di utilizzo', 'MoTai', 'abrasivi B2B']
    },
    footerTerms: 'Termini di utilizzo',
    glossaryNote: 'Termini verificati dal team tecnico MoTai — ultima verifica 3 novembre 2026.',
    consent: "Accetto la Privacy Policy, i Termini di Utilizzo e l'uso dei miei dati per rispondere a questa richiesta. *"
  },
  pt: {
    terms: {
      h1: 'Termos de utilização',
      sub: 'As condições aplicáveis à utilização deste site e ao envio de uma consulta à MoTai.',
      s1t: 'Uso deste site',
      s1b: "Este site é um serviço B2B de informação e consultas gerido pela Hubei MoTai Abrasives Materials Co., Ltd. O conteúdo (especificações, guias, glossário, blog) é fornecido de boa fé para informação geral. Ao usar o site aceita estes termos; caso contrário, não envie consultas.",
      s2t: 'As consultas não são propostas',
      s2b: 'O formulário é um convite à negociação, não uma encomenda vinculativa. A MoTai não está obrigada a responder a todas as consultas; nenhuma compra fica comprometida antes de um orçamento confirmado por escrito por ambas as partes.',
      s3t: 'Orçamentos e preços',
      s3b: 'Todos os preços são por orçamento. O orçamento indica tamanhos, granulação, embalagem, incoterms e validade; os valores finais são fixados na especificação confirmada e podem variar com a matéria-prima e o frete.',
      s4t: 'Propriedade intelectual',
      s4b: 'Conteúdo, descrições, gráficos e a marca MoTai pertencem à MoTai Abrasives e não podem ser reproduzidos comercialmente. Referências a terceiros servem de orientação e não implicam recomendação.',
      s5t: 'Responsabilidade e lei aplicável',
      s5b: 'A MoTai não é responsável por decisões tomadas com base em informação geral deste site. Estes termos regem-se pelo direito da República Popular da China; as disputas resolvem-se segundo o contrato de venda entre as partes.',
      updated: 'Última atualização 3 de novembro de 2026'
    },
    tdkTerms: {
      title: 'Termos de utilização — MoTai Abrasives',
      description: 'Termos deste site B2B: consultas, preços por orçamento, propriedade intelectual e lei aplicável.',
      keywords: ['termos de utilização', 'MoTai', 'abrasivos B2B']
    },
    footerTerms: 'Termos de utilização',
    glossaryNote: 'Termos revistos pela equipa técnica da MoTai — última revisão 3 de novembro de 2026.',
    consent: 'Aceito a Política de Privacidade, os Termos de Utilização e a utilização dos meus dados para responder a esta consulta. *'
  },
  ru: {
    terms: {
      h1: 'Условия использования',
      sub: 'Условия применения при использовании этого сайта и отправке запроса в MoTai.',
      s1t: 'Использование сайта',
      s1b: 'Этот сайт — B2B-сервис информации и запросов компании Hubei MoTai Abrasives Materials Co., Ltd. Контент (спецификации, гайды, глоссарий, блог) предоставлен добросовестно в информационных целях. Используя сайт, вы принимаете данные условия; в противном случае не отправляйте запросы.',
      s2t: 'Запрос — не оферта',
      s2b: 'Отправка формы — приглашение к переговорам, а не обязывающий заказ. MoTai не обязана отвечать на каждый запрос; закупка фиксируется только после письменного подтверждения коммерческого предложения обеими сторонами.',
      s3t: 'Коммерческие предложения и цены',
      s3b: 'Все цены — по коммерческому предложению. КП указывает размеры, зернистость, упаковку, условия поставки и срок действия; финальные значения подтверждаются в спецификации и могут меняться вслед за сырьём и фрахтом.',
      s4t: 'Интеллектуальная собственность',
      s4b: 'Контент, описания, графика и бренд MoTai принадлежат MoTai Abrasives и не могут воспроизводиться в коммерческих целях. Ссылки на сторонние источники даны для ориентации и не являются одобрением.',
      s5t: 'Ответственность и применимое право',
      s5b: 'MoTai не несёт ответственности за решения, принятые на основе общих сведений сайта. Данные условия регулируются правом Китайской Народной Республики; споры разрешаются по договору купли-продажи сторон.',
      updated: 'Последнее обновление 3 ноября 2026 г.'
    },
    tdkTerms: {
      title: 'Условия использования — MoTai Abrasives',
      description: 'Условия B2B-сайта: запросы, цены по КП, интеллектуальная собственность и применимое право.',
      keywords: ['условия использования', 'MoTai', 'абразивы B2B']
    },
    footerTerms: 'Условия использования',
    glossaryNote: 'Термины проверены техническим отделом MoTai — последняя проверка 3 ноября 2026 г.',
    consent: 'Я согласен с Политикой конфиденциальности, Условиями использования и использованием моих данных для ответа на этот запрос. *'
  },
  ja: {
    terms: {
      h1: '利用規約',
      sub: '当サイトと MoTai への照会送信に適用される条件。',
      s1t: 'サイトの利用',
      s1b: '本サイトは Hubei MoTai Abrasives Materials Co., Ltd. が運営する B2B 情報・照会サービスです。製品仕様・ガイド・用語集・ブログの内容は一般的な情報提供として善意で提供されています。サイトを利用すると本規約に同意したことになります。同意されない場合は、照会をお送りしないでください。',
      s2t: '照会は申込みではありません',
      s2b: 'フォームによる照会は交渉の招待であり、拘束力のある注文ではありません。MoTai はすべての照会への回答を義務付けられておらず、双方の書面による見積確認まで取引が確定しません。',
      s3t: '見積もりと価格',
      s3b: '価格はすべて見積り制です。見積もりにはサイズ・粒度・包装・貿易条件・有効期限を記載します。最終価格は確定仕様で決定し、原材料・運賃の変動により変わる場合があります。',
      s4t: '知的財産権',
      s4b: 'サイト内容・製品説明・画像・MoTai ブランドは MoTai Abrasives に帰属し、商用の複製はできません。第三者の出典は購入者の参考情報であり、推奨を意味しません。',
      s5t: '責任の限定と準拠法',
      s5b: 'MoTai は、本サイトの一般情報に依拠した判断について責任を負いません。本規約は中華人民共和国の法律に準拠し、紛争は双方の売買契約に従って解決します。',
      updated: '最終更新日 2026年11月3日'
    },
    tdkTerms: {
      title: '利用規約 — MoTai Abrasives',
      description: 'B2B 砥石サイトの利用条件：照会処理・見積り制価格・知的財産権・準拠法。',
      keywords: ['利用規約', 'MoTai', 'B2B 砥石']
    },
    footerTerms: '利用規約',
    glossaryNote: '用語は MoTai Abrasives 技術チームがレビュー済み — 最終レビュー日：2026年11月3日。',
    consent: 'プライバシーポリシー、利用規約、および本件への回答における個人情報利用に同意します。 *'
  },
  ko: {
    terms: {
      h1: '이용약관',
      sub: '이 사이트와 MoTai 문의 전송에 적용되는 조건.',
      s1t: '이 사이트의 이용',
      s1b: '이 사이트는 Hubei MoTai Abrasives Materials Co., Ltd.가 운영하는 B2B 정보·문의 서비스입니다. 제품 사양, 가이드, 용어집, 블로그 콘텐츠는 일반적인 정보 제공을 위해 선의에 따라 제공됩니다. 사이트를 이용하면 본 약관에 동의하신 것이며, 동의하지 않으시면 문의를 보내지 마십시오.',
      s2t: '문의는 주문이 아닙니다',
      s2b: '폼 제출은 협상의 초대이지 구속력 있는 주문이 아닙니다. MoTai는 모든 문의에 응답할 의무가 없으며, 양측의 서면 견적 확인 전까지는 구매가 확정되지 않습니다.',
      s3t: '견적과 가격',
      s3b: '모든 가격은 견적제입니다. 견적에는 크기, 입도, 포장, 무역 조건, 유효기간이 명시되며, 최종 금액은 확정 사양에 따라 결정되고 원자재와 운임 변동에 따라 달라질 수 있습니다.',
      s4t: '지식재산권',
      s4b: '사이트 내용, 제품 설명, 그래픽 및 MoTai 브랜드는 MoTai Abrasives의 소유이며 상업적 복제가 불가능합니다. 제3자 출처는 구매자의 참고 정보일 뿐 권장 사항이 아닙니다.',
      s5t: '책임과 적용 법률',
      s5b: 'MoTai는 이 사이트의 일반 정보에 의거한 결정에 대한 책임을 지지 않습니다. 본 약관은 중화인민공화국 법을 적용하며, 분쟁은 양측의 매입계약에 따라 해결됩니다.',
      updated: '마지막 업데이트: 2026년 11월 3일'
    },
    tdkTerms: {
      title: '이용약관 — MoTai Abrasives',
      description: '이 B2B 연마재 사이트의 조건: 문의 처리, 견적제 가격, 지식재산권, 적용 법률.',
      keywords: ['이용약관', 'MoTai', 'B2B 연마재']
    },
    footerTerms: '이용약관',
    glossaryNote: '용어는 MoTai Abrasives 기술팀이 검토 — 마지막 검토: 2026년 11월 3일.',
    consent: '개인정보 처리방침, 이용약관, 그리고 이 문의에 대한 정보 사용에 동의합니다. *'
  },
  ar: {
    terms: {
      h1: 'شروط الاستخدام',
      sub: 'الشروط التي تنطبق على استخدام الموقع وإرسال استفسار إلى MoTai.',
      s1t: 'استخدام هذا الموقع',
      s1b: 'هذا الموقع خدمة معلومات واستفسارات B2B تديرها شركة Hubei MoTai Abrasives Materials Co., Ltd. المحتوى (المواصفات، الأدلة، المسرد، المدونة) يُوفَّر بحسن نية لأغراض إعلامية عامة. باستخدام الموقع تقبل بهذه الشروط؛ وإلا فلا ترسل استفسارًا.',
      s2t: 'الاستفسار ليس عرضًا',
      s2b: 'استبيان الاستفسار دعوة للتفاوض وليس طلبًا ملزمًا. MoTai غير ملزمة بالرد على كل استفسار، ولا يُحدَّد أي شراء حتى يُؤكَّد عرض السعر كتابيًا من الطرفين.',
      s3t: 'عروض الأسعار والأسعار',
      s3b: 'جميع الأسعار بالعرض. يحدد العرض الأحجام والحبيبات والتعبئة وشروط التجارة ومدد الصلاحية؛ الأرقام النهائية تُحسم على المواصفات المؤكدة وقد تتغير مع المواد الخام والأجور.',
      s4t: 'الملكية الفكرية',
      s4b: 'المحتوى ووصف المنتجات والرسوم وعلامة MoTai ملك لـ MoTai Abrasives ولا يجوز إعادة إنتاجها تجاريًا. الإحالات إلى أطراف ثالثة للاسترشاد فقط ولا تعبّر عن رعاية.',
      s5t: 'المسؤولية والقانون الواجب التطبيق',
      s5b: 'MoTai غير مسؤولة عن القرارات المتخذة بناءً على معلومات عامة في هذا الموقع. تخضع هذه الشروط لقوانين جمهورية الصين الشعبية؛ تُحسم النزاعات وفق عقد البيع بين الطرفين.',
      updated: 'آخر تحديث 3 نوفمبر 2026'
    },
    tdkTerms: {
      title: 'شروط الاستخدام — MoTai Abrasives',
      description: 'شروط موقع B2B: معالجة الاستفسارات، أسعار بالعرض، الملكية الفكرية، والقانون الواجب التطبيق.',
      keywords: ['شروط الاستخدام', 'MoTai', 'مواد صنفرة B2B']
    },
    footerTerms: 'شروط الاستخدام',
    glossaryNote: 'راجعها الفريق التقني في MoTai Abrasives — آخر مراجعة 3 نوفمبر 2026.',
    consent: 'أوافق على سياسة الخصوصية وشروط الاستخدام واستخدام بياناتي للرد على هذا الاستفسار. *'
  }
}

for (const [lang, d] of Object.entries(DATA)) {
  const p = 'src/i18n/' + lang + '.json'
  let j = JSON.parse(fs.readFileSync(p, 'utf8'))
  j = afterKey(j, 'privacy', 'terms', d.terms)
  j.tdk = afterKey(j.tdk, 'privacy', 'terms', d.tdkTerms)
  j.footer = afterKey(j.footer, 'privacy', 'terms', d.footerTerms)
  j.glossary.reviewNote = d.glossaryNote
  j.quotePage.consent = d.consent
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n', 'utf8')
  JSON.parse(fs.readFileSync(p, 'utf8'))
  console.log('patched', lang)
}
