import asyncio
from playwright.async_api import async_playwright

async def read_site():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        await page.goto("https://tallermetro.com/", wait_until="networkidle", timeout=25000)
        await page.wait_for_timeout(2000)

        # Extraer texto principal de la página
        text = await page.evaluate("""() => {
            const els = document.querySelectorAll('h1, h2, h3, p, .tagline, .description');
            return Array.from(els).slice(0, 30).map(e => e.innerText.trim()).filter(t => t.length > 5).join(' | ');
        }""")

        title = await page.title()
        url = page.url
        print(f"URL: {url}")
        print(f"TITLE: {title}")
        print(f"CONTENT: {text[:1500]}")
        await browser.close()

asyncio.run(read_site())
