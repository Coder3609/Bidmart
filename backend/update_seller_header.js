const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/d2424/Desktop/Amit/Shopping-Site/frontend/shared/seller-header.js');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/background:#061B33;border-bottom:1px solid rgba\(15,252,190,0\.15\);color:#FFFFFF;/g, 'background:#080B11;border-bottom:1px solid rgba(255,255,255,0.08);color:#F1F5F9;');
code = code.replace(/<span class="sc-brand__mark">[\s\S]*?<\/span>\s*<div class="sc-brand__text">[\s\S]*?<\/div>/g, '<span style="font-family:\'Space Grotesk\', sans-serif;font-weight:900;font-size:1.4rem;letter-spacing:0.04em;color:#FFFFFF;">BIDMART</span>');
code = code.replace(/background:#092648;border:1px solid rgba\(15,252,190,0\.25\);color:#FFFFFF;/g, 'background:#0E131F;border:1px solid rgba(255,255,255,0.12);color:#F1F5F9;');

fs.writeFileSync(filePath, code, 'utf8');
console.log('seller-header.js updated cleanly!');

