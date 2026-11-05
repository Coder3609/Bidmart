/**
 * Small shared helpers so the product card markup only lives in one place.
 * Include after theme.css's classes are available (no dependency on api.js).
 */

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function firstImage(product) {
  return Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
}

/**
 * Renders one .product-card. `product` is a row from GET /api/products
 * (or /api/products/:id). Links to the detail page by id.
 */
function renderProductCard(product) {
  const image = firstImage(product);
  const isAuction = product.status === 'ACTIVE_AUCTION';

  const href = isAuction
    ? `/auction/auction-detail.html?productId=${product.id}`
    : `/shop/product.html?id=${product.id}`;

  return `
    <a href="${href}" class="card product-card">
      <div class="product-card__image">
        ${image
          ? `<img src="${image}" alt="${product.title}" onerror="this.onerror=null;this.src='/assets/products/placeholder.svg';" style="width:100%;height:100%;object-fit:cover;" />`
          : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="color:var(--color-primary)"><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z" stroke="currentColor" stroke-width="1.5"/></svg>`
        }
      </div>
      ${isAuction ? '<span class="badge badge-live" style="margin-bottom:8px;">LIVE AUCTION</span>' : ''}
      <p class="product-card__title">${product.title}</p>
      <p class="product-card__brand">${product.brand || product.category_name || ''}</p>
      <p class="product-card__price">${formatINR(isAuction ? (product.current_price ?? product.price) : product.price)}</p>
      <span class="btn btn-primary btn-sm" style="width:100%;">${isAuction ? 'View Auction' : 'View Product'}</span>
    </a>
  `;
}

window.shopHelpers = { formatINR, firstImage, renderProductCard };
