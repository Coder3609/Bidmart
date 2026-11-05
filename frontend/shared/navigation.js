/**
 * BidMart Global Navigation & Breadcrumbs Utility
 * Provides smart history navigation, fallback routing, breadcrumbs,
 * page-header patterns, and unsaved changes protection.
 */

(function () {
  'use strict';

  function isInternalReferrer() {
    if (!document.referrer) return false;
    try {
      const refUrl = new URL(document.referrer);
      const currUrl = new URL(window.location.href);
      // Same host and not identical path+query
      return refUrl.host === currUrl.host && (refUrl.pathname !== currUrl.pathname || refUrl.search !== currUrl.search);
    } catch {
      return false;
    }
  }

  /**
   * Smart Back Navigation:
   * Uses browser history if available from the same site, else navigates to fallback.
   */
  function goBackOrFallback(fallbackUrl = '/') {
    if (window.history.length > 1 && isInternalReferrer()) {
      window.history.back();
    } else {
      window.location.href = fallbackUrl;
    }
  }

  function goBack(fallbackUrl = '/') {
    goBackOrFallback(fallbackUrl);
  }

  function navigateTo(url) {
    if (url) {
      window.location.href = url;
    }
  }

  /**
   * Generates a Back Button HTML string or mounts directly to a container.
   */
  function createBackButtonHtml({ label = 'Back', fallbackUrl = '/', className = '' } = {}) {
    return `
      <button type="button" 
              class="bm-back-btn ${className}" 
              onclick="window.nav.goBackOrFallback('${fallbackUrl}')" 
              aria-label="Go back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>${label}</span>
      </button>
    `;
  }

  /**
   * Mounts a Back Button into a target container.
   */
  function renderBackButton(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.innerHTML = createBackButtonHtml(options);
  }

  /**
   * Generates Breadcrumbs HTML string.
   * items: Array of { label: string, href?: string, active?: boolean }
   */
  function createBreadcrumbsHtml(items = []) {
    if (!items || items.length === 0) return '';
    const itemsHtml = items.map((item, idx) => {
      const isLast = idx === items.length - 1 || item.active;
      if (isLast || !item.href) {
        return `<span class="bm-breadcrumb-item active" aria-current="page">${item.label}</span>`;
      }
      return `<a href="${item.href}" class="bm-breadcrumb-item">${item.label}</a>`;
    }).join('<span class="bm-breadcrumb-sep">/</span>');

    return `<nav class="bm-breadcrumbs" aria-label="Breadcrumb">${itemsHtml}</nav>`;
  }

  /**
   * Mounts Breadcrumbs into a target container.
   */
  function renderBreadcrumbs(target, items = []) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.innerHTML = createBreadcrumbsHtml(items);
  }

  /**
   * Renders a full unified Page Header pattern.
   */
  function renderPageHeader(target, {
    title,
    subtitle,
    backUrl = '/',
    backLabel = 'Back',
    breadcrumbs = [],
    actionsHtml = '',
  } = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    const backBtnHtml = backUrl ? createBackButtonHtml({ label: backLabel, fallbackUrl: backUrl }) : '';
    const bcHtml = breadcrumbs && breadcrumbs.length ? createBreadcrumbsHtml(breadcrumbs) : '';

    el.innerHTML = `
      <div class="bm-page-header-wrap">
        <div class="bm-page-header-top">
          ${backBtnHtml}
          ${bcHtml}
        </div>
        <div class="bm-page-header-main">
          <div class="bm-page-header-titles">
            <h1 class="bm-page-title">${title || ''}</h1>
            ${subtitle ? `<p class="bm-page-subtitle">${subtitle}</p>` : ''}
          </div>
          ${actionsHtml ? `<div class="bm-page-header-actions">${actionsHtml}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Unsaved Changes Protection Modal & Listener
   */
  function setupUnsavedChangesGuard({
    isDirtyCheck = () => false,
    onDiscard = () => {},
  } = {}) {
    // Browser leave guard
    window.addEventListener('beforeunload', (e) => {
      if (isDirtyCheck()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to discard them?';
        return e.returnValue;
      }
    });

    // Custom Modal confirmation for programmatic closures
    function confirmDiscard(callback) {
      if (!isDirtyCheck()) {
        if (callback) callback();
        return;
      }

      let modal = document.getElementById('bm-unsaved-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bm-unsaved-modal';
        modal.className = 'bm-unsaved-overlay';
        modal.innerHTML = `
          <div class="bm-unsaved-dialog">
            <div class="bm-unsaved-icon">⚠️</div>
            <h3 class="bm-unsaved-title">Discard changes?</h3>
            <p class="bm-unsaved-msg">You have unsaved product information. Leaving now will lose all entered data and uploaded images.</p>
            <div class="bm-unsaved-actions">
              <button type="button" class="bm-unsaved-btn cancel" id="bm-unsaved-keep">Continue Editing</button>
              <button type="button" class="bm-unsaved-btn discard" id="bm-unsaved-discard">Discard Changes</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      modal.style.display = 'flex';

      const keepBtn = modal.querySelector('#bm-unsaved-keep');
      const discardBtn = modal.querySelector('#bm-unsaved-discard');

      const cleanup = () => {
        modal.style.display = 'none';
        keepBtn.onclick = null;
        discardBtn.onclick = null;
      };

      keepBtn.onclick = () => {
        cleanup();
      };

      discardBtn.onclick = () => {
        cleanup();
        if (onDiscard) onDiscard();
        if (callback) callback();
      };
    }

    return { confirmDiscard };
  }

  const nav = {
    goBack,
    goBackOrFallback,
    navigateTo,
    createBackButtonHtml,
    renderBackButton,
    createBreadcrumbsHtml,
    renderBreadcrumbs,
    renderPageHeader,
    setupUnsavedChangesGuard,
  };

  window.nav = nav;
  window.navigationHelper = nav;
})();
