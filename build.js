const fs = require('fs');
const zlib = require('zlib');

// Read and concatenate chunks
var b64 = '';
for (var i = 1; i <= 8; i++) {
  var c = fs.readFileSync('chunk' + i + '.js', 'utf8');
  var m = c.match(/"([^"]+)"/);
  if (m) b64 += m[1];
}

// Decode URL-safe base64
b64 = b64.replace(/-/g, '+').replace(/_/g, '/');

// Decompress
var html = zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');

// ===== iOS FIX 1: 100dvh to 100vh =====
html = html.split('100dvh').join('100vh');

// ===== iOS FIX 2: padStart to manual padding =====
html = html.split("mm.padStart(2, '0')").join("(mm.length < 2 ? '0' + mm : mm)");
html = html.split("dd.padStart(2, '0')").join("(dd.length < 2 ? '0' + dd : dd)");

// ===== iOS FIX 3: Remove Google Fonts =====
html = html.split('<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">').join('<!-- Fonts removed -->');
html = html.split("'Plus Jakarta Sans', system-ui, sans-serif").join("system-ui, -apple-system, 'Segoe UI', sans-serif");

// ===== iOS FIX 4: window.onerror handler =====
var oe = "window.onerror=function(m,u,l,c,e){var d=document.createElement('div');d.style.cssText='position:fixed;bottom:10px;left:10px;right:10px;background:#dc2626;color:#fff;padding:10px;border-radius:8px;font-size:12px;z-index:99999;font-family:sans-serif';d.textContent='Error: '+m+' (line '+l+')';document.body.appendChild(d);return false;};";
html = html.replace('<script>\n', '<script>\n' + oe + '\n');

// ===== iOS FIX 5: DOMContentLoaded + try-catch =====
var si = 'function safeInit(){try{initWithLogin();}catch(e){console.error(e);var el=document.getElementById("loginScreen");if(el){el.style.display="flex";}}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",safeInit);}else{safeInit();}';
html = html.replace('\ninitWithLogin();\n', '\n' + si + '\n');

// ===== iOS FIX 6: inset:0 → top:0;left:0;right:0;bottom:0 =====
html = html.split('inset:0;').join('top:0;left:0;right:0;bottom:0;');
html = html.split('inset: 0;').join('top:0;left:0;right:0;bottom:0;');
html = html.split('inset:0 ;').join('top:0;left:0;right:0;bottom:0;');

// ===== iOS FIX 7 (CRITICAL): Replace ALL CSS variables with hardcoded values =====
var vars = {
  'bg': '#f5f6fa',
  'surface': '#ffffff',
  'surface-2': '#eef0f6',
  'surface-3': '#e4e7f0',
  'border': '#dfe3ef',
  'border-hover': '#c4cbdc',
  'text': '#1a1d2e',
  'text-dim': '#6b7184',
  'text-light': '#a0a6b8',
  'primary': '#1a1d2e',
  'primary-dark': '#0f1120',
  'primary-light': '#e8eaf2',
  'accent': '#c9a227',
  'accent-dark': '#a88a1f',
  'accent-light': '#fdf6e3',
  'gold-grad': 'linear-gradient(135deg, #d4af37, #c9a227)',
  'navy-grad': 'linear-gradient(135deg, #1a1d2e, #2a2f4a)',
  'income': '#15803d',
  'income-bg': '#f0fdf4',
  'income-light': '#dcfce7',
  'expense': '#dc2626',
  'expense-bg': '#fef2f2',
  'expense-light': '#fee2e2',
  'danger': '#dc2626',
  'danger-bg': '#fef2f2',
  'success': '#15803d',
  'success-bg': '#f0fdf4',
  'info': '#1d4ed8',
  'info-bg': '#eff6ff',
  'shadow': '0 1px 3px rgba(26,29,46,0.04)',
  'shadow-md': '0 4px 16px rgba(26,29,46,0.07), 0 1px 3px rgba(26,29,46,0.03)',
  'shadow-lg': '0 8px 32px rgba(26,29,46,0.10)',
  'shadow-gold': '0 4px 20px rgba(201,162,39,0.25)',
  'radius': '18px',
  'radius-sm': '12px',
  'radius-xs': '8px',
  'font': "system-ui, -apple-system, 'Segoe UI', sans-serif"
};

for (var k in vars) {
  // Replace var(--name) with value
  var re = new RegExp('var\\(--' + k.replace(/[-]/g, '\\-') + '\\)', 'g');
  html = html.replace(re, vars[k]);
  // Also replace var(--name, fallback)
  var re2 = new RegExp('var\\(--' + k.replace(/[-]/g, '\\-') + ',\\s*[^)]+\\)', 'g');
  html = html.replace(re2, vars[k]);
}

// ===== iOS FIX 8: -webkit prefixes =====
html = html.replace(/backdrop-filter:([^;]+);/g, '-webkit-backdrop-filter:$1;backdrop-filter:$1;');
html = html.split('transform:scale(0.98)').join('-webkit-transform:scale(0.98);transform:scale(0.98)');
html = html.split('transform:translateY(-50%)').join('-webkit-transform:translateY(-50%);transform:translateY(-50%)');

// Update version
html = html.split('v5.7').join('v6.1');

fs.writeFileSync('index.html', html);
console.log('Built: ' + html.length + ' chars, v6.1');
console.log('var(--: ' + (html.match(/var\(--/g) || []).length);
console.log('inset:: ' + (html.match(/inset:/g) || []).length);