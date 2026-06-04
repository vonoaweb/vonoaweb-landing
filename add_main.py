import re, os

pages = {
    "nosotros.html":  ('<section class="page-hero">', '<footer class="site-footer">'),
    "servicios.html": ('<section class="page-hero">', '<footer class="site-footer">'),
    "precios.html":   ('<section class="page-hero">', '<footer class="site-footer">'),
    "portafolio.html":('<section class="page-hero">', '<footer class="site-footer">'),
    "contacto.html":  ('<section class="page-hero">', '<footer class="site-footer">'),
}

base = os.path.dirname(__file__)
for fname, (open_marker, close_marker) in pages.items():
    path = os.path.join(base, fname)
    html = open(path, encoding="utf-8").read()
    if "<main>" in html:
        print(f"{fname}: already has <main>, skipped")
        continue
    html = html.replace(open_marker, "<main>\n\n" + open_marker, 1)
    html = html.replace(close_marker, "</main>\n\n" + close_marker, 1)
    open(path, "w", encoding="utf-8").write(html)
    print(f"{fname}: <main> added")
