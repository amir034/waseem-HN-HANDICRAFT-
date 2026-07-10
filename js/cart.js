const CART_KEY = 'hc_cart';
const ORDERS_KEY = 'hc_orders';
const ORDER_COUNTER_KEY = 'hc_order_counter';

function getCartStorageKey() {
  if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) return null;
  const email = localStorage.getItem('hc_session') || (typeof isAdmin === 'function' && isAdmin() ? 'admin@gmail.com' : null);
  if (!email) return null;
  return 'hc_cart_' + email.trim().toLowerCase();
}

function getCart() {
  const key = getCartStorageKey();
  if (!key) return [];
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveCart(cart) {
  const key = getCartStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(cart));
  updateCartCount();
}

function migrateLegacyCart(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return;
  const legacyRaw = localStorage.getItem(CART_KEY);
  if (!legacyRaw) return;

  const legacyCart = JSON.parse(legacyRaw || '[]');
  localStorage.removeItem(CART_KEY);

  if (!legacyCart.length) return;

  const userKey = 'hc_cart_' + normalized;
  const userCart = JSON.parse(localStorage.getItem(userKey) || '[]');
  legacyCart.forEach(item => {
    const existing = userCart.find(i => i.productId === item.productId);
    if (existing) existing.quantity += item.quantity;
    else userCart.push(item);
  });
  localStorage.setItem(userKey, JSON.stringify(userCart));
}

function addToCart(productId, quantity = 1, forceSet = false) {
  if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }

  const product = getProductById(productId);
  if (!product || !product.inStock) return false;

  const cart = getCart();
  const existing = cart.find(item => item.productId === product.id);
  if (existing) {
    if (forceSet) {
      existing.quantity = quantity;
    } else {
      existing.quantity += quantity;
    }
  } else {
    cart.push({ productId: product.id, quantity });
  }
  saveCart(cart);
  showToast('Added to cart: ' + product.name);
  return true;
}

function removeFromCart(productId) {
  let cart = getCart().filter(item => item.productId !== productId);
  saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = quantity;
      saveCart(cart);
    }
  }
}

function clearCart() {
  const key = getCartStorageKey();
  if (key) localStorage.removeItem(key);
  updateCartCount();
}

function getCartTotal() {
  return getCart().reduce((total, item) => {
    const product = getProductById(item.productId);
    return total + (product ? getEffectivePrice(product) * item.quantity : 0);
  }, 0);
}

function getCartCount() {
  return getCart().reduce((count, item) => count + item.quantity, 0);
}

function updateCartCount() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn()) {
    migrateLegacyCart(localStorage.getItem('hc_session'));
  } else {
    updateCartCount();
  }
});

function generateOrderId() {
  const counter = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) || '0', 10) + 1;
  if (typeof safeStorageSet === 'function') {
    safeStorageSet(ORDER_COUNTER_KEY, String(counter));
  } else {
    localStorage.setItem(ORDER_COUNTER_KEY, String(counter));
  }
  return 'ORD-' + String(counter).padStart(6, '0');
}

function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

function saveOrders(orders) {
  if (typeof safeStorageSet === 'function') {
    safeStorageSet(ORDERS_KEY, JSON.stringify(orders));
  } else {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

function createOrder(userEmail, addressDetails, paymentMethod = 'COD', paymentId = '') {
  const cart = getCart();
  if (cart.length === 0) return null;

  const items = cart.map(item => {
    const product = getProductById(item.productId);
    const unitPrice = getEffectivePrice(product);
    return {
      productId: product.id,
      productCode: product.productCode,
      name: product.name,
      category: product.category,
      price: unitPrice,
      originalPrice: hasOffer(product) ? product.price : null,
      quantity: item.quantity,
      image: product.image
    };
  });

  const subtotal = getCartTotal();
  const shipping = subtotal >= 3000 ? 0 : 150;

  // Read promo from checkoutState if available
  const appliedPromo = typeof checkoutState !== 'undefined' ? (checkoutState.appliedPromo || '') : '';
  const promoDiscount = typeof checkoutState !== 'undefined' ? (checkoutState.promoDiscount || 0) : 0;

  const order = {
    id: generateOrderId(),
    userEmail,
    items,
    subtotal,
    shipping,
    appliedPromo,
    promoDiscount,
    total: Math.max(0, subtotal - promoDiscount) + shipping,
    addressDetails,
    shippingAddress: addressDetails.formatted,
    paymentMethod,
    paymentId,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    tracking: {
      confirmed: new Date().toISOString(),
      dispatched: null,
      shipped: null,
      delivered: null
    }
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  clearCart();

  // Reset promo state
  if (typeof checkoutState !== 'undefined') {
    checkoutState.appliedPromo = '';
    checkoutState.promoDiscount = 0;
  }

  return order;
}

function normalizeOrderStatus(status) {
  if (status === 'pending') return 'confirmed';
  return status || 'confirmed';
}

function getOrderStatusLabel(status) {
  const map = {
    confirmed: 'Received',
    dispatched: 'Dispatched',
    shipped: 'Shipped',
    delivered: 'Delivered'
  };
  return map[normalizeOrderStatus(status)] || status;
}

function getOrderCounts() {
  const orders = getOrders();
  return {
    total: orders.length,
    received: orders.filter(o => ['confirmed', 'pending', 'dispatched'].includes(normalizeOrderStatus(o.status))).length,
    shipping: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return false;
  order.status = status;
  if (!order.tracking) order.tracking = {};
  const key = status === 'confirmed' ? 'confirmed' : status;
  order.tracking[key] = new Date().toISOString();
  saveOrders(orders);
  return true;
}

function markOrderItemUnavailable(orderId, productId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  const item = order.items.find(i => i.productId === productId || i.productCode === productId);
  if (!item) return null;
  item.unavailable = true;
  item.unavailableAt = new Date().toISOString();
  saveOrders(orders);
  if (typeof addUserNotification === 'function') {
    addUserNotification(order.userEmail, {
      type: 'item_unavailable',
      orderId: order.id,
      productId: item.productId,
      message: `We're sorry — "${item.name}" from order ${order.id} is not available. We'll contact you shortly.`
    });
  }
  return item;
}

const RETURNS_KEY = 'hc_returns';

function getReturns() {
  return JSON.parse(localStorage.getItem(RETURNS_KEY) || '[]');
}

function saveReturns(returns) {
  if (typeof safeStorageSet === 'function') {
    safeStorageSet(RETURNS_KEY, JSON.stringify(returns));
  } else {
    localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
  }
}

function submitReturn(data) {
  const returns = getReturns();
  const ret = {
    id: 'RET-' + Date.now(),
    orderId: data.orderId,
    userEmail: data.userEmail,
    productId: data.productId,
    productName: data.productName,
    reason: data.reason,
    images: data.images || [],
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  returns.unshift(ret);
  saveReturns(returns);
  return ret;
}

function getUserOrders(email) {
  return getOrders().filter(o => o.userEmail === email);
}

function getOrderById(id) {
  return getOrders().find(o => o.id === id);
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
