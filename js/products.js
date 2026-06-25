const PRODUCTS_KEY = 'hc_products';
const CATEGORIES_KEY = 'hc_categories';
const PRODUCT_COUNTER_KEY = 'hc_product_counter';
const MAX_PRODUCT_IMAGES = 4;

const DEFAULT_CATEGORIES = [
  { id: 'fibers', label: 'Fibers' },
  { id: 'metal', label: 'Metal' },
  { id: 'wooden', label: 'Wooden' }
];

const DEFAULT_PRODUCTS = [
  { id: 'f1', name: 'Kala Cotton Handwoven Throw', category: 'fibers', price: 3200, image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=600&fit=crop', description: 'Luxurious handwoven throw crafted from indigenous Kala cotton by artisans in Kutch. Natural dyes, soft texture, perfect for home decor.', inStock: true },
  { id: 'f2', name: 'Zardozi Embroidered Sling Purse', category: 'fibers', price: 4200, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop', description: 'Elegant hand-embroidered sling purse featuring intricate zardozi work with gold thread on rich velvet. A statement accessory.', inStock: true },
  { id: 'f3', name: 'Indigo Block Print Cushion Cover Set', category: 'fibers', price: 1890, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop', description: 'Set of two cushion covers with traditional indigo block printing from Rajasthan. 100% organic cotton, natural dyes.', inStock: true },
  { id: 'f4', name: 'Banarasi Silk Table Runner', category: 'fibers', price: 2800, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=600&fit=crop', description: 'Exquisite Banarasi silk table runner with traditional brocade patterns. Handwoven by master weavers of Varanasi.', inStock: false },
  { id: 'f5', name: 'Chikankari Embroidered Stole', category: 'fibers', price: 1650, image: 'https://images.unsplash.com/photo-1601924999339-3e74d6c8ad9a?w=600&h=600&fit=crop', description: 'Delicate Lucknowi chikankari embroidered stole on pure georgette. Lightweight and elegant for any occasion.', inStock: true },
  { id: 'f6', name: 'Kantha Stitch Quilt', category: 'fibers', price: 5400, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=600&fit=crop', description: 'Hand-stitched kantha quilt from Bengal featuring layered cotton with running stitch patterns. Each piece is unique.', inStock: true },
  { id: 'm1', name: 'Meenakari Decorative Bowl', category: 'metal', price: 1500, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b24?w=600&h=600&fit=crop', description: 'Handcrafted meenakari enamel bowl with intricate floral motifs. Made by skilled artisans in Jaipur using traditional techniques.', inStock: true },
  { id: 'm2', name: 'Brass Aarti Diya Set', category: 'metal', price: 2900, image: 'https://images.unsplash.com/photo-1602874801006-4f486a8e0c0a?w=600&h=600&fit=crop', description: 'Set of handcrafted brass aarti diyas with detailed naquashi work. Perfect for festivals and daily rituals.', inStock: true },
  { id: 'm3', name: 'Copper Goblets — Set of 2', category: 'metal', price: 3980, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=600&fit=crop', description: 'Elegant hand-hammered copper goblets with a natural patina finish. Traditional drinkware reimagined for modern homes.', inStock: true },
  { id: 'm4', name: 'Brass Tealight Holder Gift Box', category: 'metal', price: 1890, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop', description: 'Premium gift box containing two lotus-shaped brass tealight holders. Handcrafted with precision metalwork.', inStock: true },
  { id: 'm5', name: 'Silver Filigree Pendant', category: 'metal', price: 3200, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop', description: 'Exquisite Cuttack silver filigree pendant featuring delicate wirework patterns passed down through generations.', inStock: false },
  { id: 'm6', name: 'Brass Incense Holder — Naquashi', category: 'metal', price: 3360, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop', description: 'Handcrafted brass dhoop dhani with intricate naquashi engraving. A beautiful addition to your meditation space.', inStock: true },
  { id: 'w1', name: 'Wood Inlay Serving Tray', category: 'wooden', price: 5400, image: 'https://images.unsplash.com/photo-1615529182904-1488c6e44335?w=600&h=600&fit=crop', description: 'Stunning sheesham wood serving tray with intricate bone inlay work. A masterpiece of Saharanpur craftsmanship.', inStock: true },
  { id: 'w2', name: 'Tarkashi Wooden Storage Box', category: 'wooden', price: 2760, image: 'https://images.unsplash.com/photo-1602874801006-4f486a8e0c0a?w=600&h=600&fit=crop', description: 'Handcrafted wooden box with brass tarkashi wire inlay. Perfect for jewelry, keepsakes, or desk organization.', inStock: true },
  { id: 'w3', name: 'Pattachitra Wooden Tray', category: 'wooden', price: 2500, image: 'https://images.unsplash.com/photo-1616047006789-d143375864f7?w=600&h=600&fit=crop', description: 'Bengal pattachitra art painted on a handcrafted wooden tray. Features traditional mythological motifs.', inStock: true },
  { id: 'w4', name: 'Carved Rosewood Coaster Set', category: 'wooden', price: 1200, image: 'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&h=600&fit=crop', description: 'Set of six hand-carved rosewood coasters with floral motifs. Finished with natural lacquer for durability.', inStock: true },
  { id: 'w5', name: 'Kashmiri Walnut Wood Bowl', category: 'wooden', price: 3800, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop', description: 'Hand-carved walnut wood bowl from Kashmir with papier-mâché inspired patterns. Functional art for your home.', inStock: true },
  { id: 'w6', name: 'Wooden Temple Frame', category: 'wooden', price: 4500, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=600&fit=crop', description: 'Ornately carved teak wood temple frame with jaali work. Designed for home mandir or as a decorative wall piece.', inStock: false }
];

function initProductStore() {
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    const products = DEFAULT_PRODUCTS.map((p, i) => ({
      ...p,
      productCode: 'PROD-' + String(i + 1).padStart(6, '0'),
      offerPrice: null,
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(PRODUCT_COUNTER_KEY, String(products.length));
  } else {
    migrateProducts();
  }
}

function migrateProducts() {
  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
  let counter = parseInt(localStorage.getItem(PRODUCT_COUNTER_KEY) || '0', 10);
  let changed = false;
  products.forEach(p => {
    if (!p.productCode) {
      counter++;
      p.productCode = 'PROD-' + String(counter).padStart(6, '0');
      if (p.offerPrice === undefined) p.offerPrice = null;
      changed = true;
    }
    if (!Array.isArray(p.images)) {
      p.images = [];
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(PRODUCT_COUNTER_KEY, String(counter));
  }
}

initProductStore();

function getCategories() {
  return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function getCategoryLabels() {
  const labels = {};
  getCategories().forEach(c => { labels[c.id] = c.label; });
  return labels;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generateProductCode() {
  const counter = parseInt(localStorage.getItem(PRODUCT_COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(PRODUCT_COUNTER_KEY, String(counter));
  return 'PROD-' + String(counter).padStart(6, '0');
}

function generateProductId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getProductById(id) {
  return getProducts().find(p => p.id === id || p.productCode === id);
}

function getProductByCode(code) {
  return getProducts().find(p => p.productCode === code);
}

function getProductsByCategory(category) {
  const products = getProducts();
  if (!category || category === 'all') return products;
  return products.filter(p => p.category === category);
}

function getEffectivePrice(product) {
  if (!product) return 0;
  if (product.offerPrice != null && product.offerPrice < product.price) return product.offerPrice;
  return product.price;
}

function getOfferDiscount(product) {
  if (!product || product.offerPrice == null || product.offerPrice >= product.price) return 0;
  return Math.round((1 - product.offerPrice / product.price) * 100);
}

function hasOffer(product) {
  return getOfferDiscount(product) > 0;
}

function formatPrice(price) {
  return 'Rs. ' + price.toLocaleString('en-IN') + '.00';
}

function renderPriceHtml(product, options = {}) {
  const hideBadge = options.hideBadge === true;
  if (hasOffer(product)) {
    const discount = getOfferDiscount(product);
    const badge = hideBadge ? '' : `<span class="price-off-badge">${discount}% OFF</span>`;
    return `<span class="price-original">${formatPrice(product.price)}</span>
            <span class="price-sale">${formatPrice(product.offerPrice)}</span>${badge}`;
  }
  return `<span class="price-regular">${formatPrice(product.price)}</span>`;
}

function getProductImages(product) {
  if (!product) return [];
  const extras = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const all = [product.image, ...extras.filter(img => img !== product.image)];
  return all.slice(0, MAX_PRODUCT_IMAGES);
}

function getProductImageCount(product) {
  return getProductImages(product).length;
}

function addCategory(label) {
  const id = slugify(label);
  if (!id) return { success: false, message: 'Invalid category name.' };
  const categories = getCategories();
  if (categories.find(c => c.id === id)) {
    return { success: false, message: 'Category already exists.' };
  }
  categories.push({ id, label });
  saveCategories(categories);
  return { success: true, category: { id, label } };
}

function addProduct(data) {
  const products = getProducts();
  const product = {
    id: generateProductId(),
    productCode: generateProductCode(),
    name: data.name,
    category: data.category,
    price: data.price,
    offerPrice: data.offerPrice || null,
    image: data.image,
    images: data.images || [],
    description: data.description || '',
    inStock: data.inStock !== false,
    createdAt: new Date().toISOString()
  };
  products.push(product);
  saveProducts(products);
  return product;
}

function updateProduct(id, updates) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id || p.productCode === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates };
  saveProducts(products);
  return products[idx];
}

function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id && p.productCode !== id);
  saveProducts(products);
}

const CATEGORY_LABELS = getCategoryLabels();
