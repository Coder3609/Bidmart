const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/d2424/Desktop/Amit/Shopping-Site/frontend/shared/theme.css');
let css = fs.readFileSync(filePath, 'utf8');

const marker = '/* =====================================================================\n   BIDMART SIGNATURE OBSIDIAN DARK OVERRIDES';
if (css.includes(marker)) {
  css = css.substring(0, css.indexOf(marker));
}
const marker2 = '/* =====================================================================\r\n   BIDMART SIGNATURE OBSIDIAN DARK OVERRIDES';
if (css.includes(marker2)) {
  css = css.substring(0, css.indexOf(marker2));
}

const originalRoot = `:root {
  /* Brand colors (fixed by spec) */
  --color-primary: #106EBE;
  --color-primary-dark: #0B5495;
  --color-primary-light: #E7F1FB;
  --color-mint: #0FFCBE;
  --color-mint-dark: #0BC99A;

  /* Neutrals */
  --color-white: #FFFFFF;
  --color-bg: #F5F8FB;
  --color-surface: #FFFFFF;
  --color-border: #E3E9F0;
  --color-text: #16233A;
  --color-text-muted: #5A6B85;
  --color-text-faint: #8C9AB3;

  /* Feedback */
  --color-success: #1CAE6B;
  --color-warning: #E4A11B;
  --color-danger: #E5484D;
  --color-live: #E5484D;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(16, 34, 64, 0.06);
  --shadow-md: 0 6px 20px rgba(16, 34, 64, 0.08);
  --shadow-lg: 0 16px 40px rgba(16, 34, 64, 0.12);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-pill: 999px;

  /* Type */
  --font-body: "Poppins", "Segoe UI", system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.75rem;
  --font-size-2xl: 2.5rem;

  /* Layout */
  --container-max: 1440px;
  --header-height: 76px;
}`;

css = css.replace(/:root\s*\{[\s\S]*?--header-height:\s*76px;\s*\}/m, originalRoot);
fs.writeFileSync(filePath, css, 'utf8');
console.log('theme.css fully restored to normal original theme!');

