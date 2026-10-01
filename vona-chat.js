/* ── Vona: el chatbot de vonoaweb.com ───────────────────────────────────
   Una sola version para todas las paginas (antes habia dos copias pegadas en
   cada HTML y se veian distintas). Se carga con
   <script src="/vona-chat.js?v=N" defer></script> y elige textos y prompt
   segun <html lang>: "en" para /en/, espanol para todo lo demas.

   Habla con el Worker vonoa-api-proxy en /api/vona (mismo dominio, asi la
   CSP de Cloudflare no lo bloquea). El Worker solo lee { system, messages }.

   Los ids y clases (#vonoa-toggle, #vonoa-panel, .vwacta...) son los de
   siempre: site.js excluye .vwacta de su conteo de clics a WhatsApp y
   puede haber disparadores de GTM que dependan de ellos.
   Si cambian precios o condiciones, actualizar SYS_ES / SYS_EN aqui. */
(function () {
  if (window.__vonaChat) return;
  window.__vonaChat = true;

  var EN = /^en/i.test(document.documentElement.lang || '');
  var ICON = '/assets/vona-head-128.webp';
  var WA_NUM = '5215644645574';

  var SYS_ES = [
    'Eres Vona, el agente IA de VonoaWeb, agencia de diseño web e inteligencia artificial en Zapopan, Jalisco, México. Ayudas a PyMEs y emprendedores a entender cómo VonoaWeb puede mejorar su presencia digital con IA, y los guías hacia una consulta gratuita con un asesor humano de nuestro equipo.',
    '',
    'SOBRE VONOAWEB:',
    '- Agencia de diseño web e inteligencia artificial para PYMES en Guadalajara (Zapopan, Jalisco)',
    '- Combinamos diseño web profesional + chatbots IA + automatización de procesos',
    '- Sitios de clientes en línea: Ye6 Otay (logística, San Diego), Jesas Cleaning Service (limpieza, Canadá), CIAPSA (impresión), Fundación BDW, LuBlend (tienda en línea), Reciclaje de la Costa y el rediseño del e-commerce farmacéutico Azul de Metileno. No inventes otros clientes ni cifras de resultados',
    '- Horario: lunes a viernes, de 9:00 a 18:00 (hora del centro de México). Entregas desde 7 días',
    '',
    'PLANES DE IA (nuestro diferenciador):',
    '- Asistente IA: Setup $4,999 + $2,999/mes — Chatbot IA en WhatsApp + Web, atención 24/7, calificación de leads',
    '- Transformación IA ★ (recomendado): Setup $5,999 + $3,999/mes — Web optimizada + Chatbot IA + 1 automatización',
    '- Escala Automática: Setup $9,999 + $6,999/mes — Todo lo anterior + hasta 3 automatizaciones + marketing inteligente',
    '',
    'PLANES DE DISEÑO WEB (pago único):',
    '- Plan Impulso: $5,200 MXN — hasta 3 secciones, responsivo, SEO básico',
    '- Presencia Pro: $7,400 MXN — hasta 6 secciones, animaciones, integración redes',
    '- Premium: $10,500 MXN — tienda WooCommerce, pasarelas de pago, analíticas',
    '',
    'OTROS SERVICIOS:',
    '- Marketing Digital + SEO: desde $4,500 MXN/mes',
    '- Automatización de procesos: desde $1,999 MXN/mes (setup $2,999)',
    '- Sistemas personalizados con IA: cotización a medida',
    'Integraciones: MercadoPago, WhatsApp Business, Meta Pixel, Google Analytics, CRMs.',
    '',
    'CONDICIONES:',
    '- El dominio, el diseño, el código y el contenido son del cliente; si quiere cambiar de proveedor, le ayudamos con el traspaso',
    '- Pago: la mitad al empezar y la mitad al publicar',
    '- Ajustes pequeños sin costo durante los primeros 30 días después de publicar',
    '- Sin contratos forzosos. Precios en pesos mexicanos, IVA no incluido',
    '',
    'PERSONALIDAD:',
    '- Amigable, directo y profesional — no robótico',
    '- Español mexicano natural e informal (tutéalo)',
    '- Respuestas cortas (2-4 oraciones). Usa bullets si hay varios puntos',
    '- Emojis con moderación',
    '- Los precios son los publicados, pero aclara que el alcance final puede variar',
    '- Si no sabes algo: ofrece conectar con un asesor humano del equipo',
    '',
    'FLUJO:',
    '1. Identifica qué necesita el negocio',
    '2. Da info del servicio relevante y recomienda el plan Transformación IA como mejor opción',
    '3. Si hay interés real → pide nombre y giro del negocio',
    '4. Invítalo a consulta gratuita con un asesor humano por WhatsApp',
    'Responde siempre en el idioma del usuario. Nunca menciones nombres propios del equipo.'
  ].join('\n');

  var SYS_EN = [
    'You are Vona, the AI assistant for VonoaWeb, a web design studio that builds fast small-business websites with built-in AI chat assistants. You help small business owners in the US, Canada and Mexico work out what they need, and you guide them toward a free quote.',
    '',
    'ABOUT VONOAWEB:',
    '- A small studio based in Mexico, working US Central Time year round, so there is a six-hour-plus overlap with any US workday',
    '- 10+ years in digital design; live client sites in the US (Ye6 Otay, San Diego), Canada (Jesas Cleaning Service) and Mexico',
    '- We build websites, AI chat assistants, workflow automation and local SEO',
    '- Clients talk directly to the person building the site, not an account manager',
    '- Clients own the domain, the code and every login. Nothing is locked in.',
    '',
    'PRICING (all USD):',
    '- Starter Site: from $900 one-time. Up to 3 pages, custom mobile-first design, contact form, basic SEO. Launches in 1-2 weeks.',
    '- Business Site: from $1,800 one-time. Up to 8 pages, copywriting drafted for them, blog section, local SEO, speed tuning. Launches in 2-4 weeks.',
    '- Site + AI Assistant (most popular): from $2,900 setup plus $299/month. Everything in Business Site plus the AI assistant on site and WhatsApp, hosting, updates and monitoring.',
    '- AI assistant added to an existing site: from $1,200 setup plus $299/month.',
    '- Workflow automation: from $600 per workflow.',
    '- Local SEO: from $450/month, month to month.',
    '- Terms: 50% up front, 50% at launch. Card, bank transfer, PayPal or Wise. Small edits free for 30 days after launch.',
    '',
    'RUSH: a 7-day turnaround is possible when there is a real deadline. Ask about the deadline before promising it.',
    '',
    'PERSONALITY: friendly, direct, plain American English. Keep answers to 2-4 sentences. Emoji sparingly.',
    '',
    'IMPORTANT: never invent case studies, client names, statistics or prices that are not listed above. If you do not know something, say so and offer to have a human answer it.',
    '',
    'FLOW: understand what they need, point at the right plan, ask their name and what kind of business they run, then invite them to fill in the quote form on this page or email hola@vonoaweb.com.'
  ].join('\n');

  var T = EN ? {
    sys: SYS_EN,
    open: 'Open chat with Vona', close: 'Close chat',
    status: 'AI assistant · Online',
    placeholder: 'Type your message...', send: 'Send message',
    foot: 'AI agent by <b>VonoaWeb</b>',
    hint: 'Questions? Ask me 💬',
    greet: function (h) {
      var g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      return g + '! 👋 I am **Vona**, the AI assistant at VonoaWeb.\n\nTell me a little about your business and I will point you at the right thing.';
    },
    chips: [
      { icon: '🌐', label: 'Services and pricing', msg: 'What do you offer and what does it cost?' },
      { icon: '🤖', label: 'How the AI assistant works', msg: 'How does the AI assistant work?' },
      { icon: '🕑', label: 'Timeline and process', msg: 'How long does a website take?' },
      { icon: '📩', label: 'Get a quote', msg: 'I would like a quote' }
    ],
    more: [
      { icon: '❓', label: 'Another question', msg: 'I have another question' },
      { icon: '📩', label: 'Get a quote', msg: 'I would like a quote' }
    ],
    error: 'Something went wrong on my end 😕 Try again, or send the quote form on this page and a human will pick it up.',
    ctaWords: ['quote', 'email', 'contact', 'human', 'form'],
    cta: {
      href: '#contact', blank: false, color: '#2EE9B9',
      icon: '<path d="M9 11h14v10H14l-4 4v-4H9z" fill="none" stroke="#07102a" stroke-width="2" stroke-linejoin="round"/>',
      title: 'Get a free quote from a human',
      sub: 'Reply the same business day',
      track: function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'chat_to_form', source: 'chatbot_en' });
        if (typeof fbq === 'function') fbq('track', 'Contact');
        if (typeof gtag === 'function') gtag('event', 'chat_to_form', { source: 'chatbot_en' });
      },
      closes: true
    }
  } : {
    sys: SYS_ES,
    open: 'Abrir el chat con Vona', close: 'Cerrar el chat',
    status: 'Agente IA · En línea',
    placeholder: 'Escribe tu mensaje...', send: 'Enviar mensaje',
    foot: 'Agente IA de <b>VonoaWeb</b>',
    hint: '¿En qué te puedo ayudar? 💬',
    greet: function (h) {
      var g = h < 12 ? '¡Buenos días!' : h < 20 ? '¡Buenas tardes!' : '¡Buenas noches!';
      return g + ' 👋 Soy **Vona**, la asistente IA de VonoaWeb.\n\n¿Cómo puedo ayudarte? Cuéntame de tu negocio y te oriento.';
    },
    chips: [
      { icon: '🌐', label: 'Servicios y precios', msg: 'Servicios y precios' },
      { icon: '🤖', label: '¿Cómo funciona el chatbot?', msg: '¿Cómo funciona el chatbot?' },
      { icon: '🛒', label: 'Tienda en línea', msg: 'Tienda en línea' },
      { icon: '📞', label: 'Hablar con un asesor', msg: 'Quiero hablar con un asesor' }
    ],
    more: [
      { icon: '❓', label: 'Otra pregunta', msg: 'Tengo otra pregunta' },
      { icon: '📞', label: 'Hablar con un asesor', msg: 'Quiero hablar con un asesor' }
    ],
    error: 'En este momento no puedo contestarte por aquí 🙏 Escríbenos por WhatsApp y te responde una persona del equipo.',
    ctaWords: ['whatsapp', 'consulta', 'asesor', 'humano', 'contac'],
    cta: {
      href: 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent('Hola, Vona me contactó desde vonoaweb.com. Me gustaría una consulta gratuita.'),
      blank: true, color: '#25D366',
      icon: '<path d="M23.3 8.7A10.13 10.13 0 0 0 16 5.7C10.37 5.7 5.8 10.27 5.8 15.9c0 1.8.47 3.56 1.37 5.1L5.7 26.3l5.45-1.43a10.16 10.16 0 0 0 4.85 1.23c5.63 0 10.2-4.57 10.2-10.2 0-2.72-1.06-5.28-2.9-7.2zM16 25.38a8.44 8.44 0 0 1-4.3-1.18l-.31-.18-3.23.85.87-3.15-.2-.33A8.43 8.43 0 0 1 7.53 15.9c0-4.67 3.8-8.47 8.47-8.47a8.47 8.47 0 0 1 8.47 8.47c0 4.67-3.8 8.48-8.47 8.48zm4.65-6.35c-.26-.13-1.51-.74-1.74-.83-.23-.08-.4-.13-.57.13-.17.26-.65.83-.8 1-.15.17-.3.19-.55.06-.26-.13-1.08-.4-2.06-1.27-.76-.68-1.27-1.52-1.42-1.77-.15-.26-.02-.4.11-.52.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.57-1.38-.78-1.89-.2-.5-.42-.43-.57-.44h-.49c-.17 0-.44.06-.67.32-.23.26-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.06.41 1.43.52.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.2-.58.2-1.08.14-1.19-.07-.1-.24-.17-.5-.3z" fill="#fff"/>',
      title: 'Hablar con un asesor en WhatsApp',
      sub: 'Consulta gratuita · Responde rápido',
      track: function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'whatsapp_click', source: 'chatbot_vonoa' });
        if (typeof fbq === 'function') fbq('track', 'Contact');
        if (typeof gtag === 'function') {
          gtag('event', 'whatsapp_click', { source: 'chatbot_vonoa' });
          gtag('event', 'conversion', { send_to: 'AW-10804436682', event_category: 'whatsapp', event_label: 'chatbot' });
        }
      },
      closes: false
    }
  };

  /* ── Estilos ── todo va bajo #vonoa-root para ganarle a styles.css (que da
     color y tamano a todos los <p>) sin borrar los rellenos propios: la
     version anterior usaba "#vonoa-root * { padding: 0 }" y eso dejaba el
     texto pegado a la orilla de las burbujas. */
  var CSS = [
    '#vonoa-root{--vn-navy:#1B2A4A;--vn-navy2:#243563;--vn-bg:#EEF2F8;--vn-ink:#1E293B;--vn-mute:#64748B;--vn-teal:#2EE9B9;--vn-blue:#1CA0F4;font-family:"DM Sans",system-ui,sans-serif}',
    '#vonoa-root,#vonoa-root *{box-sizing:border-box}',
    '#vonoa-root img{display:block;max-width:none}',
    '#vonoa-root button,#vonoa-root textarea{font:inherit;margin:0}',

    /* boton flotante */
    '#vonoa-root #vonoa-toggle{position:fixed;right:24px;bottom:24px;bottom:calc(24px + env(safe-area-inset-bottom,0px));z-index:99999;width:62px;height:62px;padding:0;border:0;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#2b3f6b 0%,#1B2A4A 60%,#14203a 100%);box-shadow:0 0 0 2px rgba(46,233,185,.45),0 10px 28px rgba(4,10,24,.55);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .2s}',
    '#vonoa-root #vonoa-toggle:hover{transform:scale(1.07);box-shadow:0 0 0 2px rgba(46,233,185,.8),0 12px 32px rgba(4,10,24,.6)}',
    '#vonoa-root #vonoa-toggle:focus-visible{outline:3px solid var(--vn-blue);outline-offset:3px}',
    '#vonoa-root .vt-icon{position:absolute;display:flex;align-items:center;justify-content:center;transition:opacity .25s,transform .3s cubic-bezier(.34,1.56,.64,1)}',
    '#vonoa-root .vt-icon.gone{opacity:0;transform:rotate(70deg) scale(.4)}',
    '#vonoa-root .vt-icon img{width:42px;height:auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))}',
    '#vonoa-root #vonoa-pulse{position:fixed;right:24px;bottom:24px;bottom:calc(24px + env(safe-area-inset-bottom,0px));z-index:99998;width:62px;height:62px;border-radius:50%;pointer-events:none;border:2px solid rgba(46,233,185,.45);animation:vonaRing 2.8s ease-out infinite}',
    '#vonoa-root.is-open #vonoa-pulse{display:none}',
    '@keyframes vonaRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.7);opacity:0}}',

    /* globito de "¿En que te puedo ayudar?" */
    '#vonoa-root #vonoa-hint{position:fixed;right:98px;bottom:38px;bottom:calc(38px + env(safe-area-inset-bottom,0px));z-index:99999;background:#fff;color:var(--vn-navy);font-size:14px;font-weight:600;line-height:1.2;padding:10px 16px;border-radius:18px 18px 4px 18px;box-shadow:0 6px 22px rgba(4,10,24,.25);white-space:nowrap;pointer-events:none;opacity:0;transform:translateX(8px) scale(.95);transition:opacity .3s,transform .3s}',
    '#vonoa-root #vonoa-hint.show{opacity:1;transform:none}',

    /* panel */
    '#vonoa-root #vonoa-panel{position:fixed;right:24px;bottom:100px;z-index:99998;width:380px;height:600px;max-height:calc(100vh - 124px);display:flex;flex-direction:column;overflow:hidden;background:var(--vn-bg);border-radius:24px;box-shadow:0 24px 70px rgba(4,10,24,.45),0 0 0 1px rgba(255,255,255,.06);transform:translateY(18px) scale(.97);opacity:0;visibility:hidden;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .2s,visibility 0s linear .3s}',
    '#vonoa-root #vonoa-panel.open{transform:none;opacity:1;visibility:visible;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .2s,visibility 0s}',

    /* encabezado */
    '#vonoa-root .vhdr{display:flex;align-items:center;gap:12px;padding:16px 16px 16px 18px;background:var(--vn-navy);flex-shrink:0}',
    '#vonoa-root .vav{position:relative;width:46px;height:46px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1.5px rgba(46,233,185,.35)}',
    '#vonoa-root .vav img{width:34px;height:auto}',
    '#vonoa-root .vav-dot{position:absolute;right:0;bottom:1px;width:12px;height:12px;border-radius:50%;background:#22C55E;border:2.5px solid var(--vn-navy)}',
    '#vonoa-root .vinfo{flex:1;min-width:0}',
    '#vonoa-root .vname{color:#fff;font-size:16px;font-weight:700;line-height:1.2}',
    '#vonoa-root .vstatus{color:#86EFAC;font-size:12.5px;line-height:1.2;margin-top:3px}',
    '#vonoa-root .vclose{width:36px;height:36px;flex-shrink:0;border:0;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);color:rgba(255,255,255,.75);transition:background .18s,color .18s,transform .18s}',
    '#vonoa-root .vclose:hover{background:rgba(255,255,255,.2);color:#fff;transform:rotate(90deg)}',

    /* mensajes */
    '#vonoa-root #vonoa-msgs{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:18px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}',
    '#vonoa-root .vmrow{display:flex;align-items:flex-end;gap:8px;animation:vonaUp .22s ease}',
    '#vonoa-root .vmrow.vu{justify-content:flex-end}',
    '@keyframes vonaUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '#vonoa-root .vmav{width:30px;height:30px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--vn-navy);box-shadow:0 2px 6px rgba(27,42,74,.25)}',
    '#vonoa-root .vmav img{width:22px;height:auto}',
    '#vonoa-root .vbbl{max-width:82%;padding:11px 15px;font-size:15px;line-height:1.5;word-break:break-word;overflow-wrap:anywhere}',
    '#vonoa-root .vbbl.vb{background:#fff;color:var(--vn-ink);border-radius:18px 18px 18px 6px;box-shadow:0 1px 3px rgba(15,23,42,.08),0 1px 10px rgba(15,23,42,.04)}',
    '#vonoa-root .vbbl.vu2{background:var(--vn-navy);color:#fff;border-radius:18px 18px 6px 18px;box-shadow:0 2px 8px rgba(27,42,74,.25)}',
    '#vonoa-root .vbbl p{margin:0 0 7px;color:inherit;font-size:inherit;line-height:inherit}',
    '#vonoa-root .vbbl p:last-child{margin-bottom:0}',
    '#vonoa-root .vbbl strong{font-weight:700;color:inherit}',
    '#vonoa-root .vbbl ul{margin:2px 0 7px;padding-left:18px}',
    '#vonoa-root .vbbl ul:last-child{margin-bottom:0}',
    '#vonoa-root .vbbl li{margin:0 0 3px}',
    '#vonoa-root .vbbl li.sub{margin-left:16px;list-style:circle}',
    '#vonoa-root .vtypi{display:inline-flex;gap:5px;align-items:center;padding:14px 16px;background:#fff;border-radius:18px 18px 18px 6px;box-shadow:0 1px 3px rgba(15,23,42,.08)}',
    '#vonoa-root .vtd{width:7px;height:7px;border-radius:50%;background:#94A3B8;animation:vonaTd 1.1s ease-in-out infinite}',
    '#vonoa-root .vtd:nth-child(2){animation-delay:.18s}#vonoa-root .vtd:nth-child(3){animation-delay:.36s}',
    '@keyframes vonaTd{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}',

    /* tarjeta para pasar con una persona */
    '#vonoa-root .vwacta{display:flex;align-items:center;gap:12px;margin:2px 0 4px 38px;padding:12px 14px;border-radius:16px;background:#fff;border:1.5px solid #BBF7D0;text-decoration:none;color:inherit;animation:vonaUp .22s ease;transition:background .16s,border-color .16s}',
    '#vonoa-root .vwacta:hover{background:#F0FDF4;border-color:#25D366}',
    '#vonoa-root .vwacta svg{flex-shrink:0}',
    '#vonoa-root .vwat{font-size:14.5px;font-weight:700;color:#15803D;line-height:1.3}',
    '#vonoa-root .vwas{font-size:12.5px;color:var(--vn-mute);margin-top:2px;line-height:1.3}',

    /* opciones rapidas */
    '#vonoa-root #vonoa-chips{display:flex;flex-direction:column;gap:8px;padding:4px 14px 12px;flex-shrink:0}',
    '#vonoa-root #vonoa-chips:empty{display:none}',
    '#vonoa-root .vchp{display:flex;align-items:center;gap:12px;width:100%;padding:9px 12px 9px 9px;border:0;border-radius:14px;background:#fff;cursor:pointer;text-align:left;box-shadow:0 1px 3px rgba(15,23,42,.08);transition:background .15s,transform .15s}',
    '#vonoa-root .vchp:hover{background:var(--vn-navy);transform:translateY(-1px)}',
    '#vonoa-root .vchp-ic{width:36px;height:36px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;line-height:1}',
    '#vonoa-root .vchp:nth-child(1) .vchp-ic{background:rgba(46,233,185,.2)}',
    '#vonoa-root .vchp:nth-child(2) .vchp-ic{background:rgba(184,169,252,.28)}',
    '#vonoa-root .vchp:nth-child(3) .vchp-ic{background:rgba(126,200,250,.28)}',
    '#vonoa-root .vchp:nth-child(4) .vchp-ic{background:rgba(255,213,128,.4)}',
    '#vonoa-root .vchp-lbl{flex:1;font-size:14.5px;font-weight:600;color:var(--vn-navy);line-height:1.3}',
    '#vonoa-root .vchp:hover .vchp-lbl{color:#fff}',
    '#vonoa-root .vchp::after{content:"›";font-size:22px;line-height:1;color:#CBD5E1;padding-right:2px}',

    /* caja de texto */
    '#vonoa-root #vonoa-inarea{display:flex;align-items:flex-end;gap:10px;padding:12px 14px;background:#fff;border-top:1px solid #E2E8F0;flex-shrink:0}',
    '#vonoa-root #vonoa-inp{flex:1;min-height:46px;max-height:104px;padding:12px 15px;border:2px solid transparent;border-radius:14px;background:#F1F5FB;color:#0F172A;font-size:15px;line-height:1.4;resize:none;outline:none;transition:border-color .18s,background .18s}',
    '#vonoa-root #vonoa-inp::placeholder{color:#94A3B8}',
    '#vonoa-root #vonoa-inp:focus{border-color:var(--vn-navy);background:#fff}',
    '#vonoa-root #vonoa-send{width:46px;height:46px;flex-shrink:0;padding:0;border:0;border-radius:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:var(--vn-navy);transition:background .16s}',
    '#vonoa-root #vonoa-send:hover:not(:disabled){background:var(--vn-navy2)}',
    '#vonoa-root #vonoa-send:disabled{background:#E2E8F0;cursor:not-allowed}',
    '#vonoa-root #vonoa-send:disabled svg{stroke:#94A3B8}',
    '#vonoa-root #vonoa-foot{padding:0 8px 9px;background:#fff;text-align:center;font-size:11px;color:#94A3B8;flex-shrink:0}',
    '#vonoa-root #vonoa-foot b{font-weight:600;color:var(--vn-mute)}',

    /* celular: el panel ocupa casi toda la pantalla */
    '@media (max-width:480px){',
    '#vonoa-root #vonoa-toggle,#vonoa-root #vonoa-pulse{right:16px;bottom:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px))}',
    '#vonoa-root #vonoa-hint{right:16px;bottom:90px;bottom:calc(90px + env(safe-area-inset-bottom,0px))}',
    '#vonoa-root #vonoa-panel{left:8px;right:8px;width:auto;top:8px;top:calc(8px + env(safe-area-inset-top,0px));bottom:90px;bottom:calc(90px + env(safe-area-inset-bottom,0px));height:auto;max-height:none;border-radius:20px}',
    '}',
    '@media (prefers-reduced-motion:reduce){#vonoa-root *{animation:none!important;transition:none!important}}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'vona-chat-css';
  style.textContent = CSS;
  document.head.appendChild(style);

  var X_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var root = document.createElement('div');
  root.id = 'vonoa-root';
  root.innerHTML =
    '<div id="vonoa-pulse"></div>' +
    '<div id="vonoa-hint" aria-hidden="true">' + T.hint + '</div>' +
    '<button id="vonoa-toggle" type="button" aria-label="' + T.open + '" aria-expanded="false" aria-controls="vonoa-panel">' +
      '<span class="vt-icon" id="vtic1"><img src="' + ICON + '" alt="" width="42" height="29"></span>' +
      '<span class="vt-icon gone" id="vtic2">' + X_ICON + '</span>' +
    '</button>' +
    '<div id="vonoa-panel" role="dialog" aria-label="Chat con Vona">' +
      '<div class="vhdr">' +
        '<div class="vav"><img src="' + ICON + '" alt="" width="34" height="24"><span class="vav-dot"></span></div>' +
        '<div class="vinfo"><div class="vname">Vona · VonoaWeb</div><div class="vstatus">' + T.status + '</div></div>' +
        '<button class="vclose" type="button" aria-label="' + T.close + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div id="vonoa-msgs" aria-live="polite"></div>' +
      '<div id="vonoa-chips"></div>' +
      '<div id="vonoa-inarea">' +
        '<textarea id="vonoa-inp" rows="1" placeholder="' + T.placeholder + '" aria-label="' + T.placeholder + '"></textarea>' +
        '<button id="vonoa-send" type="button" aria-label="' + T.send + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>' +
      '<div id="vonoa-foot">' + T.foot + '</div>' +
    '</div>';
  if (EN) root.querySelector('#vonoa-panel').setAttribute('aria-label', 'Chat with Vona');
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var toggle = $('vonoa-toggle'), panel = $('vonoa-panel'), msgs = $('vonoa-msgs');
  var chips = $('vonoa-chips'), inp = $('vonoa-inp'), sendBtn = $('vonoa-send');
  var hint = $('vonoa-hint'), ic1 = $('vtic1'), ic2 = $('vtic2');
  var hist = [], busy = false, isOpen = false, greeted = false, ctaEl = null;

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* Markdown minimo. Llama escribe listas con "-", "*", "+" o "•" (a veces
     anidadas con "+" o con sangria) y titulos con "###"; todo eso se convierte
     aqui, si no se ven los simbolos sueltos en la burbuja. */
  function inline(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  }
  function md(t) {
    var out = '', ul = false;
    esc(t).split('\n').forEach(function (l) {
      var m = l.match(/^(\s*)([-*+•])\s+(.+)/);
      if (m) {
        if (!ul) { out += '<ul>'; ul = true; }
        var sub = m[1].length >= 2 || m[2] === '+';
        out += '<li' + (sub ? ' class="sub"' : '') + '>' + inline(m[3]) + '</li>';
        return;
      }
      if (ul) { out += '</ul>'; ul = false; }
      var h = l.match(/^\s*#{1,4}\s+(.+)/);
      if (h) out += '<p><strong>' + inline(h[1]) + '</strong></p>';
      else if (l.trim()) out += '<p>' + inline(l.trim()) + '</p>';
    });
    if (ul) out += '</ul>';
    return out;
  }

  function scroll() { msgs.scrollTop = msgs.scrollHeight; }

  function addBot(txt) {
    var r = document.createElement('div');
    r.className = 'vmrow';
    r.innerHTML = '<div class="vmav"><img src="' + ICON + '" alt="" width="22" height="15"></div><div class="vbbl vb"></div>';
    var b = r.querySelector('.vbbl');
    b.innerHTML = md(txt);
    msgs.appendChild(r); scroll();
    return b;
  }
  function addUser(txt) {
    var r = document.createElement('div');
    r.className = 'vmrow vu';
    r.innerHTML = '<div class="vbbl vu2"></div>';
    r.firstChild.textContent = txt;
    msgs.appendChild(r); scroll();
  }
  function showTyping() {
    var r = document.createElement('div');
    r.className = 'vmrow'; r.id = 'vtyp';
    r.innerHTML = '<div class="vmav"><img src="' + ICON + '" alt="" width="22" height="15"></div><div class="vtypi"><div class="vtd"></div><div class="vtd"></div><div class="vtd"></div></div>';
    msgs.appendChild(r); scroll();
  }
  function hideTyping() { var t = $('vtyp'); if (t) t.remove(); }

  function setChips(list) {
    chips.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'vchp';
      b.innerHTML = '<span class="vchp-ic" aria-hidden="true">' + c.icon + '</span><span class="vchp-lbl"></span>';
      b.querySelector('.vchp-lbl').textContent = c.label;
      b.addEventListener('click', function () { chips.innerHTML = ''; send(c.msg); });
      chips.appendChild(b);
    });
  }

  function showCTA() {
    if (ctaEl) { msgs.appendChild(ctaEl); scroll(); return; }
    var c = T.cta, a = document.createElement('a');
    a.className = 'vwacta';
    a.href = c.href;
    if (c.blank) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="' + c.color + '"/>' + c.icon + '</svg>' +
      '<div><div class="vwat">' + c.title + '</div><div class="vwas">' + c.sub + '</div></div>';
    a.addEventListener('click', function () { c.track(); if (c.closes && isOpen) setOpen(false); });
    ctaEl = a;
    msgs.appendChild(a); scroll();
  }

  function setOpen(open) {
    isOpen = open;
    panel.classList.toggle('open', open);
    root.classList.toggle('is-open', open);
    ic1.classList.toggle('gone', open);
    ic2.classList.toggle('gone', !open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? T.close : T.open);
    hint.classList.remove('show');
    if (open) {
      if (!greeted) {
        greeted = true;
        addBot(T.greet(new Date().getHours()));
        setChips(T.chips);
      } else if (window.matchMedia('(min-width: 481px)').matches) {
        setTimeout(function () { inp.focus(); }, 250);
      }
    }
  }
  window.vonoaToggle = function () { setOpen(!isOpen); };

  function send(txt) {
    if (busy) return;
    addUser(txt);
    hist.push({ role: 'user', content: txt });
    ask();
  }

  function finish() { busy = false; sendBtn.disabled = false; }

  function ask() {
    busy = true; sendBtn.disabled = true; showTyping();
    fetch('/api/vona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: T.sys, messages: hist })
    }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
      var reader = res.body.getReader(), dec = new TextDecoder();
      var buf = '', full = '', bubble = null;
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            hideTyping();
            if (!full.trim()) throw new Error('vacio');
            if (!bubble) bubble = addBot(full);
            bubble.innerHTML = md(full); scroll();
            hist.push({ role: 'assistant', content: full });
            var lo = full.toLowerCase();
            if (T.ctaWords.some(function (w) { return lo.indexOf(w) > -1; })) showCTA();
            else if (hist.length >= 4) setChips(T.more);
            finish();
            return;
          }
          buf += dec.decode(chunk.value, { stream: true });
          var lines = buf.split('\n'); buf = lines.pop();
          lines.forEach(function (ln) {
            if (ln.indexOf('data: ') !== 0) return;
            var d = ln.slice(6).trim();
            if (!d || d === '[DONE]') return;
            try {
              var j = JSON.parse(d);
              if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta') {
                full += j.delta.text;
                if (!bubble) { hideTyping(); bubble = addBot(''); }
                bubble.innerHTML = md(full + ' ▍'); scroll();
              }
            } catch (e) { /* linea incompleta: llega en el siguiente pedazo */ }
          });
          return pump();
        });
      }
      return pump();
    }).catch(function () {
      hideTyping();
      if (hist.length && hist[hist.length - 1].role === 'user') hist.pop();
      addBot(T.error);
      showCTA();
      finish();
    });
  }

  toggle.addEventListener('click', function () { setOpen(!isOpen); });
  panel.querySelector('.vclose').addEventListener('click', function () { setOpen(false); toggle.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) { setOpen(false); toggle.focus(); } });
  inp.addEventListener('input', function () { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 104) + 'px'; });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendFromInput(); }
  });
  sendBtn.addEventListener('click', sendFromInput);
  function sendFromInput() {
    var t = inp.value.trim();
    if (!t || busy) return;
    inp.value = ''; inp.style.height = 'auto';
    chips.innerHTML = '';
    send(t);
  }

  /* El globito sale a los 2.5 s y se va a los 5 s, solo si el chat sigue cerrado. */
  setTimeout(function () {
    if (isOpen) return;
    hint.classList.add('show');
    setTimeout(function () { hint.classList.remove('show'); }, 5000);
  }, 2500);
})();
