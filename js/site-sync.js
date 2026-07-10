const SITE_CONTENT_KEYS = [
  'hc_products',
  'hc_categories',
  'hc_product_counter',
  'hc_artisans',
  'hc_artisan_section',
  'hc_announcements',
  'hc_offer_popup',
  'hc_hero_slides',
  'hc_orders',
  'hc_order_counter',
  'hc_returns',
  'hc_promos',
  'hc_welcome_section',
  'hc_testimonials'
];

let pushTimer = null;
let pushInFlight = null;
let serverWasEmpty = false;

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function canUseSiteSync() {
  return !isFileProtocol();
}

function applySiteContent(content) {
  if (!content || typeof content !== 'object') return;
  SITE_CONTENT_KEYS.forEach((key) => {
    const value = content[key];
    if (value != null && value !== '') {
      localStorage.setItem(key, value);
    }
  });
}

function collectSiteContent() {
  const content = {};
  SITE_CONTENT_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value != null) content[key] = value;
  });
  return content;
}

async function pullSiteContentFromServer() {
  if (!canUseSiteSync()) {
    window.HC_SITE_SYNC = false;
    return false;
  }

  try {
    const res = await fetch('/api/site-content', { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      window.HC_SITE_SYNC = false;
      return false;
    }
    const data = await res.json();
    const content = data.content || {};
    serverWasEmpty = !content.hc_products && !content.hc_categories;
    applySiteContent(content);
    window.HC_SITE_SYNC = true;
    return true;
  } catch {
    window.HC_SITE_SYNC = false;
    return false;
  }
}

async function pushSiteContentToServer() {
  if (!window.HC_SITE_SYNC) return false;

  if (pushInFlight) return pushInFlight;

  pushInFlight = (async () => {
    try {
      const res = await fetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: collectSiteContent() })
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      pushInFlight = null;
    }
  })();

  return pushInFlight;
}

function schedulePushSiteContent() {
  if (!window.HC_SITE_SYNC) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushSiteContentToServer().catch(() => {});
  }, 250);
}

async function persistImageDataUrl(dataUrl) {
  if (!dataUrl) return dataUrl;
  if (!dataUrl.startsWith('data:image')) return dataUrl;
  if (!canUseSiteSync()) return dataUrl;

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataUrl })
    });
    const data = await res.json();
    if (res.ok && data.url) return data.url;
    if (typeof showToast === 'function') {
      showToast(data.message || 'Image upload failed. Using inline image instead.');
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Could not upload image to server.');
    }
  }
  return dataUrl;
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    schedulePushSiteContent();
    return true;
  } catch (error) {
    if (error && error.name === 'QuotaExceededError' && typeof showToast === 'function') {
      showToast('Browser storage is full. Run the local server so images save as files.');
    }
    throw error;
  }
}

function warnIfFileProtocol() {
  if (!isFileProtocol()) return;
  if (document.body.classList.contains('admin-page')) {
    if (typeof showToast === 'function') {
      showToast('Open admin via http://localhost:8080 — offers and uploads do not work from file://');
    }
  }
}

window.__siteSyncPromise = pullSiteContentFromServer();

window.__siteStoreReady = (async () => {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve));
  } else {
    await Promise.resolve();
  }
  
  if (typeof initProductStore === 'function') initProductStore();
  if (typeof initContentStore === 'function') initContentStore();
  warnIfFileProtocol();
  return true;
})();

window.__siteSyncPromise.then((success) => {
  if (success) {
    if (typeof initProductStore === 'function') initProductStore();
    if (typeof initContentStore === 'function') initContentStore();
    if (typeof updateAuthUI === 'function') updateAuthUI();
    if (typeof updateCartCount === 'function') updateCartCount();
    document.dispatchEvent(new CustomEvent('siteContentUpdated'));
  }
  if (window.HC_SITE_SYNC && serverWasEmpty) {
    schedulePushSiteContent();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  warnIfFileProtocol();
});
