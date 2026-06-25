const SITE_WHATSAPP_NUMBER = '8273038804';
const SITE_WHATSAPP_E164 = '91' + SITE_WHATSAPP_NUMBER;
const SITE_CONTACT_EMAIL = 'hnhandicraftO@gmail.com';

function getWhatsAppUrl(message) {
  const url = `https://wa.me/${SITE_WHATSAPP_E164}`;
  if (message) return `${url}?text=${encodeURIComponent(message)}`;
  return url;
}

function getWhatsAppDisplayNumber() {
  return '+91 ' + SITE_WHATSAPP_NUMBER.slice(0, 5) + ' ' + SITE_WHATSAPP_NUMBER.slice(5);
}

function initWhatsAppLinks() {
  const url = getWhatsAppUrl();

  document.querySelectorAll('[data-whatsapp-link], .whatsapp-fab').forEach(el => {
    el.href = url;
  });

  document.querySelectorAll('[data-whatsapp-phone]').forEach(el => {
    el.textContent = getWhatsAppDisplayNumber();
    if (el.tagName === 'A') el.href = `tel:+${SITE_WHATSAPP_E164}`;
  });
}

function initContactEmail() {
  document.querySelectorAll('[data-contact-email]').forEach(el => {
    el.href = 'mailto:' + SITE_CONTACT_EMAIL;
    if (el.dataset.contactEmail !== 'link-only') {
      el.textContent = SITE_CONTACT_EMAIL;
    }
  });
}

function getSiteFooterHtml() {
  const year = new Date().getFullYear();
  return `
    <div class="container">
      <div class="footer-top">
        <a href="index.html" class="footer-logo" aria-label="HN Handicraft Home">
          <span class="footer-logo-main">HN</span>
          <span class="footer-logo-sub">Handicraft</span>
        </a>
        <div class="footer-accent-line" aria-hidden="true"><span></span></div>
      </div>
      <div class="footer-grid">
        <div class="footer-brand">
          <p>Celebrating India's rich craft heritage through authentic handcrafted products made by skilled artisans across the country.</p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <a href="index.html">Home</a>
          <a href="index.html#about">Our Story</a>
          <a href="index.html#artisans">Our Artisans</a>
          <a href="index.html#services">Bulk Gifting</a>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <a href="shop.html">All Products</a>
          <div data-category-nav></div>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <a href="login.html">Login</a>
          <a href="signup.html">Sign Up</a>
          <a href="profile.html">My Profile</a>
          <a href="cart.html">Cart</a>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <a href="mailto:${SITE_CONTACT_EMAIL}" data-contact-email>${SITE_CONTACT_EMAIL}</a>
          <a href="tel:+${SITE_WHATSAPP_E164}" data-whatsapp-phone>${getWhatsAppDisplayNumber()}</a>
          <a href="${getWhatsAppUrl()}" data-whatsapp-link target="_blank" rel="noopener">WhatsApp Us</a>
          <div class="social-icons-mount contact-social"></div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${year} HN Handicraft. All rights reserved.</span>
        <div class="social-icons-mount" data-social-class="social-icons"></div>
      </div>
    </div>
  `;
}

function initSiteFooter() {
  document.querySelectorAll('[data-site-footer]').forEach(footer => {
    footer.innerHTML = getSiteFooterHtml();
  });
  initContactEmail();
  initWhatsAppLinks();
  if (typeof initDynamicCategoryNav === 'function') initDynamicCategoryNav();
  if (typeof initSocialIcons === 'function') initSocialIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  initSiteFooter();
});
