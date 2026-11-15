const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/d2424/Desktop/Amit/Shopping-Site/frontend/shared/theme.css');
let css = fs.readFileSync(filePath, 'utf8');

const darkCardStyles = `
/* =====================================================================
   AUCTION CARDS & ARENA OBSIDIAN DARK OVERRIDES
   ===================================================================== */
.auc-app-body, .sc-app-body {
  background-color: #080B11 !important;
  color: #F1F5F9 !important;
}

.sc-app {
  background-color: #080B11 !important;
}

.auc-main-feed, .sc-main-content {
  background-color: #080B11 !important;
}

.sc-title, .auc-title, h1.sc-title {
  color: #FFFFFF !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 800 !important;
}

.sc-subtitle, .auc-subtitle {
  color: #94A3B8 !important;
}

/* Tabs */
.auc-tabs-container {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.auc-tab-btn {
  background: transparent !important;
  color: #94A3B8 !important;
  border: 1px solid transparent !important;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.auc-tab-btn:hover {
  color: #FFFFFF !important;
  background: rgba(255, 255, 255, 0.04) !important;
}

.auc-tab-btn.active {
  background: #0E131F !important;
  color: #D8FF00 !important;
  border: 1px solid rgba(216, 255, 0, 0.3) !important;
}

.auc-tab-count {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #F1F5F9 !important;
  border-radius: 999px !important;
  padding: 2px 8px !important;
  font-size: 0.72rem !important;
}

/* Filter Toolbar */
.auc-filter-toolbar {
  background: #0E131F !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 14px !important;
  padding: 16px !important;
  margin-bottom: 24px !important;
}

.auc-filter-search input, .auc-filter-select, #filter-max-price {
  background: #080B11 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #FFFFFF !important;
  border-radius: 8px !important;
}

.auc-filter-search svg {
  color: #64748B !important;
}

.auc-chip-toggle {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #94A3B8 !important;
  border-radius: 8px !important;
  padding: 6px 12px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.auc-chip-toggle:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #FFFFFF !important;
}

.auc-chip-toggle.active {
  background: rgba(216, 255, 0, 0.12) !important;
  border-color: #D8FF00 !important;
  color: #D8FF00 !important;
}

.auc-chip-toggle.active-red {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: #EF4444 !important;
  color: #EF4444 !important;
}

.auc-btn-clear {
  color: #94A3B8 !important;
  cursor: pointer !important;
  background: transparent !important;
  border: none !important;
}

.auc-btn-clear:hover {
  color: #EF4444 !important;
}

/* Auction Card in Grid */
.auc-card {
  background: #0E131F !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease !important;
}

.auc-card:hover {
  transform: translateY(-4px) !important;
  border-color: rgba(216, 255, 0, 0.45) !important;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(216, 255, 0, 0.12) !important;
}

.auc-card-media {
  background: #080B11 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  position: relative !important;
}

.auc-card-media img {
  object-fit: cover !important;
}

.auc-card-body {
  background: #0E131F !important;
  padding: 18px !important;
}

.auc-card-id {
  color: #64748B !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-weight: 700 !important;
}

.auc-card-cond {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #94A3B8 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 4px !important;
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
}

.auc-card-title {
  color: #FFFFFF !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
}

.auc-card-title:hover {
  color: #D8FF00 !important;
}

/* Price Box */
.auc-price-box {
  background: #080B11 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 10px !important;
}

.auc-price-label {
  color: #64748B !important;
}

.auc-price-val {
  color: #FFFFFF !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 800 !important;
}

.auc-price-val.highlight {
  color: #D8FF00 !important;
}

.auc-price-sub {
  color: #94A3B8 !important;
}

/* Action Buttons on Card */
.auc-btn-bid {
  background: #D8FF00 !important;
  color: #080B11 !important;
  font-weight: 800 !important;
  border-radius: 10px !important;
  width: 100% !important;
  text-align: center !important;
  padding: 12px 16px !important;
  font-size: 0.9rem !important;
  letter-spacing: 0.02em !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 4px 15px rgba(216, 255, 0, 0.25) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-decoration: none !important;
}

.auc-btn-bid:hover {
  background: #E8FF4D !important;
  box-shadow: 0 6px 22px rgba(216, 255, 0, 0.4) !important;
  transform: translateY(-1px) !important;
}

.auc-btn-outline {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #F1F5F9 !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  width: 100% !important;
  text-align: center !important;
  padding: 12px 16px !important;
  font-size: 0.88rem !important;
  text-decoration: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
}

.auc-btn-outline:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(216, 255, 0, 0.4) !important;
}

/* Right Rail Widgets */
.auc-widget-card {
  background: #0E131F !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  color: #F1F5F9 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
}

.auc-widget-title {
  color: #FFFFFF !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 700 !important;
}

.auc-wallet-card {
  background: linear-gradient(145deg, #0E131F 0%, #151D2D 100%) !important;
  border: 1px solid rgba(216, 255, 0, 0.2) !important;
}

.auc-wallet-balance-big .amount {
  color: #FFFFFF !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-weight: 800 !important;
}

.auc-wb-item {
  background: #080B11 !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  border-radius: 8px !important;
}

.wb-val.available {
  color: #D8FF00 !important;
}

.wb-val.reserved {
  color: #F59E0B !important;
}

.auc-btn-deposit {
  background: #D8FF00 !important;
  color: #080B11 !important;
  font-weight: 800 !important;
}

.auc-btn-wallet-view {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #F1F5F9 !important;
}

.auc-activity-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.auc-activity-row:hover {
  background: rgba(255, 255, 255, 0.02) !important;
}

.act-left {
  color: #94A3B8 !important;
}

.act-count {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

/* Breadcrumbs & Navigation Buttons */
.bm-page-header-wrap {
  margin-bottom: 24px !important;
}

.bm-breadcrumbs {
  color: #64748B !important;
}

.bm-breadcrumb-item {
  color: #94A3B8 !important;
}

.bm-breadcrumb-item.active {
  color: #D8FF00 !important;
}

.bm-back-btn {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #F1F5F9 !important;
  border-radius: 8px !important;
}

.bm-back-btn:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(216, 255, 0, 0.4) !important;
}

.sc-header-actions .sc-btn-primary {
  background: #D8FF00 !important;
  color: #080B11 !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
}

.sc-header-actions .sc-btn-mint {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  color: #F1F5F9 !important;
  border-radius: 10px !important;
}

.sc-header-actions .sc-btn-mint:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(216, 255, 0, 0.4) !important;
}
`;

css += darkCardStyles;
fs.writeFileSync(filePath, css, 'utf8');
console.log('Appended darkCardStyles to theme.css successfully!');

