import re
import sys

def replace_in_file():
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace Hero
    old_hero_pattern = r'(<span class="chip"><i></i>Diseño web · Guadalajara, MX</span>.*?<span class="muted">\+80 PYMES atendidas · Zapopan, Jalisco</span>\s*</div>)'
    
    new_hero = """<span class="chip" style="background: rgba(46, 233, 185, 0.1); color: var(--vw-cyan); border-color: rgba(46, 233, 185, 0.3);">🏆 ÚNICA AGENCIA EN JALISCO ESPECIALIZADA EN IA PARA PYMES</span>
      <h1>Tu PYME compitiendo con <span class="g">Inteligencia Artificial</span></h1>
      <p class="lede">Web + Chatbots + Automatización = Más clientes, menos trabajo manual.<br><br><b>Desde $2,999/mes</b> — Tu competencia ya usa IA, ¿qué esperas?</p>
      <div class="cta-row">
        <a class="btn primary" href="contacto.html">Integra IA hoy mismo →</a>
        <a class="btn ghost" href="#servicios">Ver servicios</a>
      </div>
      <div class="trust">
        <div class="case-study-badge" style="text-align: left; background: rgba(15, 32, 64, 0.6); border: 1px solid var(--border); border-radius: 12px; padding: 16px; font-size: 13px; color: var(--fg-muted); line-height: 1.6; margin-top: 16px; max-width: 480px;">
          <strong style="color: #fff; display: block; margin-bottom: 8px; font-size: 14px;">CASO REAL: Restaurante en Zapopan</strong>
          <span style="color:#ff6b6b">❌ Antes:</span> 5 llamadas perdidas al día = 150 clientes/mes perdidos<br>
          <span style="color:#2EE9B9">✅ Después con chatbot IA:</span> 89% de consultas atendidas 24/7<br>
          <span style="color:#1CA0F4">📈 Resultado:</span> +32 reservas mensuales = +$48,000 MXN/mes
        </div>
      </div>"""
      
    content = re.sub(old_hero_pattern, new_hero, content, flags=re.DOTALL)

    # 2. Replace Services
    old_services_pattern = r'(<div class="services-grid">.*?</section>)'
    
    new_services = """<div class="services-grid">

      <!-- Servicio 1: Chatbots con IA -->
      <article class="svc-card svc-featured reveal delay-1">
        <div class="ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><rect x="6" y="8" width="36" height="28" rx="6" stroke="#2EE9B9" stroke-width="2"/><circle cx="18" cy="22" r="2.5" fill="#1CA0F4"/><circle cx="30" cy="22" r="2.5" fill="#1CA0F4"/><path d="M20 28c2 2 6 2 8 0" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><path d="M24 36v4M20 40h8" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="12" r="4" fill="#2EE9B9" opacity=".3"/><path d="M36 12h4M38 10v4" stroke="#2EE9B9" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <h3>Chatbots con IA</h3>
        <p>Atención al cliente 24/7 en tu web y WhatsApp Business, impulsados por inteligencia artificial.</p>
        <ul class="svc-features">
          <li>Atención 24/7 en WhatsApp + Web</li>
          <li>Calificación automática de leads</li>
          <li>200 conversaciones/mes incluidas</li>
          <li>Integración en tu negocio</li>
        </ul>
        <div class="svc-price">Desde <strong>$2,999</strong> MXN/mes<br><small style="color:var(--fg-muted)">Setup: $4,999 (una sola vez)</small></div>
      </article>

      <!-- Servicio 2: Automatización de Procesos -->
      <article class="svc-card reveal delay-2">
        <div class="ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M12 24a12 12 0 0 1 24 0" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><path d="M36 24a12 12 0 0 1-24 0" stroke="#1CA0F4" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#2EE9B9" opacity=".3"/><path d="M24 20v-8M24 28v8" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/><path d="M8 16l4 2M36 30l4 2M8 32l4-2M36 18l4-2" stroke="#1CA0F4" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <h3>Automatización de Procesos</h3>
        <p>Elimina tareas repetitivas y deja que la tecnología trabaje por ti las 24 horas.</p>
        <ul class="svc-features">
          <li>Cotizaciones automáticas</li>
          <li>Follow-up inteligente</li>
          <li>Hasta 3 procesos automatizados</li>
          <li>Análisis de datos para decisiones</li>
        </ul>
        <div class="svc-price">Desde <strong>$1,999</strong> MXN/mes<br><small style="color:var(--fg-muted)">Setup: $2,999 (una sola vez)</small></div>
      </article>

      <!-- Servicio 3: Diseño Web + IA -->
      <article class="svc-card reveal delay-3">
        <div class="ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><rect x="8" y="4" width="32" height="40" rx="3" stroke="#2EE9B9" stroke-width="2"/><path d="M16 14h16M16 20h10M16 26h14" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/><rect x="16" y="32" width="16" height="6" rx="2" fill="#1CA0F4" opacity=".3"/><path d="M20 35h8" stroke="#1CA0F4" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <h3>Diseño Web + Integración IA</h3>
        <p>Sitios modernos, responsivos y preparados para integrar agentes conversacionales.</p>
        <ul class="svc-features">
          <li>Diseño UX/UI profesional</li>
          <li>Responsivo en todos los dispositivos</li>
          <li>Preparado para Chatbots</li>
          <li>E-commerce con WooCommerce</li>
        </ul>
        <div class="svc-price">Desde <strong>$5,200</strong> MXN</div>
      </article>

      <!-- Servicio 4: Marketing Digital + SEO -->
      <article class="svc-card reveal delay-4">
        <div class="ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M8 38V22l8-6 8 4 8-8 8 4" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="16" r="3" fill="#1CA0F4"/><path d="M8 38h34" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/><rect x="12" y="28" width="6" height="10" rx="1" fill="#2EE9B9" opacity=".2"/><rect x="21" y="24" width="6" height="14" rx="1" fill="#1CA0F4" opacity=".2"/><rect x="30" y="20" width="6" height="18" rx="1" fill="#2EE9B9" opacity=".3"/></svg>
        </div>
        <h3>Marketing Digital + SEO</h3>
        <p>Estrategia integral para que tu negocio aparezca primero y atraiga clientes calificados.</p>
        <ul class="svc-features">
          <li>SEO + Google Ads + Meta Ads</li>
          <li>Creación de contenido con IA</li>
          <li>Gestión de Google Business Profile</li>
          <li>Reportes mensuales de resultados</li>
        </ul>
        <div class="svc-price">Desde <strong>$4,500</strong> MXN/mes</div>
      </article>

      <!-- Servicio 5: Sistemas Personalizados con IA -->
      <article class="svc-card reveal delay-4">
        <div class="ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><rect x="10" y="6" width="28" height="36" rx="4" stroke="#2EE9B9" stroke-width="2"/><circle cx="24" cy="20" r="6" stroke="#1CA0F4" stroke-width="2"/><path d="M24 14v-4M24 26v4M18 20h-4M30 20h4" stroke="#2EE9B9" stroke-width="1.5" stroke-linecap="round"/><path d="M16 34h16" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/><path d="M20 38h8" stroke="#94A3B8" stroke-width="1.2" stroke-linecap="round"/><circle cx="24" cy="20" r="2" fill="#2EE9B9" opacity=".4"/></svg>
        </div>
        <h3>Sistemas a la Medida</h3>
        <p>Soluciones personalizadas para tu industria, integrando inteligencia artificial avanzada.</p>
        <ul class="svc-features">
          <li>APIs de Claude, GPT o locales</li>
          <li>Integración con ERPs o CRMs</li>
          <li>Desarrollo de software personalizado</li>
          <li>Automatización de gran escala</li>
        </ul>
        <div class="svc-price"><strong>Cotización personalizada</strong></div>
      </article>

    </div>
  </div>
</section>"""
    
    content = re.sub(old_services_pattern, new_services, content, flags=re.DOTALL)

    # 3. Replace Pricing Grid (Keep Web Plans, Add AI Plans)
    old_pricing_pattern = r'(<div class="grid-3 plans">.*?<div class="plans-includes">)'
    
    new_pricing = """<div class="section-head reveal">
      <span class="overline">Inteligencia Artificial</span>
      <h2 style="margin-bottom: 20px;">Planes de Automatización e IA</h2>
      <p class="lede-sec">Domina tu mercado y reduce carga operativa con la mejor tecnología.</p>
    </div>
    <div class="grid-3 plans" style="margin-bottom: 80px;">
      
      <article class="plan">
        <span class="overline">Arranque Digital</span>
        <div class="psub">Página web básica + SEO profesional para negocios que inician (Sin IA).</div>
        <div class="price"><span class="cur">$</span><span class="num">8,999</span><span class="unit">MXN (Pago único)</span></div>
        <ul>
          <li>Diseño web profesional</li>
          <li>Hasta 3 secciones (Inicio, Servicios, Contacto)</li>
          <li>Diseño responsivo</li>
          <li>Formulario funcional</li>
          <li>SEO Básico</li>
        </ul>
        <a class="btn ghost full" href="#contacto">Quiero este plan →</a>
      </article>

      <article class="plan hot">
        <span class="badge" style="background:#2EE9B9; color:#07102a;">★ Nuestro Diferenciador</span>
        <span class="overline">Transformación IA</span>
        <div class="psub">Potencia tus ventas con un vendedor virtual 24/7 en tu web y WhatsApp.</div>
        <div class="price" style="margin-bottom: 4px;"><span class="cur">$</span><span class="num">5,999</span><span class="unit">MXN (Setup)</span></div>
        <div style="font-size: 16px; color: #2EE9B9; font-weight: 600; margin-bottom: 20px;">+ $3,999 MXN / mes</div>
        <ul>
          <li><b>Página web optimizada</b></li>
          <li><b>Chatbot IA (WhatsApp + Web)</b></li>
          <li>Calificación de leads automática</li>
          <li><b>1 automatización de procesos</b></li>
          <li>Soporte técnico premium</li>
        </ul>
        <a class="btn primary full" href="#contacto">Quiero este plan →</a>
      </article>

      <article class="plan">
        <span class="overline">Competencia Desleal</span>
        <div class="psub">Para empresas que quieren dominar su nicho y automatizar todo.</div>
        <div class="price" style="margin-bottom: 4px;"><span class="cur">$</span><span class="num">9,999</span><span class="unit">MXN (Setup)</span></div>
        <div style="font-size: 16px; color: #2EE9B9; font-weight: 600; margin-bottom: 20px;">+ $6,999 MXN / mes</div>
        <ul>
          <li>Todo lo del plan Transformación IA</li>
          <li><b>Hasta 3 automatizaciones</b></li>
          <li>Generación de contenido automática</li>
          <li>Análisis de datos avanzado</li>
          <li>Marketing Inteligente (SEO/Ads)</li>
        </ul>
        <a class="btn ghost full" href="#contacto">Quiero este plan →</a>
      </article>

    </div>

    <div class="section-head reveal">
      <span class="overline">Diseño Tradicional</span>
      <h2>Planes solo de Diseño Web</h2>
    </div>
    <div class="grid-3 plans">
      <article class="plan">
        <span class="overline">Plan Impulso</span>
        <div class="psub">Ideal para emprendedores y negocios que necesitan estar en línea.</div>
        <div class="price"><span class="cur">$</span><span class="num">5,200</span><span class="unit">MXN</span></div>
        <ul>
          <li>Hasta 3 secciones</li>
          <li>Diseño responsivo</li>
          <li>Botón de WhatsApp manual</li>
          <li>SEO básico</li>
        </ul>
        <a class="btn ghost full" href="#contacto">Elegir plan →</a>
      </article>
      <article class="plan">
        <span class="overline">Plan Presencia Pro</span>
        <div class="psub">Haz que tu marca destaque con mayor nivel de secciones y diseño.</div>
        <div class="price"><span class="cur">$</span><span class="num">7,400</span><span class="unit">MXN</span></div>
        <ul>
          <li>Hasta 6 secciones</li>
          <li>Animaciones suaves</li>
          <li>Integración con redes</li>
          <li>SEO técnico inicial</li>
        </ul>
        <a class="btn ghost full" href="#contacto">Elegir plan →</a>
      </article>
      <article class="plan">
        <span class="overline">Premium</span>
        <div class="psub">Empieza a vender en línea hoy. Tienda e-commerce.</div>
        <div class="price"><span class="cur">$</span><span class="num">10,500</span><span class="unit">MXN</span></div>
        <ul>
          <li>Tienda en línea (WooCommerce)</li>
          <li>Pasarelas de pago</li>
          <li>Carga de hasta 10 productos</li>
          <li>Analíticas integradas</li>
        </ul>
        <a class="btn ghost full" href="#contacto">Elegir plan →</a>
      </article>
    </div>

    <div class="plans-includes">"""
    
    content = re.sub(old_pricing_pattern, new_pricing, content, flags=re.DOTALL)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    replace_in_file()
