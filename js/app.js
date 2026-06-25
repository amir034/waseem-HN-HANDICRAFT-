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
  const btnClass = product.inStock ? 'btn btn-primary btn-sm' : 'btn btn-sold-out btn-sm';
  const btnText = product.inStock ? 'Add to Cart' : 'Sold Out';
  const badge = !product.inStock ? '<span class="product-badge">Sold Out</span>' : '';
  const offerBadge = hasOffer(product) ? '<span class="product-badge offer-badge">' + getOfferDiscount(product) + '% OFF</span>' : '';
  const labels = getCategoryLabels();

  return `
    <div class="product-card" data-category="${product.category}" data-product-id="${product.id}" data-product-code="${product.productCode}">
      <a href="product.html?id=${product.id}">
        <div class="product-image-wrap">
          ${badge || offerBadge}
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="product-price">${renderPriceHtml(product)}</div>
        </div>
      </a>
      <button class="${btnClass}" data-add-cart="${product.id}" ${!product.inStock ? 'disabled' : ''}>
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
      addToCart(btn.dataset.addCart);
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
    const img = DEFAULT_CATEGORY_IMAGES[cat.id] || products.find(p => p.category === cat.id)?.image || '';
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

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initSitePromotions === 'function') initSitePromotions();
  if (typeof renderHeroSection === 'function') renderHeroSection();
  initHeroSlider();
  initTestimonialSlider();
  initScrollReveal();
  initMobileMenu();
  initProductFilters();
  initDynamicCategoryNav();
  initCategoryGrid();
  initNewsletter();
  initSmoothScroll();
  updateCartCount();
  updateAuthUI();
  initWelcomeMessage();

  renderArtisansSection();

  const grid = document.querySelector('.product-grid');
  if (grid && grid.dataset.autoRender !== 'false') {
    renderProductGrid(grid, 'all');
  }
});
