const fs = require('fs');
const zlib = require('zlib');

// Read and concatenate chunks
let b64 = '';
for (let i = 1; i <= 8; i++) {
  const c = fs.readFileSync('chunk' + i + '.js', 'utf8');
  const m = c.match(/"([^"]+)"/);
  if (m) b64 += m[1];
}

// Decode URL-safe base64
b64 = b64.replace(/-/g, '+').replace(/_/g, '/');

// Decompress
let html = zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');

// iOS Fix 1: 100dvh to 100vh
html = html.split('100dvh').join('100vh');

// iOS Fix 2: padStart to manual padding
html = html.split("mm.padStart(2, '0')").join("(mm.length < 2 ? '0' + mm : mm)");
html = html.split("dd.padStart(2, '0')").join("(dd.length < 2 ? '0' + dd : dd)");

// iOS Fix 3: Remove Google Fonts dependency
html = html.split('<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">').join('<!-- Fonts removed for offline support -->');
html = html.split("'Plus Jakarta Sans', system-ui, sans-serif").join("system-ui, -apple-system, 'Segoe UI', sans-serif");

// iOS Fix 4: Add window.onerror handler for debugging
var oe = "window.onerror=function(m,u,l,c,e){var d=document.createElement('div');d.style.cssText='position:fixed;bottom:10px;left:10px;right:10px;background:#dc2626;color:#fff;padding:10px;border-radius:8px;font-size:12px;z-index:99999;font-family:sans-serif';d.textContent='Error: '+m+' (line '+l+')';document.body.appendChild(d);return false;};";
html = html.replace('<script>\n', '<script>\n' + oe + '\n');

// iOS Fix 5: Wrap initWithLogin() in DOMContentLoaded + try-catch
var si = 'function safeInit(){try{initWithLogin();}catch(e){console.error(e);var el=document.getElementById("loginScreen");if(el){el.style.display="flex";}}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",safeInit);}else{safeInit();}';
html = html.replace('\ninitWithLogin();\n', '\n' + si + '\n');

// Update version
html = html.split('v5.7').join('v5.8');

fs.writeFileSync('index.html', html);
console.log('Built index.html: ' + html.length + ' chars, version v5.8');