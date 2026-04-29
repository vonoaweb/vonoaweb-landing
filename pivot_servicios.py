import re
import sys

def replace_in_servicios():
    with open("servicios.html", "r", encoding="utf-8") as f:
        content = f.read()

    # The block starts from <!-- ======= SERVICIO 1: DISEÑO WEB ======= --> to right before <!-- ======= CTA BAND ======= -->
    old_pattern = r'(<!-- ======= SERVICIO 1: DISEÑO WEB ======= -->.*?)(?=<!-- ======= CTA BAND ======= -->)'
    
    new_services = """<!-- ======= SERVICIO 1: CHATBOTS CON IA ======= -->
<section class="section" id="chatbots">
  <div class="container svc-detail reveal">
    <div class="svc-detail-text">
      <span class="overline">Servicio 01</span>
      <h2>Chatbots con IA</h2>
      <p>Implementamos asistentes virtuales inteligentes que atienden a tus clientes las 24 horas, los 7 días de la semana. Conectados a tu web y WhatsApp Business, califican leads y agendan citas automáticamente.</p>
      <ul class="ben-list">
        <li><b>Atención 24/7</b> — en tu sitio web y WhatsApp Business.</li>
        <li><b>Califica leads</b> — identifica clientes potenciales automáticamente.</li>
        <li><b>Agenda citas</b> — sin intervención humana.</li>
        <li><b>Aprende</b> — mejora con cada conversación.</li>
        <li><b>Integración</b> — Facebook Messenger, WhatsApp, tu web.</li>
      </ul>
      <div class="svc-detail-price">
        <span class="overline">Inversión</span>
        <div class="price"><span class="cur">$</span><span class="num">2,999</span><span class="unit">MXN/mes</span></div>
        <span class="muted">Setup: $4,999 (una sola vez)</span>
      </div>
      <a class="btn primary" href="contacto.html">Quiero un chatbot →</a>
    </div>
    <div class="svc-detail-vis">
      <div class="svc-icon-big">
        <svg viewBox="0 0 48 48" width="80" height="80" fill="none"><rect x="6" y="8" width="36" height="28" rx="6" stroke="#2EE9B9" stroke-width="2"/><circle cx="18" cy="22" r="2.5" fill="#1CA0F4"/><circle cx="30" cy="22" r="2.5" fill="#1CA0F4"/><path d="M20 28c2 2 6 2 8 0" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><path d="M24 36v4M20 40h8" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- ======= SERVICIO 2: AUTOMATIZACIÓN ======= -->
<section class="section alt" id="automatizacion">
  <div class="container svc-detail reverse reveal">
    <div class="svc-detail-text">
      <span class="overline">Servicio 02</span>
      <h2>Automatización de Procesos</h2>
      <p>Eliminamos las tareas repetitivas de tu negocio con flujos de trabajo inteligentes. Desde cotizaciones automáticas hasta follow-ups de leads — la tecnología trabaja por ti las 24 horas.</p>
      <ul class="ben-list">
        <li><b>Cotizaciones automáticas</b> — genera propuestas al instante.</li>
        <li><b>Follow-up inteligente</b> — seguimiento de leads sin esfuerzo.</li>
        <li><b>Contenido para redes</b> — creación asistida por IA.</li>
        <li><b>Análisis de datos</b> — dashboards para tomar decisiones.</li>
        <li><b>Integraciones</b> — conectamos tus herramientas actuales.</li>
      </ul>
      <div class="svc-detail-price">
        <span class="overline">Inversión</span>
        <div class="price"><span class="cur">$</span><span class="num">1,999</span><span class="unit">MXN/mes</span></div>
        <span class="muted">Setup: $2,999 (una sola vez)</span>
      </div>
      <a class="btn primary" href="contacto.html">Automatizar mi negocio →</a>
    </div>
    <div class="svc-detail-vis">
      <div class="svc-icon-big">
        <svg viewBox="0 0 48 48" width="80" height="80" fill="none"><path d="M12 24a12 12 0 0 1 24 0" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><path d="M36 24a12 12 0 0 1-24 0" stroke="#1CA0F4" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#2EE9B9" opacity=".3"/><path d="M24 20v-8M24 28v8" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- ======= SERVICIO 3: DISEÑO WEB ======= -->
<section class="section" id="diseno">
  <div class="container svc-detail reveal">
    <div class="svc-detail-text">
      <span class="overline">Servicio 03</span>
      <h2>Diseño de Páginas Web</h2>
      <p>Creamos sitios web modernos, responsivos y preparados para integrar agentes conversacionales. Cada proyecto incluye identidad visual profesional y experiencia de usuario intuitiva.</p>
      <ul class="ben-list">
        <li><b>Diseño UX/UI profesional</b> — adaptado a tu marca y tu público.</li>
        <li><b>100% responsivo</b> — perfecto en celular, tablet y PC.</li>
        <li><b>SEO básico incluido</b> — para que Google te encuentre.</li>
        <li><b>Preparado para IA</b> — listo para conectar tus chatbots.</li>
        <li><b>Entrega rápida</b> — tu sitio listo en menos de 18 días.</li>
      </ul>
      <div class="svc-detail-price">
        <span class="overline">Inversión</span>
        <div class="price"><span class="cur">$</span><span class="num">5,200</span><span class="unit">MXN</span></div>
        <span class="muted">Precio base · Plan Impulso</span>
      </div>
      <a class="btn primary" href="contacto.html">Cotizar mi página web →</a>
    </div>
    <div class="svc-detail-vis">
      <div class="svc-icon-big">
        <svg viewBox="0 0 48 48" width="80" height="80" fill="none"><rect x="8" y="4" width="32" height="40" rx="3" stroke="#2EE9B9" stroke-width="2"/><path d="M16 14h16M16 20h10M16 26h14" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/><rect x="16" y="32" width="16" height="6" rx="2" fill="#1CA0F4" opacity=".3"/><path d="M20 35h8" stroke="#1CA0F4" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- ======= SERVICIO 4: MARKETING + SEO ======= -->
<section class="section alt" id="marketing">
  <div class="container svc-detail reverse reveal">
    <div class="svc-detail-text">
      <span class="overline">Servicio 04</span>
      <h2>Marketing Digital + SEO</h2>
      <p>Estrategia integral para posicionar tu negocio en Google, atraer tráfico calificado y convertir visitantes en clientes. Combinamos SEO orgánico, Google Ads y Meta Ads para resultados medibles.</p>
      <ul class="ben-list">
        <li><b>SEO + Google Ads + Meta Ads</b> — estrategia integral.</li>
        <li><b>Contenido generado con IA</b> — blogs, landing pages, copys.</li>
        <li><b>Google Business Profile</b> — gestión completa para búsquedas locales.</li>
        <li><b>Reportes mensuales</b> — métricas claras de resultados.</li>
        <li><b>Estrategia a medida</b> — adaptada a tu presupuesto.</li>
      </ul>
      <div class="svc-detail-price">
        <span class="overline">Inversión</span>
        <div class="price"><span class="cur">$</span><span class="num">4,500</span><span class="unit">MXN/mes</span></div>
        <span class="muted">Sin contratos largos · resultados desde el primer mes</span>
      </div>
      <a class="btn primary" href="contacto.html">Quiero más clientes →</a>
    </div>
    <div class="svc-detail-vis">
      <div class="svc-icon-big">
        <svg viewBox="0 0 48 48" width="80" height="80" fill="none"><path d="M8 38V22l8-6 8 4 8-8 8 4" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="16" r="3" fill="#1CA0F4"/><path d="M8 38h34" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/><rect x="12" y="28" width="6" height="10" rx="1" fill="#2EE9B9" opacity=".2"/><rect x="21" y="24" width="6" height="14" rx="1" fill="#1CA0F4" opacity=".2"/><rect x="30" y="20" width="6" height="18" rx="1" fill="#2EE9B9" opacity=".3"/></svg>
      </div>
    </div>
  </div>
</section>

<!-- ======= SERVICIO 5: SISTEMAS CON IA ======= -->
<section class="section" id="sistemas">
  <div class="container svc-detail reveal">
    <div class="svc-detail-text">
      <span class="overline">Servicio 05</span>
      <h2>Sistemas Personalizados con IA</h2>
      <p>Desarrollamos soluciones a medida para tu industria, integrando inteligencia artificial avanzada. Desde APIs de Claude y GPT hasta modelos especializados — lo conectamos con tus sistemas actuales.</p>
      <ul class="ben-list">
        <li><b>Soluciones a medida</b> — diseñadas para tu industria específica.</li>
        <li><b>APIs de IA</b> — Claude, GPT, o modelos especializados.</li>
        <li><b>Integración completa</b> — conectamos con tus sistemas actuales.</li>
        <li><b>Escalable</b> — crece contigo conforme lo necesites.</li>
        <li><b>Soporte continuo</b> — mantenimiento y mejoras incluidas.</li>
      </ul>
      <div class="svc-detail-price">
        <span class="overline">Inversión</span>
        <div class="price"><span class="num" style="font-size:32px">Cotización personalizada</span></div>
        <span class="muted">Cada proyecto es único — cotizamos según tus necesidades</span>
      </div>
      <a class="btn primary" href="contacto.html">Solicitar cotización →</a>
    </div>
    <div class="svc-detail-vis">
      <div class="svc-icon-big featured">
        <svg viewBox="0 0 48 48" width="80" height="80" fill="none"><rect x="10" y="6" width="28" height="36" rx="4" stroke="#2EE9B9" stroke-width="2"/><circle cx="24" cy="20" r="6" stroke="#1CA0F4" stroke-width="2"/><path d="M24 14v-4M24 26v4M18 20h-4M30 20h4" stroke="#2EE9B9" stroke-width="1.5" stroke-linecap="round"/><path d="M16 34h16" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/><circle cx="24" cy="20" r="2" fill="#2EE9B9" opacity=".4"/></svg>
      </div>
    </div>
  </div>
</section>

"""
    
    content = re.sub(old_pattern, new_services, content, flags=re.DOTALL)

    with open("servicios.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    replace_in_servicios()
