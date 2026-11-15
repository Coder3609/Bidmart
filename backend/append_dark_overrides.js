const fs = require('fs');
const path = require('path');

const file = path.resolve('c:/Users/d2424/Desktop/Amit/Shopping-Site/frontend/shared/theme.css');
let content = fs.readFileSync(file, 'utf8');

const themeOverhauls = `

/* =====================================================================
   BIDMART SIGNATURE OBSIDIAN DARK OVERRIDES (Global System-Wide)
   ===================================================================== */
body {
  background-color: var(--color-bg) !important;
  color: var(--color-text) !important;
  font-family: var(--font-body) !important;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading) !important;
  color: #FFFFFF !important;
  letter-spacing: -0.02em;
}

/* Card Surfaces */
.card, .panel, .dashboard-card, .stat-card, .table-card, .filter-panel, .cart-item, .order-card, .bid-card, .auction-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text) !important;
  border-radius: var(--radius-md) !important;
}

/* Buttons */
.btn-primary, .action-btn-primary, button.primary {
  background: #D8FF00 !important;
  color: #080B11 !important;
  font-weight: 700 !important;
  border: none !important;
  border-radius: 10px !important;
  transition: all 0.2s ease !important;
}

.btn-primary:hover, .action-btn-primary:hover, button.primary:hover {
  background: #E5FF4D !important;
  box-shadow: 0 4px 20px rgba(216, 255, 0, 0.35) !important;
  transform: translateY(-1px);
}

.btn-secondary, .action-btn-secondary, button.secondary {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #F1F5F9 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(216, 255, 0, 0.4) !important;
}

/* Headers & Navigation */
header, .site-header, .top-bar, .app-header, nav {
  background: rgba(8, 11, 17, 0.95) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* Inputs & Form Elements */
input, select, textarea {
  background: #0E131F !important;
  color: #FFFFFF !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px !important;
}

input:focus, select:focus, textarea:focus {
  border-color: #D8FF00 !important;
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(216, 255, 0, 0.2) !important;
}

/* Tables */
table, th, td {
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #F1F5F9 !important;
}

th {
  background: #111726 !important;
  color: #94A3B8 !important;
  text-transform: uppercase !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em !important;
}

tr:hover td {
  background: rgba(255, 255, 255, 0.02) !important;
}

/* Badges */
.badge, .tag, .pill {
  border-radius: 999px !important;
}

.badge-live {
  background: rgba(239, 68, 68, 0.15) !important;
  color: #EF4444 !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.badge-success {
  background: rgba(16, 185, 129, 0.15) !important;
  color: #10B981 !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
}
`;

fs.writeFileSync(file, content + themeOverhauls, 'utf8');
console.log('Appended dark theme overrides to theme.css!');

