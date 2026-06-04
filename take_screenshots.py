import asyncio
from playwright.async_api import async_playwright

SITES = [
    {"slug": "tugranevento", "url": "https://tugranevento.com/"},
]

async def scrape(browser, site):
    base = "C:/Users/makin/OneDrive/Documentos/Vonoa web/vonoaweb-landing/assets"
    slug = site["slug"]
    domain = site["url"].replace("https://","").replace("http://","").rstrip("/")
    context = await browser.new_context(viewport={"width": 1440, "height": 900})
    page = await context.new_page()

    await page.goto(site["url"], wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2500)

    title = await page.title()
    text = await page.evaluate("""
        () => Array.from(document.querySelectorAll('h1,h2,h3,p,nav a'))
            .slice(0,35).map(e=>e.innerText.trim()).filter(t=>t.length>3).join(' | ')
    """)
    links = await page.evaluate("""
        (domain) => Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.href)
            .filter(h => h.includes(domain) && !h.includes('#') && !h.includes('mailto') && !h.includes('tel:') && h !== window.location.href)
            .filter((v,i,a) => a.indexOf(v) === i)
            .slice(0, 3)
    """, domain)

    print(f"\n=== {slug.upper()} ===")
    print(f"TITLE: {title}")
    print(f"CONTENT: {text[:1200]}")
    print(f"LINKS: {links}")

    shots = [(site["url"], f"{base}/{slug}-1.jpg")]
    for i, url in enumerate(links[:3]):
        shots.append((url, f"{base}/{slug}-{i+2}.jpg"))

    # Si hay menos de 4 páginas, completar con scroll de homepage
    if len(shots) < 4:
        await page.goto(site["url"], wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(1500)
        for extra in range(len(shots), 4):
            scroll_y = extra * 900
            await page.evaluate(f"window.scrollTo(0, {scroll_y})")
            await page.wait_for_timeout(700)
            path = f"{base}/{slug}-{extra+1}.jpg"
            await page.screenshot(path=path, type="jpeg", quality=92,
                clip={"x":0,"y":0,"width":1440,"height":900})
            print(f"OK (scroll): {path}")
            shots.append((None, path))

    for url, path in shots:
        if url is None:
            continue
        try:
            await page.goto(url, wait_until="networkidle", timeout=20000)
            await page.wait_for_timeout(2000)
            try: await page.keyboard.press("Escape")
            except: pass
            await page.screenshot(path=path, type="jpeg", quality=92,
                clip={"x":0,"y":0,"width":1440,"height":900})
            print(f"OK: {path}")
        except Exception as e:
            print(f"ERROR {url}: {e}")

    await context.close()

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        await asyncio.gather(*[scrape(browser, s) for s in SITES])
        await browser.close()

asyncio.run(run())
