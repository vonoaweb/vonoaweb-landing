import re
import sys

def replace_in_precios():
    with open("precios.html", "r", encoding="utf-8") as f:
        content = f.read()

    # In precios.html, replace the first pricing table and the "Servicios Recurrentes" table
    # Basically replace everything from <section class="section"> down to the footer, and rebuild the structure cleanly
    
    # We will replace from <section class="section"> to <!-- ======= INCLUIDOS ======= -->
    old_pattern = r'(<section class="section">\s*<div class="container">\s*<div class="section-head reveal">.*?<!-- ======= INCLUIDOS ======= -->)'
    
    new_pricing = """<section class="section">
  <div class="container">
    <div class="section-head reveal">
      <span class="overline">Inteligencia Artificial</span>
      <h2 style="margin-bottom: 20px;">Planes de Automatización e IA</h2>
      <p class="lede-sec">Domina tu mercado y reduce carga operativa con la mejor tecnología.</p>
    </div>
    <div class="grid-3 plans reveal" style="margin-bottom: 80px;">
      
      <div class="plan">
        <span class="overline plan-name">Arranque Digital</span>
        <p class="plan-for">Página web básica + SEO profesional para negocios que inician (Sin IA).</p>
        <div class="price"><span class="cur">$</span><span class="big" style="font-size:38px;">8,999</span><span class="unit">MXN (Pago único)</span></div>
        <ul class="plan-list">
          <li>Diseño web profesional</li>
          <li>Hasta 3 secciones (Inicio, Servicios, Contacto)</li>
          <li>Diseño responsivo</li>
          <li>Formulario funcional</li>
          <li>SEO Básico</li>
        </ul>
        <a class="btn ghost full" href="contacto.html">Quiero este plan →</a>
      </div>

      <div class="plan hot">
        <div class="plan-badge" style="background:#2EE9B9; color:#07102a;">★ Nuestro Diferenciador</div>
        <span class="overline plan-name">Transformación IA</span>
        <p class="plan-for">Potencia tus ventas con un vendedor virtual 24/7 en tu web y WhatsApp.</p>
        <div class="price" style="margin-bottom: 4px;"><span class="cur">$</span><span class="big" style="font-size:38px;">5,999</span><span class="unit">MXN (Setup)</span></div>
        <div style="font-size: 16px; color: #2EE9B9; font-weight: 600; margin-bottom: 20px;">+ $3,999 MXN / mes</div>
        <ul class="plan-list">
          <li><b>Página web optimizada</b></li>
          <li><b>Chatbot IA (WhatsApp + Web)</b></li>
          <li>Calificación de leads automática</li>
          <li><b>1 automatización de procesos</b></li>
          <li>Soporte técnico premium</li>
        </ul>
        <a class="btn primary full" href="contacto.html">Quiero este plan →</a>
      </div>

      <div class="plan">
        <span class="overline plan-name">Competencia Desleal</span>
        <p class="plan-for">Para empresas que quieren dominar su nicho y automatizar todo.</p>
        <div class="price" style="margin-bottom: 4px;"><span class="cur">$</span><span class="big" style="font-size:38px;">9,999</span><span class="unit">MXN (Setup)</span></div>
        <div style="font-size: 16px; color: #2EE9B9; font-weight: 600; margin-bottom: 20px;">+ $6,999 MXN / mes</div>
        <ul class="plan-list">
          <li>Todo lo del plan Transformación IA</li>
          <li><b>Hasta 3 automatizaciones</b></li>
          <li>Generación de contenido automática</li>
          <li>Análisis de datos avanzado</li>
          <li>Marketing Inteligente (SEO/Ads)</li>
        </ul>
        <a class="btn ghost full" href="contacto.html">Quiero este plan →</a>
      </div>

    </div>

    <div class="section-head reveal">
      <span class="overline">Diseño Tradicional</span>
      <h2>Planes solo de Diseño Web</h2>
      <p class="lede-sec">Sitios informativos o tiendas en línea de pago único.</p>
    </div>
    <div class="grid-3 plans reveal">
      <div class="plan">
        <span class="overline plan-name">Plan Impulso</span>
        <p class="plan-for">Ideal para emprendedores y negocios que necesitan estar en línea.</p>
        <div class="price"><span class="cur">$</span><span class="big" style="font-size:38px;">5,200</span><span class="unit">MXN</span></div>
        <ul class="plan-list">
          <li>Hasta 3 secciones</li>
          <li>Diseño responsivo</li>
          <li>Botón de WhatsApp manual</li>
          <li>SEO básico</li>
        </ul>
        <a class="btn ghost full" href="contacto.html">Elegir plan →</a>
      </div>
      <div class="plan">
        <span class="overline plan-name">Plan Presencia Pro</span>
        <p class="plan-for">Haz que tu marca destaque con mayor nivel de secciones y diseño.</p>
        <div class="price"><span class="cur">$</span><span class="big" style="font-size:38px;">7,400</span><span class="unit">MXN</span></div>
        <ul class="plan-list">
          <li>Hasta 6 secciones</li>
          <li>Animaciones suaves</li>
          <li>Integración con redes</li>
          <li>SEO técnico inicial</li>
        </ul>
        <a class="btn ghost full" href="contacto.html">Elegir plan →</a>
      </div>
      <div class="plan">
        <span class="overline plan-name">Premium</span>
        <p class="plan-for">Empieza a vender en línea hoy. Tienda e-commerce.</p>
        <div class="price"><span class="cur">$</span><span class="big" style="font-size:38px;">10,500</span><span class="unit">MXN</span></div>
        <ul class="plan-list">
          <li>Tienda en línea (WooCommerce)</li>
          <li>Pasarelas de pago</li>
          <li>Carga de hasta 10 productos</li>
          <li>Analíticas integradas</li>
        </ul>
        <a class="btn ghost full" href="contacto.html">Elegir plan →</a>
      </div>
    </div>
  </div>
</section>

<!-- ======= INCLUIDOS ======= -->"""
    
    content = re.sub(old_pattern, new_pricing, content, flags=re.DOTALL)

    with open("precios.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    replace_in_precios()
