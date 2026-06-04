from PIL import Image
import os, glob

assets = os.path.join(os.path.dirname(__file__), "assets")
exts = ("*.png", "*.jpg", "*.jpeg")
saved_total = 0

for ext in exts:
    for src in glob.glob(os.path.join(assets, ext)):
        name = os.path.splitext(os.path.basename(src))[0]
        dst = os.path.join(assets, name + ".webp")
        if os.path.exists(dst):
            continue
        try:
            orig_size = os.path.getsize(src)
            mode = "RGBA" if src.lower().endswith(".png") else "RGB"
            img = Image.open(src).convert(mode)
            img.save(dst, "WEBP", quality=82, method=6)
            new_size = os.path.getsize(dst)
            saved = orig_size - new_size
            saved_total += saved
            print(f"  {name}: {orig_size//1024}KB -> {new_size//1024}KB (saved {saved//1024}KB)")
        except Exception as e:
            print(f"  ERROR {name}: {e}")

print(f"\nTotal saved: {saved_total//1024} KB ({saved_total//1048576} MB)")
