import sys

def fix_nosotros():
    with open("nosotros.html", "r", encoding="utf-8") as f:
        content = f.read()

    new_vmv = """<!-- Visión, Misión, Valores -->
<section class="section">
  <div class="container">
    <div class="grid-3 reveal">
      <div class="vmv-card">
        <div class="vmv-ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="16" stroke="#2EE9B9" stroke-width="2"/><circle cx="24" cy="24" r="8" stroke="#1CA0F4" stroke-width="2"/><circle cx="24" cy="24" r="2" fill="#2EE9B9"/><path d="M24 8v-4M24 44v-4M8 24h-4M44 24h-4" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <h3>Misión</h3>
        <p>Impulsar el crecimiento digital de las PYMES en México con soluciones accesibles, funcionales y visualmente impactantes.</p>
      </div>
      <div class="vmv-card">
        <div class="vmv-ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M24 16c6 0 16 8 16 8s-10 8-16 8-16-8-16-8 10-8 16-8z" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" stroke="#1CA0F4" stroke-width="2"/><circle cx="36" cy="12" r="2" fill="#2EE9B9" opacity=".5"/></svg>
        </div>
        <h3>Visión</h3>
        <p>Ser la agencia de referencia en Jalisco para PYMES que buscan digitalizarse con estrategia, diseño y tecnología de punta.</p>
      </div>
      <div class="vmv-card">
        <div class="vmv-ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M10 20l14 18 14-18-8-12H18l-8 12z" stroke="#2EE9B9" stroke-width="2" stroke-linejoin="round"/><path d="M10 20h28M18 8l6 12 6-12M24 20v18" stroke="#1CA0F4" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </div>
        <h3>Valores</h3>
        <p>Transparencia total, calidad sobre cantidad, relaciones a largo plazo y resultados medibles para cada cliente.</p>
      </div>
    </div>
  </div>
</section>

<!-- Por qué elegirnos -->"""

    content = content.replace("<!-- Por qué elegirnos -->", new_vmv)

    with open("nosotros.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    fix_nosotros()
