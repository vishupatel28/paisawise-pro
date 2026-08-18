const fs = require('fs');
const zlib = require('zlib');

// Read and concatenate chunks
let b64 = '';
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

// ===== iOS FIX 3: Remove Google Fonts dependency =====
html = html.split('<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">').join('<!-- Fonts removed -->');
html = html.split("'Plus Jakarta Sans', system-ui, sans-serif").join("system-ui, -apple-system, 'Segoe UI', sans-serif");

// ===== iOS FIX 4: Add window.onerror handler =====
var oe = "window.onerror=function(m,u,l,c,e){var d=document.createElement('div');d.style.cssText='position:fixed;bottom:10px;left:10px;right:10px;background:#dc2626;color:#fff;padding:10px;border-radius:8px;font-size:12px;z-index:99999;font-family:sans-serif';d.textContent='Error: '+m+' (line '+l+')';document.body.appendChild(d);return false;};";
html = html.replace('<script>\n', '<script>\n' + oe + '\n');

// ===== iOS FIX 5: Wrap initWithLogin() in DOMContentLoaded + try-catch =====
var si = 'function safeInit(){try{initWithLogin();}catch(e){console.error(e);var el=document.getElementById("loginScreen");if(el){el.style.display="flex";}}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",safeInit);}else{safeInit();}';
html = html.replace('\ninitWithLogin();\n', '\n' + si + '\n');

// ===== iOS FIX 6 (CRITICAL): inset:0 → top:0;left:0;right:0;bottom:0 =====
// inset:0 is NOT supported on iOS Safari < 14.5
html = html.split('inset:0;').join('top:0;left:0;right:0;bottom:0;');
html = html.split('inset: 0;').join('top:0;left:0;right:0;bottom:0;');
html = html.split('inset:0 ;').join('top:0;left:0;right:0;bottom:0;');

// ===== iOS FIX 7: CSS variable fallbacks for login elements =====
html = html.split('.login-box{position:relative;width:100%;max-width:380px;background:var(--surface);').join('.login-box{position:relative;width:100%;max-width:380px;background:#252838;');
html = html.split('.login-screen{position:fixed;top:0;left:0;right:0;bottom:0;background:var(--navy-grad);').join('.login-screen{position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#1a1d2e,#252838);');
html = html.split('border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:17px').join('border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;font-size:17px');
html = html.split('.login-btn{width:100%;padding:15px;border:none;border-radius:var(--radius-sm);background:var(--gold-grad);').join('.login-btn{width:100%;padding:15px;border:none;border-radius:12px;background:linear-gradient(135deg,#d4af37,#c9a227);');

// ===== iOS FIX 8: Add -webkit-backdrop-filter prefix =====
html = html.split('backdrop-filter:').join('-webkit-backdrop-filter:');
// Re-add standard version after each -webkit- version
html = html.replace(/-webkit-backdrop-filter:([^;]+);/g, '-webkit-backdrop-filter:$1;backdrop-filter:$1;');

// ===== iOS FIX 9: Add -webkit-transform prefix =====
html = html.split('transform:scale(0.98)').join('-webkit-transform:scale(0.98);transform:scale(0.98)');
html = html.split('transform:translateY(-50%)').join('-webkit-transform:translateY(-50%);transform:translateY(-50%)');

// Update version
html = html.split('v5.7').join('v5.9');

fs.writeFileSync('index.html', html);
console.log('Built index.html: ' + html.length + ' chars, version v5.9');
console.log('inset: count: ' + (html.match(/inset:/g) || []).length);
console.log('100dvh count: ' + (html.match(/100dvh/g) || []).length);
console.log('padStart count: ' + (html.match(/padStart/g) || []).length);
console.log('DOMContentLoaded: ' + (html.indexOf('DOMContentLoaded') > -1));
console.log('window.onerror: ' + (html.indexOf('window.onerror') > -1));