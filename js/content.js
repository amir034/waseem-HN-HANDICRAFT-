const ARTISANS_KEY = 'hc_artisans';
const ARTISAN_SECTION_KEY = 'hc_artisan_section';
const ANNOUNCEMENTS_KEY = 'hc_announcements';
const OFFER_POPUP_KEY = 'hc_offer_popup';
const HERO_SLIDES_KEY = 'hc_hero_slides';

const DEFAULT_HERO_SLIDES = [
  {
    id: 'hero_1',
    image: 'assets/images/handicraft/hero-weaving-rug.jpg',
    brand: 'HN Handicraft',
    title: "Celebrate India's Rich Craft Heritage",
    subtitle: 'Every piece tells a story of generations of artisanal mastery',
    buttonText: 'Explore Crafts',
    buttonLink: '#categories',
    sortOrder: 0
  },
  {
    id: 'hero_2',
    image: 'assets/images/handicraft/hero-assam-weaving.jpg',
    brand: 'HN Handicraft',
    title: 'Handwoven Treasures From Across India',
    subtitle: 'Kala cotton, Banarasi silk, and indigenous textiles crafted by master weavers',
    buttonText: 'Shop Textiles',
    buttonLink: 'shop.html?category=fibers',
    sortOrder: 1
  },
  {
    id: 'hero_3',
    image: 'assets/images/handicraft/hero-pottery-india.jpg',
    brand: 'HN Handicraft',
    title: 'Artistry Shaped By Hand',
    subtitle: 'Traditional pottery and clay crafts shaped on the wheel by skilled artisans',
    buttonText: 'Shop Collection',
    buttonLink: 'shop.html',
    sortOrder: 2
  },
  {
    id: 'hero_4',
    image: 'assets/images/handicraft/hero-metal-craft.jpg',
    brand: 'HN Handicraft',
    title: 'Where Tradition Meets Innovation',
    subtitle: 'Meenakari enamel, brass work, and metal crafts made by skilled artisans',
    buttonText: 'Shop Metal Crafts',
    buttonLink: 'shop.html?category=metal',
    sortOrder: 3
  },
  {
    id: 'hero_5',
    image: 'assets/images/handicraft/hero-embroidery.jpg',
    brand: 'HN Handicraft',
    title: 'Threads, Colours & Stories',
    subtitle: "Embroidery, block print, and textile arts from India's craft heartlands",
    buttonText: 'Discover Textiles',
    buttonLink: 'shop.html?category=fibers',
    sortOrder: 4
  },
  {
    id: 'hero_6',
    image: 'assets/images/handicraft/hero-loom-workshop.jpg',
    brand: 'HN Handicraft',
    title: 'Elevate Your Occasions With Handcrafted Gifts',
    subtitle: "Customised bulk gifting and wedding favours from India's finest makers",
    buttonText: 'Get In Touch',
    buttonLink: '#services',
    sortOrder: 5
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  'Namaste! Use code CRAFT5 for 5% off your first purchase!',
  'Free shipping on orders above Rs. 3,000',
  'Handcrafted with love by artisans across India'
];

const DEFAULT_OFFER_POPUP = {
  enabled: false,
  title: 'Special Offer!',
  message: 'Get 5% off your first purchase. Use the code below at checkout.',
  code: 'CRAFT5',
  buttonText: 'Shop Now',
  buttonLink: 'shop.html',
  updatedAt: ''
};

const DEFAULT_ARTISAN_SECTION = {
  label: 'The Makers',
  title: 'Our Artisans',
  intro: 'Behind every HN Handicraft product is a master artisan — a weaver, engraver, painter, or carver whose skill has been honed over decades. Meet some of the talented hands that bring our collection to life.',
  footerNote: 'We partner with 50+ artisan families across 12 states. Each purchase directly supports their craft, their community, and the preservation of India\'s intangible cultural heritage.'
};

const DEFAULT_ARTISANS = [
  {
    id: 'artisan_1',
    name: 'Meera Ben',
    craft: 'Kala Cotton Weaving',
    location: 'Kutch, Gujarat',
    description: 'A third-generation weaver, Meera creates handwoven throws and stoles using indigenous Kala cotton and natural dyes. Her work preserves a centuries-old Kutchi textile tradition.',
    image: 'assets/images/handicraft/artisan-1.jpg',
    sortOrder: 0
  },
  {
    id: 'artisan_2',
    name: 'Rajesh Kumar',
    craft: 'Meenakari Enamel',
    location: 'Jaipur, Rajasthan',
    description: 'Rajesh learned meenakari from his father at age twelve. Today he crafts enamel bowls, diyas, and decorative pieces with intricate floral motifs in gold and jewel tones.',
    image: 'assets/images/handicraft/artisan-2.jpg',
    sortOrder: 1
  },
  {
    id: 'artisan_3',
    name: 'Imran Sheikh',
    craft: 'Wood Inlay',
    location: 'Saharanpur, Uttar Pradesh',
    description: 'Imran specialises in sheesham wood inlay — a meticulous craft requiring patience and precision. His serving trays and storage boxes are prized across India and abroad.',
    image: 'assets/images/handicraft/category-wooden.jpg',
    sortOrder: 2
  },
  {
    id: 'artisan_4',
    name: 'Fatima Begum',
    craft: 'Chikankari Embroidery',
    location: 'Lucknow, Uttar Pradesh',
    description: 'Fatima leads a cooperative of women embroiderers creating delicate Lucknowi chikankari stoles and apparel. Her group has trained over forty young women in the craft.',
    image: 'assets/images/handicraft/artisan-4.jpg',
    sortOrder: 3
  }
];

function storeContentItem(key, value) {
  if (typeof safeStorageSet === 'function') {
    safeStorageSet(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

function initContentStore() {
  if (!localStorage.getItem(ARTISAN_SECTION_KEY)) {
    storeContentItem(ARTISAN_SECTION_KEY, JSON.stringify(DEFAULT_ARTISAN_SECTION));
  }
  if (!localStorage.getItem(ARTISANS_KEY)) {
    storeContentItem(ARTISANS_KEY, JSON.stringify(DEFAULT_ARTISANS));
  }
  if (!localStorage.getItem(ANNOUNCEMENTS_KEY)) {
    storeContentItem(ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem(OFFER_POPUP_KEY)) {
    storeContentItem(OFFER_POPUP_KEY, JSON.stringify(DEFAULT_OFFER_POPUP));
  }
  if (!localStorage.getItem(HERO_SLIDES_KEY)) {
    storeContentItem(HERO_SLIDES_KEY, JSON.stringify(DEFAULT_HERO_SLIDES));
  }
}

function getHeroSlides() {
  return JSON.parse(localStorage.getItem(HERO_SLIDES_KEY) || '[]')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function saveHeroSlides(slides) {
  storeContentItem(HERO_SLIDES_KEY, JSON.stringify(slides));
}

function getHeroSlideById(id) {
  return getHeroSlides().find(s => s.id === id);
}

function addHeroSlide(data) {
  const slides = getHeroSlides();
  const slide = {
    id: 'hero_' + Date.now(),
    image: data.image,
    brand: data.brand || 'HN Handicraft',
    title: data.title,
    subtitle: data.subtitle || '',
    buttonText: data.buttonText || 'Shop Now',
    buttonLink: data.buttonLink || 'shop.html',
    sortOrder: slides.length
  };
  slides.push(slide);
  saveHeroSlides(slides);
  return slide;
}

function updateHeroSlide(id, updates) {
  const slides = getHeroSlides();
  const idx = slides.findIndex(s => s.id === id);
  if (idx === -1) return null;
  slides[idx] = { ...slides[idx], ...updates };
  saveHeroSlides(slides);
  return slides[idx];
}

function deleteHeroSlide(id) {
  const slides = getHeroSlides().filter(s => s.id !== id);
  slides.forEach((slide, i) => { slide.sortOrder = i; });
  saveHeroSlides(slides);
}

function moveHeroSlide(id, direction) {
  const slides = getHeroSlides();
  const idx = slides.findIndex(s => s.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= slides.length) return;
  [slides[idx], slides[swapIdx]] = [slides[swapIdx], slides[idx]];
  slides.forEach((slide, i) => { slide.sortOrder = i; });
  saveHeroSlides(slides);
}

function renderHeroSlideHtml(slide, isFirst) {
  const subtitle = slide.subtitle
    ? `<p>${escapeHtml(slide.subtitle)}</p>`
    : '';
  const button = slide.buttonText
    ? `<a href="${escapeAttr(slide.buttonLink || 'shop.html')}" class="btn btn-primary">${escapeHtml(slide.buttonText)}</a>`
    : '';
  return `
    <div class="hero-slide${isFirst ? ' active' : ''}" data-hero-id="${escapeAttr(slide.id)}">
      <div class="hero-slide-bg" style="background-image: url('${escapeAttr(slide.image)}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-brand">${escapeHtml(slide.brand || 'HN Handicraft')}</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${subtitle}
        ${button}
      </div>
    </div>
  `;
}

function renderHeroSection() {
  const slider = document.querySelector('.hero-slider');
  if (!slider) return;

  let slides = getHeroSlides();
  if (slides.length === 0) slides = DEFAULT_HERO_SLIDES;

  const dotsHtml = slides.map((_, i) =>
    `<button class="hero-dot${i === 0 ? ' active' : ''}" aria-label="Slide ${i + 1}"></button>`
  ).join('');

  slider.innerHTML = slides.map((slide, i) => renderHeroSlideHtml(slide, i === 0)).join('') +
    `<div class="hero-dots">${dotsHtml}</div>`;
  slider.classList.add('hero-ready');
}

function getArtisanSection() {
  return JSON.parse(localStorage.getItem(ARTISAN_SECTION_KEY) || '{}');
}

function saveArtisanSection(data) {
  const section = { ...getArtisanSection(), ...data };
  storeContentItem(ARTISAN_SECTION_KEY, JSON.stringify(section));
  return section;
}

function getArtisans() {
  return JSON.parse(localStorage.getItem(ARTISANS_KEY) || '[]')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function saveArtisans(artisans) {
  storeContentItem(ARTISANS_KEY, JSON.stringify(artisans));
}

function getArtisanById(id) {
  return getArtisans().find(a => a.id === id);
}

function normalizeArtisanFields(artisan) {
  let craft = artisan.craft || '';
  let location = artisan.location || '';
  if (!location && craft.includes(' · ')) {
    const parts = craft.split(' · ');
    craft = parts[0].trim();
    location = parts.slice(1).join(' · ').trim();
  }
  return { craft, location };
}

function formatArtisanMeta(artisan) {
  const { craft, location } = normalizeArtisanFields(artisan);
  if (craft && location) return `${craft} · ${location}`;
  return craft || location;
}

function addArtisan(data) {
  const artisans = getArtisans();
  const artisan = {
    id: 'artisan_' + Date.now(),
    name: data.name,
    craft: data.craft,
    location: data.location || '',
    description: data.description || '',
    image: data.image,
    sortOrder: artisans.length
  };
  artisans.push(artisan);
  saveArtisans(artisans);
  return artisan;
}

function updateArtisan(id, updates) {
  const artisans = getArtisans();
  const idx = artisans.findIndex(a => a.id === id);
  if (idx === -1) return null;
  artisans[idx] = { ...artisans[idx], ...updates };
  saveArtisans(artisans);
  return artisans[idx];
}

function deleteArtisan(id) {
  const artisans = getArtisans().filter(a => a.id !== id);
  saveArtisans(artisans);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function renderArtisanCard(artisan) {
  const { craft, location } = normalizeArtisanFields(artisan);
  return `
    <div class="artisan-card">
      <div class="artisan-img">
        <img src="${artisan.image}" alt="${escapeHtml(artisan.name)}">
      </div>
      <div class="artisan-info">
        <h3>${escapeHtml(artisan.name)}</h3>
        <span class="artisan-craft">${escapeHtml(craft)}</span>
        ${location ? `<span class="artisan-location">${escapeHtml(location)}</span>` : ''}
        <p>${escapeHtml(artisan.description)}</p>
      </div>
    </div>
  `;
}

function renderArtisansSection() {
  const grid = document.getElementById('artisans-grid');
  if (!grid) return;

  const section = getArtisanSection();
  const artisans = getArtisans();

  const labelEl = document.getElementById('artisans-label');
  const titleEl = document.getElementById('artisans-title');
  const introEl = document.getElementById('artisans-intro');
  const noteEl = document.getElementById('artisans-note');

  if (labelEl) labelEl.textContent = section.label || DEFAULT_ARTISAN_SECTION.label;
  if (titleEl) titleEl.textContent = section.title || DEFAULT_ARTISAN_SECTION.title;
  if (introEl) introEl.textContent = section.intro || DEFAULT_ARTISAN_SECTION.intro;
  if (noteEl) {
    noteEl.textContent = section.footerNote || DEFAULT_ARTISAN_SECTION.footerNote;
    noteEl.style.display = (section.footerNote || DEFAULT_ARTISAN_SECTION.footerNote) ? '' : 'none';
  }

  if (artisans.length === 0) {
    grid.innerHTML = '<p class="admin-empty" style="grid-column:1/-1;text-align:center;">Artisan profiles coming soon.</p>';
    return;
  }

  grid.innerHTML = artisans.map(renderArtisanCard).join('');
}

function getAnnouncements() {
  const stored = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]');
  return Array.isArray(stored) ? stored.filter(Boolean) : [];
}

function saveAnnouncements(messages) {
  const cleaned = messages.map(m => String(m).trim()).filter(Boolean);
  storeContentItem(ANNOUNCEMENTS_KEY, JSON.stringify(cleaned));
  return cleaned;
}

function getOfferPopup() {
  return { ...DEFAULT_OFFER_POPUP, ...JSON.parse(localStorage.getItem(OFFER_POPUP_KEY) || '{}') };
}

function saveOfferPopup(data) {
  const offer = {
    ...getOfferPopup(),
    ...data,
    updatedAt: new Date().toISOString()
  };
  storeContentItem(OFFER_POPUP_KEY, JSON.stringify(offer));
  return offer;
}

function ensureAnnouncementTicker() {
  if (document.getElementById('announcement-ticker-wrap')) return;
  const header = document.querySelector('.site-header');
  if (!header) return;
  const wrap = document.createElement('div');
  wrap.id = 'announcement-ticker-wrap';
  wrap.className = 'announcement-ticker-wrap';
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="announcement-ticker">
      <div class="announcement-ticker-track" id="announcement-ticker-track"></div>
    </div>
  `;
  header.insertAdjacentElement('afterend', wrap);
}

function ensureOfferPopupModal() {
  if (document.getElementById('offer-popup')) return;
  const overlay = document.createElement('div');
  overlay.id = 'offer-popup';
  overlay.className = 'offer-popup-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="offer-popup-card" role="dialog" aria-modal="true" aria-labelledby="offer-popup-title">
      <button type="button" class="offer-popup-close" aria-label="Close">&times;</button>
      <span class="offer-popup-badge">Limited Offer</span>
      <h2 id="offer-popup-title"></h2>
      <p id="offer-popup-message"></p>
      <div class="offer-popup-code-wrap" id="offer-popup-code-wrap" hidden>
        <span class="offer-popup-code-label">Use code</span>
        <strong id="offer-popup-code"></strong>
      </div>
      <a class="btn btn-primary offer-popup-btn" id="offer-popup-btn" href="shop.html"></a>
    </div>
  `;
  document.body.appendChild(overlay);
}

function renderAnnouncementTicker() {
  ensureAnnouncementTicker();
  const track = document.getElementById('announcement-ticker-track');
  const wrap = document.getElementById('announcement-ticker-wrap');
  if (!track || !wrap) return;

  const messages = getAnnouncements();
  if (messages.length === 0) {
    wrap.hidden = true;
    track.innerHTML = '';
    return;
  }

  wrap.hidden = false;
  const items = messages.map(text =>
    `<span class="announcement-ticker-item">${escapeHtml(text)}</span><span class="announcement-ticker-dot" aria-hidden="true">✦</span>`
  ).join('');
  track.innerHTML = items + items;
  track.style.animationDuration = Math.max(18, messages.join('').length * 0.35) + 's';
}

function showOfferPopupIfNeeded() {
  if (document.body.classList.contains('admin-page')) return;

  ensureOfferPopupModal();
  const offer = getOfferPopup();
  const overlay = document.getElementById('offer-popup');
  if (!overlay || !offer.enabled) return;

  const dismissKey = 'hc_offer_seen_' + (offer.updatedAt || 'default');
  if (sessionStorage.getItem(dismissKey)) return;

  const titleEl = document.getElementById('offer-popup-title');
  const messageEl = document.getElementById('offer-popup-message');
  const codeWrap = document.getElementById('offer-popup-code-wrap');
  const codeEl = document.getElementById('offer-popup-code');
  const btnEl = document.getElementById('offer-popup-btn');

  titleEl.textContent = offer.title || DEFAULT_OFFER_POPUP.title;
  messageEl.textContent = offer.message || '';
  if (offer.code) {
    codeWrap.hidden = false;
    codeEl.textContent = offer.code;
  } else {
    codeWrap.hidden = true;
  }
  btnEl.textContent = offer.buttonText || 'Shop Now';
  btnEl.href = offer.buttonLink || 'shop.html';

  function closePopup() {
    overlay.hidden = true;
    sessionStorage.setItem(dismissKey, '1');
  }

  overlay.querySelector('.offer-popup-close').onclick = closePopup;
  overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };
  btnEl.onclick = () => closePopup();

  setTimeout(() => { overlay.hidden = false; }, 1200);
}

function initSitePromotions() {
  renderAnnouncementTicker();
  showOfferPopupIfNeeded();
}

function renderAnnouncementBar() {
  renderAnnouncementTicker();
}
