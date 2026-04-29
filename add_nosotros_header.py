import os
import glob
import re

def add_nosotros_to_header():
    html_files = glob.glob("*.html")
    
    for filepath in html_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Desktop menu replacements (we might have class="active" on different links)
        # We need to insert <a href="nosotros.html">Nosotros</a> after <a href="index.html"...>Inicio</a>
        
        # This regex matches the "Inicio" link, even if it has class="active"
        # and we append the Nosotros link right after it.
        # But wait, we need to be careful if it already exists.
        if '<a href="nosotros.html"' not in content.split('<div class="links">')[1].split('</div>')[0]:
            # It's not in the desktop menu
            content = re.sub(
                r'(<div class="links">\s*<a href="index\.html"[^>]*>Inicio</a>)',
                r'\1\n      <a href="nosotros.html">Nosotros</a>',
                content
            )
            # Make it active if we are IN nosotros.html
            if filepath == "nosotros.html":
                content = content.replace('<a href="nosotros.html">Nosotros</a>', '<a href="nosotros.html" class="active">Nosotros</a>')

        # Mobile menu replacements
        mobile_menu_section = content.split('<div class="mobile-menu"')[1].split('</div>')[0]
        if '<a href="nosotros.html"' not in mobile_menu_section:
            content = re.sub(
                r'(<div class="mobile-menu"[^>]*>\s*<a href="index\.html"[^>]*>Inicio</a>)',
                r'\1\n  <a href="nosotros.html">Nosotros</a>',
                content
            )

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

if __name__ == '__main__':
    add_nosotros_to_header()
