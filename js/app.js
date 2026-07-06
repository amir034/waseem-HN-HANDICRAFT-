function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (slides.length === 0) return;

  let current = 0;
  if (!slides[current].classList.contains('active')) {
    slides[current].classList.add('active');
  }
  if (dots[current] && !dots[current].classList.contains('active')) {
    dots[current].classList.add('active');
  }
  syncHeroVideos(slides, current);

  function syncHeroVideos(slideList, activeIndex) {
    slideList.forEach((slide, i) => {
      const video = slide.querySelector('.hero-slide-video');
      if (!video) return;
      if (i === activeIndex) {
        video.load();
        video.play().catch(() => showHeroPosterFallback(slide, video));
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }

  function showHeroPosterFallback(slide, video) {
    if (video.dataset.fallbackApplied) return;
    const poster = video.getAttribute('poster');
    if (!poster) return;
    video.dataset.fallbackApplied = '1';
    video.style.display = 'none';
    let bg = slide.querySelector('.hero-slide-bg-fallback');
    if (!bg) {
      bg = document.createElement('div');
      bg.className = 'hero-slide-bg hero-slide-bg-fallback';
      slide.insertBefore(bg, slide.firstChild);
    }
    bg.style.backgroundImage = `url('${poster}')`;
  }

  slides.forEach(slide => {
    const video = slide.querySelector('.hero-slide-video');
    if (video) {
      video.addEventListener('error', () => showHeroPosterFallback(slide, video));
    }
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
    syncHeroVideos(slides, current);
    restartHeroContentAnimation(slides[current]);
  }

  function restartHeroContentAnimation(slide) {
    const content = slide.querySelector('.hero-content');
    if (!content) return;
    content.style.animation = 'none';
    void content.offsetHeight;
    content.style.animation = '';
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  setInterval(() => goTo(current + 1), 7000);
}

function initTestimonialSlider() {
  const slides = document.querySelectorAll('.testimonial-slide');
  if (slides.length === 0) return;

  let current = 0;
  slides[current].classList.add('active');

  const prevBtn = document.querySelector('.testimonial-prev');
  const nextBtn = document.querySelector('.testimonial-next');

  function goTo(index) {
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  setInterval(() => goTo(current + 1), 8000);
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

  reveals.forEach((el, i) => {
    if (!el.dataset.revealDelay) {
      el.style.transitionDelay = Math.min(i * 0.06, 0.36) + 's';
    }
    observer.observe(el);
  });
}

function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('header-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.mobile-nav');
  const close = document.querySelector('.mobile-nav-close');

  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    nav.classList.add('open');
    nav.setAttribute('aria-hidden', 'false');
  });
  if (close) close.addEventListener('click', () => {
    nav.classList.remove('open');
    nav.setAttribute('aria-hidden', 'true');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      nav.setAttribute('aria-hidden', 'true');
    });
  });
}

function renderProductCard(product) {
  let btnClass, btnText, btnAttrs;
  if (product.inStock) {
    btnClass = 'btn btn-primary btn-sm';
    btnText = 'Add to Cart';
    btnAttrs = `data-add-cart="${product.id}"`;
  } else {
    btnClass = 'btn btn-notify btn-sm';
    btnText = 'Notify Me';
    btnAttrs = `data-notify="${product.id}"`;
  }
  const badge = !product.inStock ? '<span class="product-badge">Out of Stock</span>' : '';
  const offerBadge = hasOffer(product) ? '<span class="product-badge offer-badge">' + getOfferDiscount(product) + '% OFF</span>' : '';
  const labels = getCategoryLabels();

  return `
    <div class="product-card" data-category="${product.category}" data-product-id="${product.id}" data-product-code="${product.productCode}">
      <a href="product.html?id=${product.id}">
        <div class="product-image-wrap">
          ${badge}
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="product-price">${renderPriceHtml(product)}</div>
        </div>
      </a>
      <button class="${btnClass}" ${btnAttrs}>
        ${btnText}
      </button>
    </div>
  `;
}

function renderProductGrid(container, category) {
  if (!container) return;
  const products = getProductsByCategory(category);
  container.innerHTML = products.map(renderProductCard).join('');

  container.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const added = addToCart(btn.dataset.addCart);
      if (added) {
        const originalText = btn.textContent;
        btn.classList.remove('btn-added');
        void btn.offsetWidth;
        btn.textContent = 'Added ✓';
        btn.classList.add('btn-added');
        setTimeout(() => {
          btn.classList.remove('btn-added');
          btn.textContent = originalText;
        }, 900);
      }
    });
  });

  container.querySelectorAll('[data-notify]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showNotifyModal(btn.dataset.notify);
    });
  });
}

