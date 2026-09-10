
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
    .font-card {{ background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }}
    .logo-container {{ display: flex; align-items: center; gap: 12px; }}
    /* Logo placeholder matching the app */
    .logo-img {{ width: 32px; height: 32px; border-radius: 8px; object-fit: cover; background: #222; }}
    
    .font-name {{ font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }}
  </style>
</head>
<body>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-8 text-center">Golden Fork Typography Previews</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
"""

for font in fonts:
    html_content += f"""
      <div class="font-card">
        <div>
          <div class="font-name">{font}</div>
          <div class="logo-container">
            <div class="logo-img flex items-center justify-center text-xs font-bold bg-amber-500 text-white">GF</div>
            <!-- Standardized styling to fit on one line: text-lg, tracking-wide instead of tracking-[0.2em] -->
            <span style="font-family: '{font}', serif; font-size: 1.125rem; letter-spacing: 0.05em; font-weight: 600; text-transform: uppercase; white-space: nowrap;">
              GOLDEN FORK
            </span>
          </div>
        </div>
        <button onclick="alert('Select {font} in chat!')" class="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors">Select</button>
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

