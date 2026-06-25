const CART_KEY = 'hc_cart';
const ORDERS_KEY = 'hc_orders';
const ORDER_COUNTER_KEY = 'hc_order_counter';

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, quantity = 1) {
  if (typeof isCustomerLoggedIn === 'function' && !isCustomerLoggedIn()) {
    if (typeof showAccountRequiredModal === 'function') {
      showAccountRequiredModal();
    } else {
      showToast('Please create an account first to add items to cart.');
    }
    return false;
  }

  const product = getProductById(productId);
  if (!product || !product.inStock) return false;

  const cart = getCart();
  const existing = cart.find(item => item.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
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
  localStorage.removeItem(CART_KEY);
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

function generateOrderId() {
  const counter = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(ORDER_COUNTER_KEY, String(counter));
  return 'ORD-' + String(counter).padStart(6, '0');
}

function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function createOrder(userEmail, addressDetails) {
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

  const order = {
    id: generateOrderId(),
    userEmail,
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    addressDetails,
    shippingAddress: addressDetails.formatted,
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
  localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
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
