const fs = require('fs');
const path = require('path');

const filePath = path.resolve('Shopping-Site/frontend/shared/checkout-modal.js');
let code = fs.readFileSync(filePath, 'utf8');

const enhancedMethods = `
    addToCart: function(item, qty = 1) {
      let cart = getCartItems();
      const pId = item.id || item.productId;
      const existing = cart.find(i => (i.productId === pId || i.id === pId));
      if (existing) {
        existing.quantity = (existing.quantity || 1) + qty;
      } else {
        cart.push({
          productId: pId,
          title: item.title || 'BidMart Product',
          price: Number(item.price) || 999,
          img: item.image || item.img || '/assets/products/placeholder.svg',
          quantity: qty,
          addedAt: Date.now()
        });
      }
      saveCartItems(cart);
      if (window.bmExploreModal && typeof window.bmExploreModal.showToast === 'function') {
        window.bmExploreModal.showToast('Added ' + (item.title || 'item') + ' to cart!', 'success');
      }
      this.updateBadge();
    },

    openCheckout: function() {
      this.open();
    },

    updateBadge: function() {
      const cart = getCartItems();
      const total = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
      document.querySelectorAll('#header-cart-badge').forEach(badge => {
        badge.textContent = total;
        badge.hidden = total === 0;
      });
    },
`;

code = code.replace('window.bmCheckout = {', 'window.bmCheckout = {' + enhancedMethods);
fs.writeFileSync(filePath, code, 'utf8');
console.log('checkout-modal.js enhanced with addToCart, openCheckout, and updateBadge!');

