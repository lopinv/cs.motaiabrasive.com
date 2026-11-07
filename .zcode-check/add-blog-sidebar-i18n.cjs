/**
 * 为博客页侧栏新增 blogSidebar i18n 键组（27 语种）。
 *
 * 侧栏三个模块共用一套骨架文案。商品分类名复用已本地化的 colt.* 键值
 * （避免同一品类在两处译名不一致）；服务与最新文章的模块标题则用专用
 * 短标签，因为既有键多为长句/动词短语，不适合做列表项与 eyebrow。
 * en 为人工撰写，其余语种机翻（待母语审校，沿用 tocTitle 惯例）。
 * 幂等：已含 blogSidebar 的语种跳过。
 */
const fs = require('fs')
const path = require('path')

const I18N = path.join(__dirname, '..', 'src', 'i18n')
const LOCALES = fs.readdirSync(I18N).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort()

// 顺序：[eyebrow, productsTitle, productsSub, viewAll,
//        servicesEyebrow, servicesTitle, servicesSub,
//        serviceWholesale, serviceOem, serviceManufacturing, serviceApplications,
//        latestEyebrow, latestTitle]
const T = {
  en: ['Products', 'Featured products', 'Sizes, grits and backings are documented per product; MOQ and availability come with the quotation.', 'All products', 'Services', 'From selection to supply', 'Wholesale supply, private-label packing and process checks, confirmed in the quotation.', 'Wholesale quote', 'OEM & private label', 'Manufacturing', 'Applications', 'News', 'Latest guides'],
  zh: ['产品', '精选产品', '每款产品的尺寸、粒度与背衬均有文档说明；起订量与供货情况以报价为准。', '全部产品', '服务', '从选型到供货', '批发供货、私牌包装与工序检验，具体以报价确认。', '批发询价', 'OEM 与私牌定制', '制造能力', '应用领域', '新闻', '最新文章'],
  'zh-Hant': ['產品', '精選產品', '每款產品的尺寸、粒度與背襯均有文件說明；起訂量與供貨情況以報價為準。', '全部產品', '服務', '從選型到供貨', '批發供貨、私牌包裝與工序檢驗，具體以報價確認。', '批發詢價', 'OEM 與私牌訂製', '製造能力', '應用領域', '新聞', '最新文章'],
  de: ['Produkte', 'Ausgewählte Produkte', 'Maße, Körnungen und Träger sind je Produkt dokumentiert; Mindestabnahmemenge und Verfügbarkeit ergeben sich aus dem Angebot.', 'Alle Produkte', 'Leistungen', 'Von der Auswahl bis zur Lieferung', 'Großhandelslieferung, Eigenmarken-Verpackung und Prozessprüfungen, bestätigt im Angebot.', 'Großhandelsangebot', 'OEM & Eigenmarke', 'Fertigung', 'Anwendungen', 'News', 'Neueste Leitfäden'],
  es: ['Productos', 'Productos destacados', 'Las medidas, granos y soportes están documentados por producto; el pedido mínimo y la disponibilidad se confirman en la cotización.', 'Todos los productos', 'Servicios', 'De la selección al suministro', 'Suministro mayorista, envase de marca privada y controles de proceso, confirmados en la cotización.', 'Cotización mayorista', 'OEM y marca privada', 'Fabricación', 'Aplicaciones', 'Noticias', 'Últimas guías'],
  fr: ['Produits', 'Produits en vedette', 'Dimensions, grains et supports sont documentés par produit ; quantité minimale et disponibilité confirmées au devis.', 'Tous les produits', 'Services', 'De la sélection à la fourniture', 'Fourniture en gros, conditionnement en marque propre et contrôles de process, confirmés au devis.', 'Devis de gros', 'OEM et marque propre', 'Fabrication', 'Applications', 'Actualités', 'Derniers guides'],
  it: ['Prodotti', 'Prodotti in evidenza', 'Dimensioni, grana e supporti sono documentati per prodotto; quantità minima e disponibilità sono confermate nel preventivo.', 'Tutti i prodotti', 'Servizi', 'Dalla selezione alla fornitura', 'Fornitura all\'ingrosso, confezionamento private label e controlli di processo, confermati nel preventivo.', 'Preventivo all\'ingrosso', 'OEM e private label', 'Produzione', 'Applicazioni', 'Notizie', 'Ultime guide'],
  pt: ['Produtos', 'Produtos em destaque', 'Dimensões, grãos e suportes estão documentados por produto; quantidade mínima e disponibilidade são confirmadas no orçamento.', 'Todos os produtos', 'Serviços', 'Da seleção ao fornecimento', 'Fornecimento por atacado, embalagem de marca própria e verificações de processo, confirmados no orçamento.', 'Orçamento por atacado', 'OEM e marca própria', 'Fabricação', 'Aplicações', 'Notícias', 'Últimos guias'],
  ru: ['Продукция', 'Избранные товары', 'Размеры, зернистость и основа документированы для каждого товара; минимальная партия и наличие — в коммерческом предложении.', 'Вся продукция', 'Услуги', 'От подбора до поставки', 'Оптовые поставки, упаковка под собственной торговой маркой и контроль процесса — всё подтверждается в предложении.', 'Оптовый запрос', 'OEM и собственная марка', 'Производство', 'Отрасли', 'Новости', 'Свежие руководства'],
  ja: ['製品', '注目の製品', 'サイズ・粒度・裏貼りは製品ごとに記載しています。最小ロットと供給可否はお見積りにてご確認ください。', '全製品', 'サービス', '選定から供給まで', '卸売供給、自社ブランド包装、工程チェックはお見積りにて確認いたします。', '卸売見積', 'OEM・自社ブランド', '製造体制', '用途', 'ニュース', '最新のガイド'],
  ko: ['제품', '주요 제품', '규격, 입자, 배킹은 제품별로 문서화되어 있으며, 최소 주문 수량과 공급 여부는 견적에서 확인하실 수 있습니다.', '전체 제품', '서비스', '선택에서 공급까지', '도매 공급, 자사 브랜드 포장, 공정 검수는 견적서에서 확인하실 수 있습니다.', '도매 견적', 'OEM 및 자사 브랜드', '제조 역량', '적용 분야', '뉴스', '최신 가이드'],
  ar: ['المنتجات', 'منتجات مميزة', 'المقاسات والحبيبات والدعائم موثقة لكل منتج؛ الحد الأدنى للطلب والتوفر يتبين من عرض السعر.', 'كل المنتجات', 'الخدمات', 'من الاختيار إلى التوريد', 'توريد الجملة وتغليف العلامة الخاصة وفحوص العملية، تُؤكد في عرض السعر.', 'طلب عرض سعر بالجملة', 'OEM والعلامة الخاصة', 'التصنيع', 'مجالات التطبيق', 'الأخبار', 'أحدث الأدلة'],
  he: ['מוצרים', 'מוצרים נבחרים', 'מידות, גרגירים וגבות מתועדים לכל מוצר; כמות מינימום וזמינות נקבעות בהצעת המחיר.', 'כל המוצרים', 'שירותים', 'מבחירה ועד אספקה', 'אספקה בסיטונאות, אריזה במותג פרטי ובקרי תהליך — כולם נקבעים בהצעת המחיר.', 'בקשת הצעת סיטונאות', 'OEM ומותג פרטי', 'ייצור', 'תחומי יישום', 'חדשות', 'מדריכים אחרונים'],
  fa: ['محصولات', 'محصولات منتخب', 'ابعاد، دانه‌بندی و پشتیبانی برای هر محصول مستند شده است؛ حداقل سفارش و موجودایی در پیش‌فاکش مشخص می‌شود.', 'همه محصولات', 'خدمات', 'از انتخاب تا تأمین', 'تأمین عمده، بسته‌بندی برند اختصاصی و بررسی‌های فرآیند، همگی در پیش‌فاکش مشخص می‌شود.', 'استعلام قیمت عمده', 'OEM و برند اختصاصی', 'توانمندی تولید', 'کاربردها', 'اخبار', 'آخرین راهنماها'],
  hi: ['उत्पाद', 'विशेष उत्पाद', 'प्रत्येक उत्पाद के आयाम, कण और बैकिंग दस्तावेज़ित हैं; न्यूनतम ऑर्डर और उपलब्धता कोटेशन में पुष्टि होती है।', 'सभी उत्पाद', 'सेवाएँ', 'चयन से आपूर्ति तक', 'थोक आपूर्ति, प्राइवेट लेबल पैकिंग और प्रोसेस जाँच — सभी कोटेशन में पुष्टि होती हैं।', 'थोक कोटेशन', 'OEM और प्राइवेट लेबल', 'निर्माण क्षमता', 'अनुप्रयोग', 'समाचार', 'नवीनतम गाइड'],
  th: ['สินค้า', 'สินค้าแนะนำ', 'ขนาด เม็ดขัด และพื้นรองรับ ถูกจัดทำเอกสารไว้รายผลิตภัณฑ์ จำนวนสั่งซื้อขั้นต่ำและสถานะสินค้าพร้อมส่ง ขึ้นอยู่กับใบเสนอราคา', 'สินค้าทั้งหมด', 'บริการ', 'ตั้งแต่เลือกสินค้าถึงการจัดส่ง', 'จัดส่งแบบส่งออกให้ร้านค้า แพ็กเกจตรายาณของตนเอง และขั้นตอนตรวจสอบ ยืนยันในใบเสนอราคา', 'ขอใบเสนอราคาส่งออก', 'OEM และตรายาณของตนเอง', 'ความสามารถในการผลิต', 'การนำไปใช้', 'ข่าวสาร', 'คู่มือล่าสุด'],
  vi: ['Sản phẩm', 'Sản phẩm nổi bật', 'Kích thước, độ mài và lớp đế được ghi nhận theo từng sản phẩm; số lượng tối thiểu và tình trạng cung ứng được xác nhận trong báo giá.', 'Tất cả sản phẩm', 'Dịch vụ', 'Từ chọn hàng đến cung ứng', 'Cung ứng sỉ, đóng gói thương hiệu riêng và kiểm tra quy trình — tất cả xác nhận trong báo giá.', 'Báo giá sỉ', 'OEM và thương hiệu riêng', 'Năng lực sản xuất', 'Ứng dụng', 'Tin tức', 'Hướng dẫn mới nhất'],
  id: ['Produk', 'Produk unggulan', 'Ukuran, grit dan lapisan pendukung didokumentasikan per produk; MOQ dan ketersediaan dikonfirmasi pada penawaran harga.', 'Semua produk', 'Layanan', 'Dari pemilihan hingga pasokan', 'Pasokan grosir, kemasan merek sendiri dan pemeriksaan proses, semuanya dikonfirmasi dalam penawaran harga.', 'Penawaran harga grosir', 'OEM & merek sendiri', 'Kapabilitas manufaktur', 'Aplikasi', 'Berita', 'Panduan terbaru'],
  ms: ['Produk', 'Produk pilihan', 'Saiz, grit dan lapisan sokongan didokumentasikan bagi setiap produk; MOQ dan kebolehtersamaan disahkan dalam sebut harga.', 'Semua produk', 'Perkhidmatan', 'Dari pemilihan hingga pembekalan', 'Pembekalan borong, pembungkusan jenama sendiri dan pemeriksaan proses, disahkan dalam sebut harga.', 'Sebut harga borong', 'OEM & jenama sendiri', 'Keupayaan pembuatan', 'Aplikasi', 'Berita', 'Panduan terkini'],
  cs: ['Produkty', 'Vybrané produkty', 'Rozměry, zrnitost a hlavy jsou u každého produktu zdokumentovány; minimální odběr a dostupnost upřesní nabídka.', 'Všechny produkty', 'Služby', 'Od výběru po dodávku', 'Velkoobchodní dodávky, balení pod vlastní značkou a kontroly procesu — vše upřesní nabídka.', 'Velkoobchodní nabídka', 'OEM a vlastní značka', 'Výrobní kapacity', 'Aplikace', 'Novinky', 'Nejnovější průvodce'],
  sk: ['Produkty', 'Vybrané produkty', 'Rozmery, zrnitosť a nošnice sú pri každom produkte zdokumentované; minimálny odber a dostupnosť upresní ponuka.', 'Všetky produkty', 'Služby', 'Od výberu po dodávku', 'Veľkoobchodné dodávky, balenie pod vlastnou značkou a kontroly procesu — všetko upresní ponuka.', 'Veľkoobchodná ponuka', 'OEM a vlastná značka', 'Výrobné kapacity', 'Aplikácie', 'Novinky', 'Najnovšie sprievodcovia'],
  pl: ['Produkty', 'Wybrane produkty', 'Wymiary, granulacja i podłoże są opisane dla każdego produktu; minimalne zamówienie i dostępność potwierdza oferta.', 'Wszystkie produkty', 'Usługi', 'Od doboru do dostawy', 'Dostawa hurtowa, opakowania pod własną marką i kontrole procesu — wszystko potwierdza oferta.', 'Oferta hurtowa', 'OEM i własna marka', 'Możliwości produkcyjne', 'Zastosowania', 'Aktualności', 'Najnowsze przewodniki'],
  da: ['Produkter', 'Udvalgte produkter', 'Mål, kornstørrelse og bagside er dokumenteret pr. produkt; minimumsordre og leveringsdygtighed fremgår af tilbuddet.', 'Alle produkter', 'Ydelser', 'Fra valg til levering', 'En groslevering, emballage med eget brand og proceskontrol bekræftes i tilbuddet.', 'Forespørgsel om tilbud', 'OEM og eget brand', 'Produktionskapacitet', 'Anvendelser', 'Nyheder', 'Nyeste guider'],
  sv: ['Produkter', 'Utvalda produkter', 'Mått, kornighet och bärare dokumenteras per produkt; minimiorder och leveransförmåga bekräftas i offerten.', 'Alla produkter', 'Tjänster', 'Från val till leverans', 'Grossistleverans, förpackning med eget varumärke och processkontroll bekräftas i offerten.', 'Grossistoffert', 'OEM och eget varumärke', 'Tillverkningskapacitet', 'Tillämpningar', 'Nyheter', 'Senaste guider'],
  no: ['Produkter', 'Utvalgte produkter', 'Mål, kornstørrelse og baksider er dokumentert pr. produkt; minimumsordre og tilgjengelighet bekreftes i tilbudet.', 'Alle produkter', 'Tjenester', 'Fra valg til levering', 'Grossistleveranse, emballasje med eget merke og prosesskontroll bekreftes i tilbudet.', 'Grossistforespørsel', 'OEM og eget merke', 'Produksjonskapasitet', 'Applikasjoner', 'Nyheter', 'Nyeste guider'],
  fi: ['Tuotteet', 'Valitut tuotteet', 'Mitat, karheus ja selkälevy on dokumentoitu tuotekohtaisesti; vähimmäistilausmäärä ja saatavuus vahvistetaan tarjouksessa.', 'Kaikki tuotteet', 'Palvelut', 'Valinnasta toimitukseen', 'Tukkutoimitus, oman brändin pakkaus ja prosessitarkastukset vahvistetaan tarjouksessa.', 'Tukkutarjouspyyntö', 'OEM ja oma brändi', 'Tuotantokapasiteetti', 'Sovellukset', 'Uutiset', 'Uusimmat oppaat'],
  tr: ['Ürünler', 'Öne çıkan ürünler', 'Her ürün için ölçüler, zımparalık tane derecesi ve sırt malzemesi belgelenmiştir; minimum sipariş ve teminat teklifte netleşir.', 'Tüm ürünler', 'Hizmetler', 'Seçimden tedariğe', 'Toptan tedarik, kendi markanızda ambalaj ve süreç kontrolleri teklifte netleşir.', 'Toptan fiyat talebi', 'OEM ve kendi markanız', 'Üretim kapasitesi', 'Uygulama alanları', 'Haberler', 'En yeni rehberler']
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  if (obj.blogSidebar) { console.log(`${loc}: already has blogSidebar — skipped`); continue }

  const v = T[loc] ?? T.en
  // 商品分类名复用已本地化的 colt.* 键值：同一个品类在导航、集合页、侧栏
  // 三处译名必须一致，所以这里不重新翻译。
  const block = {
    eyebrow: v[0],
    productsTitle: v[1],
    productsSub: v[2],
    viewAll: v[3],
    servicesEyebrow: v[4],
    servicesTitle: v[5],
    servicesSub: v[6],
    serviceWholesale: v[7],
    serviceOem: v[8],
    serviceManufacturing: v[9],
    serviceApplications: v[10],
    latestEyebrow: v[11],
    latestTitle: v[12],
    catDiscs: obj.colt?.discs?.label ?? 'Sanding Discs',
    catBelts: obj.colt?.belts?.label ?? 'Abrasive Belts',
    catFlap: obj.colt?.flap?.label ?? 'Flap Discs'
  }
  // blogSidebar 紧跟 blogIndex 之后，保持两个阅读上的邻近键在同一语种文件里。
  const out = {}
  for (const [k, val] of Object.entries(obj)) {
    out[k] = val
    if (k === 'blogIndex') out.blogSidebar = block
  }
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + (raw.endsWith('\n') ? '\n' : ''), 'utf8')
  console.log(`${loc}: added blogSidebar`)
}