function initProductFilters() {
  const filterContainer = document.querySelector('.product-filters');
  const grid = document.querySelector('.product-grid');
  if (!filterContainer || !grid) return;

  if (filterContainer.dataset.dynamic !== 'false') {
    const categories = getCategories();
    filterContainer.innerHTML = `
      <button class="filter-btn active" data-filter="all">All</button>
      ${categories.map(c => `<button class="filter-btn" data-filter="${c.id}">${c.label}</button>`).join('')}
    `;
  }

  const filterBtns = filterContainer.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.filter;
      renderProductGrid(grid, category);

      grid.querySelectorAll('.product-card').forEach((card, i) => {
        card.style.animationDelay = (i * 0.05) + 's';
      });
    });
  });
}

function showNotifyModal(productId) {
  const overlay = document.getElementById('notify-modal');
  if (!overlay) {
    showToast("We'll notify you when this product is back in stock!");
    return;
  }
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
  const closeBtn = document.getElementById('notify-modal-close');
  const form = document.getElementById('notify-form');
  const emailInput = document.getElementById('notify-email');

  function closeModal() {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    if (form) form.reset();
  }

  if (closeBtn) closeBtn.onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      if (email) {
        closeModal();
        showToast('Done! We\'ll email you at ' + email + ' when it\'s back in stock.');
      }
    };
  }
}

function positionDropdownMenu(dropdown) {
  const trigger = dropdown.querySelector('.nav-link') || dropdown.querySelector('a');
  const menu = dropdown.querySelector('.dropdown-menu');
  if (!trigger || !menu) return;
  const rect = trigger.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
}

function initNavDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-link');
    if (!trigger) return;
    trigger.style.cursor = 'pointer';

    dropdown.addEventListener('mouseenter', () => {
      positionDropdownMenu(dropdown);
    });

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
      if (!isOpen) {
        positionDropdownMenu(dropdown);
        dropdown.classList.add('open');
      }
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  });
}

function initDynamicCategoryNav() {
  const categories = getCategories();
  document.querySelectorAll('[data-category-nav]').forEach(nav => {
    nav.innerHTML = categories.map(c =>
      `<a href="shop.html?category=${c.id}">${c.label}</a>`
    ).join('');
  });
}

const DEFAULT_CATEGORY_IMAGES = {
  fibers: 'assets/images/handicraft/category-fibers.jpg',
  metal: 'assets/images/handicraft/category-metal.jpg',
  wooden: 'assets/images/handicraft/category-wooden.jpg'
};

