/**
 * BidMart Fast Modern Checkout & Payment Engine (Refined)
 */
(function() {
  function formatINR(val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  }

  function getCartItems() {
    try {
      return JSON.parse(localStorage.getItem('bidmart_guest_cart') || '[]');
    } catch (_) {
      return [];
    }
  }

  function saveCartItems(items) {
    localStorage.setItem('bidmart_guest_cart', JSON.stringify(items));
    if (typeof updateCartBadge === 'function') updateCartBadge();
  }

  function renderModal() {
    if (document.getElementById('bmCheckoutModalOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'bmCheckoutModalOverlay';
    overlay.className = 'bm-checkout-overlay';
    overlay.innerHTML = `
      <div class="bm-checkout-card">
        
        <!-- Header -->
        <div class="bm-checkout-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:1.15rem;letter-spacing:-0.5px;">BIDMART CHECKOUT</span>
            <span style="background:rgba(216,255,0,0.1);color:#D8FF00;font-family:'JetBrains Mono',monospace;font-size:0.7rem;font-weight:800;padding:3px 8px;border-radius:4px;">100% SECURE ESCROW</span>
          </div>
          <button type="button" class="bm-checkout-close" onclick="window.bmCheckout.close()">&times;</button>
        </div>

        <div class="bm-checkout-scroll-body" id="bmCheckoutBody">
          <!-- Two-column grid -->
          <div class="bm-checkout-grid">
            
            <!-- Left Side: Shipping & Payment Choice -->
            <div>
              <!-- Step 1: Delivery Address -->
              <h3 class="bm-checkout-step-title">
                <span class="bm-checkout-step-num">1</span>
                <span>Delivery Address</span>
              </h3>
              
              <div class="bm-shipping-form">
                <div class="bm-form-row">
                  <div class="bm-form-group">
                    <label>FULL NAME</label>
                    <input type="text" id="bmShipName" value="Rahul Sharma" required />
                  </div>
                  <div class="bm-form-group">
                    <label>PHONE NUMBER</label>
                    <input type="tel" id="bmShipPhone" value="+91 98765 43210" required />
                  </div>
                </div>

                <div class="bm-form-group">
                  <label>DELIVERY STREET ADDRESS</label>
                  <input type="text" id="bmShipAddress" value="Flat 402, Signature Towers, MG Road" required />
                </div>

                <div class="bm-form-row-3">
                  <div class="bm-form-group">
                    <label>CITY</label>
                    <input type="text" id="bmShipCity" value="Bengaluru" required />
                  </div>
                  <div class="bm-form-group">
                    <label>STATE</label>
                    <input type="text" id="bmShipState" value="Karnataka" required />
                  </div>
                  <div class="bm-form-group">
                    <label>PINCODE</label>
                    <input type="text" id="bmShipZip" value="560001" required />
                  </div>
                </div>
              </div>

              <!-- Step 2: Payment Method Choice -->
              <h3 class="bm-checkout-step-title">
                <span class="bm-checkout-step-num">2</span>
                <span>Select Payment Method</span>
              </h3>

              <div class="bm-payment-methods">
                
                <!-- UPI / QR -->
                <label class="bm-pay-option selected" onclick="window.bmCheckout.selectPayMethod(this)">
                  <input type="radio" name="bmPaymentMethod" value="UPI" checked />
                  <div class="bm-pay-option-content">
                    <div class="bm-pay-title">UPI &bull; Google Pay / PhonePe / Paytm</div>
                    <div class="bm-pay-desc">Instant verification. Pay using any UPI app or scan QR code.</div>
                  </div>
                </label>

                <!-- Cards -->
                <label class="bm-pay-option" onclick="window.bmCheckout.selectPayMethod(this)">
                  <input type="radio" name="bmPaymentMethod" value="CARD" />
                  <div class="bm-pay-option-content">
                    <div class="bm-pay-title">Credit / Debit Card</div>
                    <div class="bm-pay-desc">Visa, MasterCard, RuPay, Amex with 128-bit bank encryption.</div>
                  </div>
                </label>

                <!-- Net Banking -->
                <label class="bm-pay-option" onclick="window.bmCheckout.selectPayMethod(this)">
                  <input type="radio" name="bmPaymentMethod" value="NETBANKING" />
                  <div class="bm-pay-option-content">
                    <div class="bm-pay-title">Net Banking</div>
                    <div class="bm-pay-desc">HDFC, ICICI, SBI, Axis, Kotak and 50+ supported banks.</div>
                  </div>
                </label>

                <!-- Cash on Delivery -->
                <label class="bm-pay-option" onclick="window.bmCheckout.selectPayMethod(this)">
                  <input type="radio" name="bmPaymentMethod" value="COD" />
                  <div class="bm-pay-option-content">
                    <div class="bm-pay-title">Cash on Delivery (COD)</div>
                    <div class="bm-pay-desc">Pay in cash or UPI when your verified package arrives at your door.</div>
                  </div>
                </label>

              </div>
            </div>

            <!-- Right Side: Order Summary -->
            <div>
              <div class="bm-order-summary-box">
                <h3 style="font-size:1.05rem;font-weight:800;margin:0 0 14px 0;letter-spacing:-0.3px;">Order Summary</h3>
                
                <div class="bm-summary-cart-items" id="bmSummaryCartItems">
                  <!-- Injected dynamically -->
                </div>

                <div class="bm-price-row">
                  <span>Subtotal (<span id="bmItemCountLabel">0</span> items)</span>
                  <span id="bmSubtotalLabel" style="font-weight:700;color:#FFFFFF;">₹0</span>
                </div>
                <div class="bm-price-row">
                  <span>Delivery &amp; Handling</span>
                  <span style="color:#D8FF00;font-weight:700;">FREE</span>
                </div>
                <div class="bm-price-row">
                  <span>BidMart Escrow Protection</span>
                  <span style="color:#D8FF00;font-weight:700;">FREE</span>
                </div>

                <div class="bm-price-row total">
                  <span>Total Payable</span>
                  <span class="amount" id="bmTotalPayable">₹0</span>
                </div>

                <button type="button" class="bm-btn-pay-complete" id="bmPayNowBtn" onclick="window.bmCheckout.processPayment()">
                  <span>Complete Order &amp; Pay &rarr;</span>
                </button>

                <div style="font-size:0.7rem;color:#64748B;text-align:center;margin-top:10px;">
                  🔒 256-Bit SSL Protected &bull; 7-Day Money Back Guarantee
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.bmCheckout.close();
    });
  }

  window.bmCheckout = {
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

    open: async function() {
      renderModal();
      const overlay = document.getElementById('bmCheckoutModalOverlay');
      if (overlay) overlay.classList.add('active');
      await this.refreshSummary();
    },

    close: function() {
      const overlay = document.getElementById('bmCheckoutModalOverlay');
      if (overlay) overlay.classList.remove('active');
    },

    selectPayMethod: function(labelEl) {
      document.querySelectorAll('.bm-pay-option').forEach(el => el.classList.remove('selected'));
      labelEl.classList.add('selected');
      const radio = labelEl.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    },

    addToCartAndOpen: async function(productId, title, price, img) {
      let cart = getCartItems();
      const existing = cart.find(i => i.productId === productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          productId,
          title: title || 'BidMart Item',
          price: price || 999,
          img: img || '/assets/products/placeholder.svg',
          quantity: 1,
          addedAt: Date.now()
        });
      }
      saveCartItems(cart);

      if (window.auth && window.auth.isLoggedIn()) {
        try {
          await window.api.post('/cart', { productId, quantity: 1 });
        } catch (_) {}
      }

      this.open();
    },

    refreshSummary: async function() {
      let cart = getCartItems();

      const listContainer = document.getElementById('bmSummaryCartItems');
      const countLabel = document.getElementById('bmItemCountLabel');
      const subtotalLabel = document.getElementById('bmSubtotalLabel');
      const totalLabel = document.getElementById('bmTotalPayable');
      const payBtn = document.getElementById('bmPayNowBtn');

      if (!cart || cart.length === 0) {
        if (listContainer) {
          listContainer.innerHTML = `
            <div style="padding:40px 20px;text-align:center;color:#94A3B8;">
              <div style="font-size:2rem;margin-bottom:8px;">🛒</div>
              <div style="font-weight:700;color:#FFF;margin-bottom:4px;">Your Cart is Empty</div>
              <div style="font-size:0.82rem;">Add items from the store to proceed to checkout.</div>
            </div>
          `;
        }
        if (countLabel) countLabel.innerText = '0';
        if (subtotalLabel) subtotalLabel.innerText = '₹0';
        if (totalLabel) totalLabel.innerText = '₹0';
        if (payBtn) payBtn.disabled = true;
        return;
      }

      if (payBtn) payBtn.disabled = false;

      let subtotal = 0;
      let totalQty = 0;

      let html = '';
      cart.forEach((item, idx) => {
        const itemPrice = Number(item.price) || 999;
        const qty = Number(item.quantity) || 1;
        subtotal += itemPrice * qty;
        totalQty += qty;

        html += `
          <div class="bm-cart-item-row" style="display:flex;align-items:center;gap:14px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:10px;">
            <img src="${item.img || '/assets/products/placeholder.svg'}" alt="${item.title}" class="bm-cart-item-thumb" style="width:50px;height:50px;object-fit:cover;border-radius:8px;background:#000;" onerror="this.src='/assets/products/placeholder.svg';" />
            <div class="bm-cart-item-info" style="flex:1;min-width:0;">
              <div class="bm-cart-item-title" title="${item.title}" style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#FFF;">${item.title}</div>
              <div class="bm-cart-item-sub" style="font-size:0.75rem;color:#94A3B8;">Qty: ${qty} &bull; ${formatINR(itemPrice)} each</div>
            </div>
            <div class="bm-cart-item-price-col" style="text-align:right;">
              <div class="bm-cart-item-price" style="font-weight:800;color:#10B981;font-size:0.92rem;">${formatINR(itemPrice * qty)}</div>
              <button type="button" class="bm-btn-item-remove" onclick="window.bmCheckout.removeItem(${idx})" style="background:none;border:none;color:#EF4444;font-size:0.75rem;cursor:pointer;padding:2px 0;text-decoration:underline;">✕ Remove</button>
            </div>
          </div>
        `;
      });

      if (listContainer) listContainer.innerHTML = html;
      if (countLabel) countLabel.innerText = totalQty;
      if (subtotalLabel) subtotalLabel.innerText = formatINR(subtotal);
      if (totalLabel) totalLabel.innerText = formatINR(subtotal);
    },

    removeItem: function(index) {
      let cart = getCartItems();
      cart.splice(index, 1);
      saveCartItems(cart);
      this.refreshSummary();
    },

    processPayment: function() {
      const btn = document.getElementById('bmPayNowBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Processing Secure Payment...</span>`;
      }

      const selectedMethod = document.querySelector('input[name="bmPaymentMethod"]:checked')?.value || 'UPI';
      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

      setTimeout(() => {
        localStorage.removeItem('bidmart_guest_cart');
        if (typeof updateCartBadge === 'function') updateCartBadge();

        const body = document.getElementById('bmCheckoutBody');
        if (body) {
          body.innerHTML = `
            <div class="bm-order-success-stage">
              <div class="bm-success-icon-wrap">✓</div>
              <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:800;margin:0 0 10px 0;letter-spacing:-0.5px;">Order Placed Successfully!</h2>
              <p style="color:#94A3B8;max-width:480px;margin:0 auto 20px;font-size:0.95rem;line-height:1.5;">
                Thank you for your purchase. Your order <strong>#${orderId}</strong> has been confirmed with <strong>${selectedMethod} Payment</strong> and is now being prepared for express delivery.
              </p>
              
              <div style="background:rgba(216,255,0,0.06);border:1px dashed rgba(216,255,0,0.3);border-radius:10px;padding:14px 20px;max-width:380px;margin:0 auto 28px;font-family:'JetBrains Mono',monospace;font-size:0.82rem;color:#D8FF00;">
                ESTIMATED DELIVERY: WITHIN 48 HOURS
              </div>

              <div style="display:flex;justify-content:center;gap:14px;">
                <button type="button" class="bm-btn-pay-complete" onclick="window.bmCheckout.close(); window.location.reload();" style="margin:0;padding:12px 28px;width:auto;">
                  Continue Shopping &rarr;
                </button>
              </div>
            </div>
          `;
        }
      }, 1200);
    }
  };

  document.addEventListener('DOMContentLoaded', renderModal);
})();
