import re

def fix_index_vmv():
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern for Vision
    old_vision = r'<div class="vmv-ic"><img src="https://vonoaweb.com/wp-content/uploads/2023/09/1X_Hosting_Small-Icon_09.png" alt="" onerror="this.style.display=\'none\'"></div>'
    new_vision = '<div class="vmv-ic"><svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M24 16c6 0 16 8 16 8s-10 8-16 8-16-8-16-8 10-8 16-8z" stroke="#2EE9B9" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" stroke="#1CA0F4" stroke-width="2"/><circle cx="36" cy="12" r="2" fill="#2EE9B9" opacity=".5"/></svg></div>'
    
    # Pattern for Mision
    old_mision = r'<div class="vmv-ic"><img src="https://vonoaweb.com/wp-content/uploads/2023/09/1X_Hosting_Small-Icon_17.png" alt="" onerror="this.style.display=\'none\'"></div>'
    new_mision = '<div class="vmv-ic"><svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="16" stroke="#2EE9B9" stroke-width="2"/><circle cx="24" cy="24" r="8" stroke="#1CA0F4" stroke-width="2"/><circle cx="24" cy="24" r="2" fill="#2EE9B9"/><path d="M24 8v-4M24 44v-4M8 24h-4M44 24h-4" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/></svg></div>'
    
    # Pattern for Valores
    old_valores = r'<div class="vmv-ic"><img src="https://vonoaweb.com/wp-content/uploads/2023/09/1X_Hosting_Small-Icon_08.png" alt="" onerror="this.style.display=\'none\'"></div>'
    new_valores = '<div class="vmv-ic"><svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M10 20l14 18 14-18-8-12H18l-8 12z" stroke="#2EE9B9" stroke-width="2" stroke-linejoin="round"/><path d="M10 20h28M18 8l6 12 6-12M24 20v18" stroke="#1CA0F4" stroke-width="1.5" stroke-linejoin="round"/></svg></div>'

    content = content.replace(old_vision, new_vision)
    content = content.replace(old_mision, new_mision)
    content = content.replace(old_valores, new_valores)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == '__main__':
    fix_index_vmv()
