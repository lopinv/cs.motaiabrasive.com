/**
 * Insert a "floatChat" i18n block right after the "wa" block in all 11 locale
 * files (machine-translated, pending native review — same convention as other
 * non-en blocks). Idempotent: skips a locale that already has floatChat.
 * First verifies the JSON round-trip matches the on-disk formatting so the
 * diff stays surgical (only the new block added).
 */
const fs = require('fs')
const path = require('path')

const I18N = 'D:/Code/shopify/motai-static/src/i18n'
const LOCALES = ['en', 'zh', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar']

const BLOCKS = {
  en: {
    trigger: 'Chat',
    open: 'Open chat',
    close: 'Close',
    title: 'MoTai — Live chat',
    status: 'We reply on WhatsApp, usually within 24 hours.',
    greeting: "Hi! How can we help with your abrasive order? — MoTai sales team",
    placeholder: 'Type your message…',
    send: 'Send via WhatsApp',
    note: 'This preview has no live server: sending opens WhatsApp with your message pre-filled. Replies continue in the WhatsApp conversation.'
  },
  zh: {
    trigger: '在线对话',
    open: '打开对话',
    close: '关闭',
    title: '墨泰 — 在线对话',
    status: '我们通过 WhatsApp 回复，通常 24 小时内。',
    greeting: '您好！关于您的磨料订单有什么可以帮您的吗？—— 墨泰销售团队',
    placeholder: '输入您的信息…',
    send: '通过 WhatsApp 发送',
    note: '本预览无实时服务器：发送将打开 WhatsApp 并预填您的信息，后续回复将在 WhatsApp 对话中继续。'
  },
  de: {
    trigger: 'Chat',
    open: 'Chat öffnen',
    close: 'Schließen',
    title: 'MoTai — Live-Chat',
    status: 'Wir antworten über WhatsApp, in der Regel innerhalb von 24 Stunden.',
    greeting: 'Hallo! Wie können wir Ihnen mit Ihrem Schleifmittel-Auftrag helfen? — MoTai-Vertriebsteam',
    placeholder: 'Nachricht eingeben…',
    send: 'Per WhatsApp senden',
    note: 'Diese Vorschau hat keinen Live-Server: Beim Senden wird WhatsApp mit Ihrer vorformulierten Nachricht geöffnet. Antworten laufen im WhatsApp-Dialog weiter.'
  },
  es: {
    trigger: 'Chat',
    open: 'Abrir chat',
    close: 'Cerrar',
    title: 'MoTai — Chat en vivo',
    status: 'Respondemos por WhatsApp, normalmente en menos de 24 horas.',
    greeting: '¡Hola! ¿En qué podemos ayudarle con su pedido de abrasivos? — Equipo de ventas de MoTai',
    placeholder: 'Escriba su mensaje…',
    send: 'Enviar por WhatsApp',
    note: 'Esta vista previa no tiene servidor en vivo: al enviar se abre WhatsApp con su mensaje rellenado. Las respuestas continúan en la conversación de WhatsApp.'
  },
  fr: {
    trigger: 'Discuter',
    open: 'Ouvrir le chat',
    close: 'Fermer',
    title: 'MoTai — Chat en direct',
    status: "Nous répondons sur WhatsApp, généralement sous 24 heures.",
    greeting: "Bonjour ! Comment pouvons-nous vous aider pour votre commande d'abrasifs ? — Équipe commerciale MoTai",
    placeholder: 'Saisissez votre message…',
    send: 'Envoyer via WhatsApp',
    note: "Cette préversion n'a pas de serveur en direct : l'envoi ouvre WhatsApp avec votre message prérempli. Les réponses se poursuivent dans la conversation WhatsApp."
  },
  it: {
    trigger: 'Chat',
    open: 'Apri la chat',
    close: 'Chiudi',
    title: 'MoTai — Chat live',
    status: 'Rispondiamo su WhatsApp, di solito entro 24 ore.',
    greeting: 'Ciao! Come possiamo aiutarti con il tuo ordine di abrasivi? — Team commerciale MoTai',
    placeholder: 'Scrivi il tuo messaggio…',
    send: 'Invia via WhatsApp',
    note: "Questa anteprima non ha un server live: l'invio apre WhatsApp con il tuo messaggio precompilato. Le risposte continuano nella conversazione WhatsApp."
  },
  pt: {
    trigger: 'Conversa',
    open: 'Abrir conversa',
    close: 'Fechar',
    title: 'MoTai — Conversa em direto',
    status: 'Respondemos no WhatsApp, normalmente em menos de 24 horas.',
    greeting: 'Olá! Como podemos ajudar com o seu pedido de abrasivos? — Equipa comercial MoTai',
    placeholder: 'Escreva a sua mensagem…',
    send: 'Enviar via WhatsApp',
    note: 'Esta pré-visualização não tem servidor em tempo real: enviar abre o WhatsApp com a sua mensagem preenchida. As respostas continuam na conversa do WhatsApp.'
  },
  ru: {
    trigger: 'Чат',
    open: 'Открыть чат',
    close: 'Закрыть',
    title: 'MoTai — Чат в прямом эфире',
    status: 'Отвечаем в WhatsApp, обычно в течение 24 часов.',
    greeting: 'Здравствуйте! Чем помочь с вашим заказом абразивов? — Команда продаж MoTai',
    placeholder: 'Введите сообщение…',
    send: 'Отправить через WhatsApp',
    note: 'В этом предпросмотре нет живого сервера: отправка открывает WhatsApp с предзаполненным сообщением. Ответы продолжаются в переписке WhatsApp.'
  },
  ja: {
    trigger: 'チャット',
    open: 'チャットを開く',
    close: '閉じる',
    title: 'MoTai — ライブチャット',
    status: 'WhatsApp で返信いたします（通常 24 時間以内）。',
    greeting: 'こんにちは！耐材の注文で何かお手伝いできることはありますか？— MoTai 営業チーム',
    placeholder: 'メッセージを入力…',
    send: 'WhatsApp で送信',
    note: 'このプレビューにはライブサーバーはありません。送信すると、メッセージが事前に入力された状態で WhatsApp が開きます。返信は WhatsApp のチャットで続きます。'
  },
  ko: {
    trigger: '채팅',
    open: '채팅 열기',
    close: '닫기',
    title: 'MoTai — 실시간 채팅',
    status: 'WhatsApp로 답변드립니다(보통 24시간 이내).',
    greeting: '안녕하세요! 연마재 주문 관련해서 무엇을 도와드릴까요? — MoTai 영업팀',
    placeholder: '메시지를 입력하세요…',
    send: 'WhatsApp으로 보내기',
    note: '이 미리보기에는 라이브 서버가 없습니다. 보내면 메시지가 미리 입력된 상태로 WhatsApp이 열립니다. 답변은 WhatsApp 대화에서 이어집니다.'
  },
  ar: {
    trigger: 'محادثة',
    open: 'افتح المحادثة',
    close: 'إغلاق',
    title: 'MoTai — محادثة مباشرة',
    status: 'نرد عبر واتساب، عادةً خلال 24 ساعة.',
    greeting: 'مرحباً! كيف يمكننا مساعدتك في طلبك من المواد الكاشطة؟ — فريق مبيعات MoTai',
    placeholder: 'اكتب رسالتك…',
    send: 'إرسال عبر واتساب',
    note: 'لا يوجد خادم مباشر في هذا العرض: سيؤدي الإرسال إلى فتح واتساب مع رسالتك المسبقة. تستمر الردود في محادثة واتساب.'
  }
}

for (const loc of LOCALES) {
  const p = path.join(I18N, loc + '.json')
  const raw = fs.readFileSync(p, 'utf8')
  const obj = JSON.parse(raw)
  if (obj.floatChat) { console.log(`${loc}: already has floatChat — skipped`); continue }

  // Verify the round-trip is formatting-stable before touching the file.
  const roundtrip = JSON.stringify(obj, null, 2)
  const tail = raw.endsWith('\n') ? '\n' : ''
  if (roundtrip + tail !== raw) {
    // Still safe to proceed: report it, and re-serialize the whole file.
    console.log(`${loc}: NOTE — on-disk format differs from 2-space JSON round-trip; re-serializing whole file`)
  }

  // Rebuild with floatChat inserted immediately after the wa key.
  const next = {}
  for (const [k, v] of Object.entries(obj)) {
    next[k] = v
    if (k === 'wa') next.floatChat = BLOCKS[loc]
  }
  if (!('floatChat' in next)) throw new '"wa" key missing in ' + loc
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + tail, 'utf8')
  console.log(`${loc}: inserted floatChat after wa`)
}
