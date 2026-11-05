/**
 * Renders the shared dark site footer into <div id="site-footer"></div>.
 */

function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;

  const year = new Date().getFullYear();

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container site-footer__grid">
        <div class="footer-col-brand">
          <a href="/index.html" class="brand" aria-label="BidMart Home">
            <span class="brand__mark" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="26" height="26" rx="7" fill="#106EBE"/>
                <path d="M7 17.5L11 9l2.4 5 2.1-4 3.5 7.5" stroke="#0FFCBE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="brand__name" style="color:#FFF;">BidMart</span>
          </a>
          <p class="brand__slogan_text">Shop it. Bid it. Own it.</p>
          <p class="footer-desc">The next-generation hybrid marketplace & online auction platform. Discover fixed price items or bid live on exclusive products.</p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <a href="/index.html">Home</a>
          <a href="/shop/shop.html">Shop</a>
          <a href="/auction/auctions.html">Auctions</a>
          <a href="/shop/shop.html#categories">Categories</a>
          <a href="#contact">Contact</a>
        </div>

        <div>
          <h4>Customer Service</h4>
          <a href="#">Help Center</a>
          <a href="/shop/orders.html">Track Order</a>
          <a href="#">Returns & Refunds</a>
          <a href="#">Shipping Info</a>
          <a href="#">Privacy Policy</a>
        </div>

        <div>
          <h4>Follow Us</h4>
          <div class="footer-social-links">
            <a href="#" aria-label="Facebook"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
            <a href="#" aria-label="YouTube"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
            <a href="#" aria-label="X"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            <a href="#" aria-label="LinkedIn"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>
          </div>
        </div>

        <div>
          <h4>Subscribe to our Newsletter</h4>
          <p class="footer-desc" style="margin-bottom:12px;">Get the latest updates, deals and more.</p>
          <form class="footer-newsletter-form" id="footer-newsletter-form" onsubmit="event.preventDefault(); document.getElementById('newsletter-msg').hidden = false; this.reset();">
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit">Subscribe</button>
          </form>
          <span class="text-mint" id="newsletter-msg" style="font-size:12px;margin-top:6px;display:block;" hidden>✓ Thank you for subscribing!</span>
        </div>
      </div>

      <div class="container site-footer__bottom">
        <p>© ${year} BidMart. All rights reserved.</p>
        <div class="payment-badges">
          <span class="pay-card">VISA</span>
          <span class="pay-card">Mastercard</span>
          <span class="pay-card">UPI</span>
          <span class="pay-card">RuPay</span>
        </div>
      </div>
    </footer>
  `;
}

document.addEventListener('DOMContentLoaded', renderFooter);
