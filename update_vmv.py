import re

def update_vmv():
    new_vmv_html = """<div class="grid-3 vmv">
      <article class="vmv-card">
        <div class="vmv-ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="16" stroke="#2EE9B9" stroke-width="2"/><circle cx="24" cy="24" r="8" stroke="#1CA0F4" stroke-width="2"/><circle cx="24" cy="24" r="2" fill="#2EE9B9"/><path d="M24 8v-4M24 44v-4M8 24h-4M44 24h-4" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <h3>Misión</h3>
        <p>Impulsar el crecimiento de las PYMES integrando tecnología de vanguardia e inteligencia artificial para optimizar sus ventas y operaciones.</p>
      </article>
      <article class="vmv-card">
        <div class="vmv-ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M24 16c6 0 16 8 16 8s-10 8-16 8-16-8-16-8 10-8 16-8z" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" stroke="#1CA0F4" stroke-width="2"/><circle cx="36" cy="12" r="2" fill="#2EE9B9" opacity=".5"/></svg>
        </div>
        <h3>Visión</h3>
        <p>Ser la agencia líder en México que democratiza el acceso a la IA, transformando negocios tradicionales en empresas digitales imparables.</p>
      </article>
      <article class="vmv-card">
        <div class="vmv-ic">
          <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M10 20l14 18 14-18-8-12H18l-8 12z" stroke="#2EE9B9" stroke-width="2" stroke-linejoin="round"/><path d="M10 20h28M18 8l6 12 6-12M24 20v18" stroke="#1CA0F4" stroke-width="1.5" stroke-linejoin="round"/></svg>
        </div>
        <h3>Valores</h3>
        <p>Innovación constante, transparencia absoluta, resultados medibles y un compromiso total con el crecimiento de cada cliente.</p>
      </article>
    </div>"""

    # Fix index.html
    with open("index.html", "r", encoding="utf-8") as f:
        idx_content = f.read()
    
    idx_content = re.sub(r'<div class="grid-3 vmv">.*?</article>\s*</div>', new_vmv_html, idx_content, flags=re.DOTALL)
    
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(idx_content)

    # Fix nosotros.html
    with open("nosotros.html", "r", encoding="utf-8") as f:
        nos_content = f.read()
    
    # In nosotros.html, we used <div class="grid-3 reveal"> and <div class="vmv-card"> without <article>
    new_vmv_nosotros = new_vmv_html.replace('<div class="grid-3 vmv">', '<div class="grid-3 reveal">').replace('<article', '<div').replace('</article>', '</div>')
    
    nos_content = re.sub(r'<div class="grid-3 reveal">\s*<div class="vmv-card">.*?</div>\s*</div>\s*</div>\s*</section>', new_vmv_nosotros + '\n  </div>\n</section>', nos_content, flags=re.DOTALL)
    
    with open("nosotros.html", "w", encoding="utf-8") as f:
        f.write(nos_content)

if __name__ == '__main__':
    update_vmv()
