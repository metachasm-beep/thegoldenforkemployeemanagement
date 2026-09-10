
import os

fonts = [
    "Cinzel", "Playfair Display", "Cormorant Garamond", "Lora", 
    "Merriweather", "Baskervville", "EB Garamond", "Prata", 
    "Bodoni Moda", "Marcellus", "Montserrat", "Julius Sans One", 
    "Old Standard TT", "Antic Didone", "Tenor Sans", "GFS Didot", 
    "Noto Serif Display", "Vollkorn", "Philosopher", "Rufina"
]

google_fonts_url = "https://fonts.googleapis.com/css2?" + "&".join([f"family={f.replace(' ', '+')}:wght@400;600;700" for f in fonts]) + "&display=swap"

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Font Previews</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link href="{google_fonts_url}" rel="stylesheet">
  <style>
    body {{ background: #0a0a0a; color: #fff; margin: 0; padding: 20px; font-family: sans-serif; }}
    .font-card {{ background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s; cursor: pointer; }}
    .font-card:hover {{ background: rgba(255,255,255,0.1); }}
    .logo-container {{ display: flex; align-items: center; gap: 12px; overflow: hidden; }}
    .logo-img {{ width: 32px; height: 32px; border-radius: 8px; object-fit: cover; background: #222; flex-shrink: 0; }}
    .font-name {{ font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }}
    .logo-text {{ font-size: 1.125rem; letter-spacing: 0.05em; font-weight: 600; text-transform: uppercase; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }}
  </style>
</head>
<body>
  <div class="max-w-5xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
"""

for font in fonts:
    html_content += f"""
      <div class="font-card">
        <div style="min-width: 0;">
          <div class="font-name">{font}</div>
          <div class="logo-container">
            <img src="file:///C:/Users/PAUL/.gemini/antigravity/brain/5c2ec3de-18f0-4e96-a3b1-cfbddff24d11/golden_fork_logo_1788988076928.jpg" class="logo-img" />
            <span class="logo-text" style="font-family: '{font}', serif;">
              GOLDEN FORK
            </span>
          </div>
        </div>
      </div>
"""

html_content += """
    </div>
  </div>
</body>
</html>
"""

with open(r"C:\Users\PAUL\.gemini\antigravity\brain\5c2ec3de-18f0-4e96-a3b1-cfbddff24d11\font_previews.html", "w", encoding="utf-8") as f:
    f.write(html_content)