function initCategoryGrid() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  const categories = getCategories();
  const products = getProducts();
  grid.innerHTML = categories.map(cat => {
    const count = products.filter(p => p.category === cat.id).length;
    const img = cat.image || DEFAULT_CATEGORY_IMAGES[cat.id] || products.find(p => p.category === cat.id)?.image || '';
    return `
      <a href="shop.html?category=${cat.id}" class="category-card">
        <img src="${img}" alt="${cat.label}">
        <div class="category-card-overlay">
          <div>
            <h3>${cat.label}</h3>
            <p class="category-count">${count} Product${count !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    if (input.value.trim()) {
      showToast('Thank you for subscribing!');
      input.value = '';
    }
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.__siteStoreReady) await window.__siteStoreReady;
  if (typeof initSitePromotions === 'function') initSitePromotions();
  if (typeof renderHeroSection === 'function') renderHeroSection();
  initScrollHeader();
  initHeroSlider();
  initTestimonialSlider();
  initScrollReveal();
  initMobileMenu();
  initNavDropdowns();
  initProductFilters();
  initDynamicCategoryNav();
  initCategoryGrid();
  initWelcomeSection();
  initNewsletter();
  initSmoothScroll();
  updateCartCount();
  updateAuthUI();
  initWelcomeMessage();
  initSignupNotice();

  renderArtisansSection();

  const grid = document.querySelector('.product-grid');
  if (grid && grid.dataset.autoRender !== 'false') {
    renderProductGrid(grid, 'all');
  }
  injectOffersButtons();
});

document.addEventListener('siteContentUpdated', () => {
  if (typeof initSitePromotions === 'function') initSitePromotions();
  if (typeof renderHeroSection === 'function') renderHeroSection();
  if (typeof initDynamicCategoryNav === 'function') initDynamicCategoryNav();
  if (typeof initCategoryGrid === 'function') initCategoryGrid();
  if (typeof initWelcomeSection === 'function') initWelcomeSection();
  if (typeof renderArtisansSection === 'function') renderArtisansSection();
  if (typeof updateAuthUI === 'function') updateAuthUI();
  injectOffersButtons();

  const grid = document.querySelector('.product-grid');
  if (grid && grid.dataset.autoRender !== 'false') {
    renderProductGrid(grid, 'all');
  }
});

function initWelcomeSection() {
  const introContainer = document.querySelector('#intro .section-header');
  if (introContainer) {
    const data = typeof getWelcomeSection === 'function' ? getWelcomeSection() : {
      title: 'Shop Now',
      text: 'Welcome to HN Handicraft, where tradition meets innovation. We proudly present a curated selection of our finest handcrafted creations, meticulously crafted by skilled artisans from across India.'
    };
    introContainer.innerHTML = `
      <h2>${data.title}</h2>
      <p>${data.text}</p>
    `;
  }
}

function injectOffersButtons() {
  try {
    // Desktop header
    const navLeft = document.querySelector('.nav-left');
    if (navLeft && !navLeft.querySelector('.offers-link')) {
      const offersBtn = document.createElement('a');
      offersBtn.href = '#';
      offersBtn.className = 'offers-link';
      offersBtn.innerHTML = '<span style="font-size:0.95rem; margin-right:4px;">&#x1F3F7;&#xFE0F;</span> Offers';
      offersBtn.style.cssText = 'color:var(--color-accent) !important; font-weight:600 !important; display:inline-flex !important; align-items:center !important; cursor:pointer;';
      offersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openOffersModal();
      });
      navLeft.appendChild(offersBtn);
    }

    // Mobile nav
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && !mobileNav.querySelector('.offers-link-mobile')) {
      const offersBtnMobile = document.createElement('a');
      offersBtnMobile.href = '#';
      offersBtnMobile.className = 'offers-link-mobile';
      offersBtnMobile.innerHTML = '&#x1F3F7;&#xFE0F; Running Offers';
      offersBtnMobile.style.cssText = 'color:var(--color-accent) !important; font-weight:600 !important; cursor:pointer;';
      offersBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        openOffersModal();
      });
      const loginLink = mobileNav.querySelector('[data-auth="guest"]') || mobileNav.querySelector('[data-auth="user"]');
      if (loginLink) {
        mobileNav.insertBefore(offersBtnMobile, loginLink);
      } else {
        mobileNav.appendChild(offersBtnMobile);
      }
    }

    // Floating Offers FAB (always visible, above WhatsApp button)
    if (!document.getElementById('offers-fab')) {
      const fab = document.createElement('button');
      fab.id = 'offers-fab';
      fab.type = 'button';
      fab.innerHTML = '&#x1F3F7;&#xFE0F;';
      fab.setAttribute('aria-label', 'View Offers');
      fab.title = 'View Offers';

      const fabStyle = document.createElement('style');
      fabStyle.textContent = `
        #offers-fab {
          position: fixed;
          bottom: 100px;
          right: 24px;
          z-index: 1999;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #c29958, #a8834a);
          color: #fff;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(194, 153, 88, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
          animation: offersPulse 2s ease-in-out infinite;
        }
        #offers-fab:hover {
          transform: scale(1.12);
          box-shadow: 0 6px 24px rgba(194, 153, 88, 0.55);
        }
        @keyframes offersPulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(194, 153, 88, 0.4); }
          50% { box-shadow: 0 4px 24px rgba(194, 153, 88, 0.65); }
        }
        @media (max-width: 768px) {
          #offers-fab {
            bottom: 90px;
            right: 16px;
            width: 46px;
            height: 46px;
            font-size: 1.3rem;
          }
        }
      `;
      document.head.appendChild(fabStyle);
      fab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openOffersModal();
      });
      document.body.appendChild(fab);
    }
  } catch (err) {
    console.error('injectOffersButtons error:', err);
  }
}

function openOffersModal() {
  let modal = document.getElementById('offers-popup-modal');
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    return;
  }
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'offers-popup-modal';
    modal.className = 'offers-modal';
    
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .offers-modal {
        position: fixed !important;
        inset: 0 !important;
        z-index: 20000 !important;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .offers-modal.open {
        opacity: 1;
        pointer-events: auto;
      }
      .offers-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
      }
      .offers-modal-card {
        position: relative;
        width: 90%;
        max-width: 580px;
        max-height: 80vh;
        background: #fdfcf7;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #e8e3d5;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(30px) scale(0.95);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .offers-modal.open .offers-modal-card {
        transform: translateY(0) scale(1);
      }
      .offers-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f7f4eb;
      }
      .offers-modal-header h2 {
        margin: 0;
        font-family: Cormorant Garamond, serif;
        font-size: 1.4rem;
        color: #5c4033;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .offers-modal-close {
        background: none;
        border: none;
        font-size: 1.8rem;
        cursor: pointer;
        color: #888;
        transition: color 0.2s;
        line-height: 1;
      }
      .offers-modal-close:hover {
        color: #333;
      }
      .offers-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .offer-coupon-card {
        background: #fff;
        border: 1px solid #ebdcb9;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .offer-coupon-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(235, 220, 185, 0.3);
      }
      .offer-coupon-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .offer-discount-badge {
        background: #f7f0df;
        color: #9c7329;
        font-family: Cormorant Garamond, serif;
        font-size: 1.3rem;
        font-weight: bold;
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px dashed #ebdcb9;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .offer-details {
        flex: 1;
        text-align: left;
      }
      .offer-code-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        letter-spacing: 0.5px;
      }
      .offer-scope-text {
        font-size: 0.78rem;
        color: #666;
        margin-top: 2px;
      }
      .offer-copy-btn {
        background: #b89047;
        color: #fff;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }
      .offer-copy-btn:hover {
        background: #88601d;
      }
      .offer-copy-btn.copied {
        background: #4caf50;
      }
      .offer-products-toggle {
        font-size: 0.8rem;
        color: #9c7329;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        text-align: left;
        font-weight: 500;
        width: fit-content;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .offer-products-list {
        display: none;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 8px;
      }
      .offer-products-list.show {
        display: grid;
      }
      .offer-product-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fdfcf9;
        border: 1px solid #eee;
        padding: 6px;
        border-radius: 6px;
        text-decoration: none;
        color: #333;
        transition: background 0.2s;
      }
      .offer-product-item:hover {
        background: #f7f4eb;
      }
      .offer-product-item img {
        width: 32px;
        height: 32px;
        object-fit: cover;
        border-radius: 4px;
      }
      .offer-product-item span {
        font-size: 0.72rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .offers-empty {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(styleEl);

    modal.innerHTML = `
      <div class="offers-modal-overlay"></div>
      <div class="offers-modal-card">
        <div class="offers-modal-header">
          <h2>🏷️ Running Offers & Promos</h2>
          <button type="button" class="offers-modal-close">&times;</button>
        </div>
        <div class="offers-modal-body" id="offers-modal-body-content"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('offers-modal-overlay') || e.target.closest('.offers-modal-close')) {
        modal.classList.remove('open');
      }
    });
  }

  // Populate content
  const bodyContent = document.getElementById('offers-modal-body-content');
  const promos = typeof getPromos === 'function' ? getPromos() : [];
  const products = typeof getProducts === 'function' ? getProducts() : [];

  if (promos.length === 0) {
    bodyContent.innerHTML = '<div class="offers-empty">No promo codes are currently running. Check back later!</div>';
  } else {
    bodyContent.innerHTML = promos.map(promo => {
      const applicableProducts = products.filter(p => p.promoEnabled && p.promoCode === promo.code);
      const isStorewide = applicableProducts.length === 0;

      let productsHtml = '';
      if (!isStorewide) {
        productsHtml = `
          <button type="button" class="offer-products-toggle" onclick="this.nextElementSibling.classList.toggle('show')">
            Show Applicable Products (${applicableProducts.length}) ▾
          </button>
          <div class="offer-products-list">
            ${applicableProducts.map(p => `
              <a href="product.html?id=${p.id}" class="offer-product-item">
                <img src="${p.image}" alt="">
                <span>${p.name}</span>
              </a>
            `).join('')}
          </div>
        `;
      }

      return `
        <div class="offer-coupon-card">
          <div class="offer-coupon-main">
            <div class="offer-discount-badge">${promo.discount}% OFF</div>
            <div class="offer-details">
              <div class="offer-code-text">${promo.code}</div>
              <div class="offer-scope-text">${isStorewide ? 'Applicable to: All Products' : 'Applicable to: Selected Products'}</div>
            </div>
            <button type="button" class="offer-copy-btn" data-code="${promo.code}">Copy Code</button>
          </div>
          ${productsHtml}
        </div>
      `;
    }).join('');

    // Bind copy events
    bodyContent.querySelectorAll('.offer-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          if (typeof showToast === 'function') {
            showToast(`Promo code "${code}" copied to clipboard!`);
          }
          setTimeout(() => {
            btn.textContent = 'Copy Code';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    });
  }

  modal.classList.add('open');
}

// ====== Standalone Offers Initializer ======
// Runs independently from the main DOMContentLoaded to guarantee the offers FAB appears
(function() {
  function safeInjectOffers() {
    try { injectOffersButtons(); } catch(e) { console.error('Offers inject failed:', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInjectOffers);
  } else {
    safeInjectOffers();
  }
  // Safety net: try again after 1.5s in case something delayed rendering
  setTimeout(safeInjectOffers, 1500);
})();
