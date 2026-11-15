const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('c:/Users/d2424/Desktop/Amit/Shopping-Site/frontend/shared/theme.css');
let text = fs.readFileSync(targetFile, 'utf8');

const newVars = `:root {
  /* BIDMART OBSIDIAN DARK DESIGN SYSTEM */
  --color-primary: #D8FF00;
  --color-primary-dark: #BCE000;
  --color-primary-light: rgba(216, 255, 0, 0.12);
  --color-mint: #00F5A0;
  --color-mint-dark: #00D084;

  /* Neutrals */
  --color-white: #FFFFFF;
  --color-bg: #080B11;
  --color-surface: #0E131F;
  --color-surface-elevated: #151C2C;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(216, 255, 0, 0.4);
  --color-text: #F1F5F9;
  --color-text-muted: #94A3B8;
  --color-text-faint: #64748B;

  /* Feedback */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-live: #EF4444;

  /* Elevation */
  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 20px 50px rgba(0, 0, 0, 0.8);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-pill: 999px;

  /* Type */
  --font-body: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-heading: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
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

const pattern = /:root\s*\{[\s\S]*?--header-height:\s*76px;\s*\}/m;
if (pattern.test(text)) {
  text = text.replace(pattern, newVars);
  fs.writeFileSync(targetFile, text, 'utf8');
  console.log('SUCCESS: theme.css root tokens updated to Obsidian Dark!');
} else {
  console.log('FAILED: regex did not match');
}

