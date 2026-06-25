const AUTH_KEY = 'hc_users';
const SESSION_KEY = 'hc_session';
const ADMIN_SESSION_KEY = 'hc_admin_session';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123321';
const API_TIMEOUT_MS = 4000;
const SERVER_TIP = 'Open this site from your Vercel URL or run a local web server — login does not work when opening HTML files directly';

let authSyncReady = null;

function startAuthSync() {
  if (!authSyncReady) authSyncReady = initAuthSync();
  return authSyncReady;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
  if (window.HC_API_ENABLED) {
    syncUsersToServer(users);
  }
}

function saveUserRecord(user) {
  const users = getUsers();
  const email = normalizeEmail(user.email);
  let idx = users.findIndex(u => normalizeEmail(u.email) === email);
  const record = { ...(idx >= 0 ? users[idx] : {}), ...user, email };
  if (idx >= 0) users[idx] = record;
  else {
    users.push(record);
    idx = users.length - 1;
  }
  saveUsers(users);
  if (window.HC_API_ENABLED) {
    syncUserToServer(users[idx]);
  }
  return record;
}

async function syncUsersToServer(users) {
  try {
    const res = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function syncUserToServer(user) {
  if (!user || !user.email) return false;
  try {
    const res = await fetch('/api/users/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function isApiAvailable() {
  if (isFileProtocol()) return false;
  if (window.HC_API_ENABLED) return true;
  try {
    const res = await fetchWithTimeout('/api/health', { method: 'GET' });
    if (res.ok) {
      window.HC_API_ENABLED = true;
      return true;
    }
  } catch {
    /* no shared server */
  }
  return false;
}

function mergeUsersFromServer(serverUsers) {
  const local = getUsers();
  const byEmail = new Map();
  local.forEach(u => byEmail.set(normalizeEmail(u.email), u));
  serverUsers.forEach(u => {
    const key = normalizeEmail(u.email);
    if (!key) return;
    const existing = byEmail.get(key);
    if (existing) {
      byEmail.set(key, {
        ...existing,
        ...u,
        password: u.password || existing.password,
        addresses: (u.addresses && u.addresses.length) ? u.addresses : (existing.addresses || [])
      });
    } else {
      byEmail.set(key, u);
    }
  });
  localStorage.setItem(AUTH_KEY, JSON.stringify(Array.from(byEmail.values())));
}

async function initAuthSync() {
  if (isFileProtocol()) {
    window.HC_API_ENABLED = false;
    return;
  }
  try {
    const res = await fetchWithTimeout('/api/health');
    if (!res.ok) return;
    window.HC_API_ENABLED = true;

    const usersRes = await fetchWithTimeout('/api/users');
    if (!usersRes.ok) return;

    const data = await usersRes.json();
    const serverUsers = data.users || [];
    const localUsers = getUsers();

    if (serverUsers.length === 0 && localUsers.length > 0) {
      await syncUsersToServer(localUsers);
      return;
    }

    if (serverUsers.length > 0) {
      mergeUsersFromServer(serverUsers);
    }
  } catch {
    window.HC_API_ENABLED = false;
  }
}

function upsertLocalUser(user, password) {
  const users = getUsers();
  const email = normalizeEmail(user.email);
  const idx = users.findIndex(u => normalizeEmail(u.email) === email);
  const record = {
    ...(idx >= 0 ? users[idx] : {}),
    ...user,
    email,
    password: password || (idx >= 0 ? users[idx].password : user.password)
  };
  if (idx >= 0) users[idx] = record;
  else users.push(record);
  saveUsers(users);
  return record;
}

function isAdminEmail(email) {
  return email.toLowerCase() === ADMIN_EMAIL;
}

function isAdmin() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function getCurrentUser() {
  if (isAdmin()) return { name: 'Admin', email: ADMIN_EMAIL, role: 'admin' };
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return getUsers().find(u => normalizeEmail(u.email) === normalizeEmail(email)) || null;
}

function isLoggedIn() {
  return isAdmin() || !!localStorage.getItem(SESSION_KEY);
}

function recordUserLogin(email) {
  const users = getUsers();
  const user = users.find(u => normalizeEmail(u.email) === normalizeEmail(email));
  if (user) {
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
  }
}

function signupLocal(name, email, password) {
  email = normalizeEmail(email);
  if (isAdminEmail(email)) {
    return { success: false, message: 'This email is reserved for admin use.' };
  }
  const users = getUsers();
  if (users.find(u => normalizeEmail(u.email) === email)) {
    return { success: false, message: 'An account with this email already exists.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  users.push({
    id: 'user_' + Date.now(),
    name,
    email,
    password,
    addresses: [],
    loginCount: 1,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, email);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  if (typeof migrateLegacyCart === 'function') migrateLegacyCart(email);
  if (typeof updateCartCount === 'function') updateCartCount();
  return { success: true };
}

async function signup(name, email, password) {
  await startAuthSync();
  email = normalizeEmail(email);

  if (isAdminEmail(email)) {
    return { success: false, message: 'This email is reserved for admin use.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  if (!name.trim()) {
    return { success: false, message: 'Please enter your full name.' };
  }

  if (await isApiAvailable()) {
    try {
      const res = await fetchWithTimeout('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        upsertLocalUser({ ...data.user, password }, password);
        localStorage.setItem(SESSION_KEY, email);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        if (typeof migrateLegacyCart === 'function') migrateLegacyCart(email);
        if (typeof updateCartCount === 'function') updateCartCount();
        return { success: true };
      }
      if (data.message) {
        return { success: false, message: data.message };
      }
    } catch {
      /* fall back to local signup */
    }
  }

  const local = signupLocal(name, email, password);
  if (local.success && await isApiAvailable()) {
    syncUserToServer(getUsers().find(u => normalizeEmail(u.email) === email));
  }
  return local;
}

function loginLocal(email, password) {
  email = normalizeEmail(email);
  const user = getUsers().find(u => normalizeEmail(u.email) === email && u.password === password);
  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }
  localStorage.setItem(SESSION_KEY, email);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  recordUserLogin(email);
  if (typeof migrateLegacyCart === 'function') migrateLegacyCart(email);
  if (typeof updateCartCount === 'function') updateCartCount();
  return { success: true, user, isAdmin: false };
}

async function login(email, password) {
  await startAuthSync();
  email = normalizeEmail(email);

  if (isAdminEmail(email)) {
    if (password === ADMIN_PASSWORD) {
      const users = getUsers().filter(u => normalizeEmail(u.email) !== ADMIN_EMAIL);
      saveUsers(users);
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      localStorage.removeItem(SESSION_KEY);
      return { success: true, user: { name: 'Admin', email: ADMIN_EMAIL, role: 'admin' }, isAdmin: true };
    }
    return { success: false, message: 'Invalid admin password.' };
  }

  if (await isApiAvailable()) {
    try {
      const res = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const user = upsertLocalUser({ ...data.user, password }, password);
        localStorage.setItem(SESSION_KEY, email);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        recordUserLogin(email);
        if (typeof migrateLegacyCart === 'function') migrateLegacyCart(email);
        if (typeof updateCartCount === 'function') updateCartCount();
        return { success: true, user, isAdmin: false };
      }
      if (data.message) {
        return { success: false, message: data.message };
      }
    } catch {
      /* fall back to local login */
    }
  }

  const local = loginLocal(email, password);
  if (!local.success && isFileProtocol()) {
    return {
      success: false,
      message: local.message + '. ' + SERVER_TIP + '.'
    };
  }
  return local;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.href = 'index.html';
}

function requireAuth(redirectTo) {
  if (!isLoggedIn() || isAdmin()) {
    if (isAdmin()) window.location.href = 'admin.html';
    else window.location.href = redirectTo || 'login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isAdmin()) {
    window.location.replace('login.html?redirect=admin.html');
    return false;
  }
  return true;
}

function getUserStats() {
  return getUsers().map(u => ({
    ...u,
    password: undefined,
    orderCount: getUserOrders(u.email).length
  }));
}

function updateAuthUI() {
  const admin = isAdmin();
  const sessionEmail = localStorage.getItem(SESSION_KEY);
  const loggedInUser = !!sessionEmail && !admin;
  const user = getCurrentUser();

  document.querySelectorAll('[data-auth="guest"]').forEach(el => {
    el.style.display = (loggedInUser || admin) ? 'none' : '';
  });
  document.querySelectorAll('[data-auth="user"]').forEach(el => {
    el.style.display = loggedInUser ? (el.classList.contains('nav-icon') || el.tagName === 'BUTTON' ? 'flex' : '') : 'none';
  });
  document.querySelectorAll('[data-auth="admin"]').forEach(el => {
    el.style.display = admin ? 'flex' : 'none';
  });
  document.querySelectorAll('[data-user-name]').forEach(el => {
    if (user && !admin) el.textContent = user.name.split(' ')[0];
  });
}

function redirectAfterLogin(isAdminLogin, user) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (isAdminLogin) {
    window.location.replace('admin.html');
  } else if (redirect) {
    window.location.replace(redirect);
  } else {
    if (user?.name) setWelcomeMessage(user.name);
    window.location.replace('index.html');
  }
}

function setWelcomeMessage(name) {
  if (name) sessionStorage.setItem('hc_show_welcome', name);
}

function consumeWelcomeMessage() {
  const name = sessionStorage.getItem('hc_show_welcome');
  if (!name) return null;
  sessionStorage.removeItem('hc_show_welcome');
  return name;
}

function initWelcomeMessage() {
  const name = consumeWelcomeMessage();
  if (!name) return;

  const banner = document.getElementById('welcome-banner');
  const firstName = name.split(' ')[0];

  if (banner) {
    banner.innerHTML = `
      <div class="welcome-banner-inner">
        <p>Welcome back, <strong>${firstName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>! We're glad you're here.</p>
        <button type="button" class="welcome-banner-close" aria-label="Dismiss">&times;</button>
      </div>
    `;
    banner.hidden = false;
    banner.querySelector('.welcome-banner-close')?.addEventListener('click', () => {
      banner.hidden = true;
    });
  }

  if (typeof showToast === 'function') {
    showToast('Welcome, ' + firstName + '!');
  }
}

function getUserAddresses(email) {
  const users = getUsers();
  const user = users.find(u => u.email === (email || localStorage.getItem(SESSION_KEY)));
  if (!user) return [];
  if (!user.addresses) {
    user.addresses = [];
    saveUsers(users);
  }
  return user.addresses;
}

function saveUserAddress(email, addressData) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return null;

  if (!user.addresses) user.addresses = [];

  const payload = {
    id: addressData.id || 'addr_' + Date.now(),
    fullName: addressData.fullName,
    phone: addressData.phone,
    apartment: addressData.apartment,
    lane: addressData.lane,
    landmark: addressData.landmark || '',
    city: addressData.city,
    state: addressData.state,
    pincode: addressData.pincode,
    area: addressData.area || '',
    isDefault: addressData.isDefault || user.addresses.length === 0,
    createdAt: addressData.createdAt || new Date().toISOString()
  };

  const existingIdx = user.addresses.findIndex(a => a.id === payload.id);
  if (payload.isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }
  if (existingIdx >= 0) {
    user.addresses[existingIdx] = { ...user.addresses[existingIdx], ...payload };
  } else {
    const duplicate = user.addresses.find(a =>
      a.pincode === payload.pincode &&
      a.apartment === payload.apartment &&
      a.lane === payload.lane
    );
    if (duplicate) {
      Object.assign(duplicate, payload, { id: duplicate.id });
    } else {
      user.addresses.push(payload);
    }
  }

  saveUsers(users);
  return payload;
}

function deleteUserAddress(email, addressId) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user || !user.addresses) return false;

  user.addresses = user.addresses.filter(a => a.id !== addressId);
  if (user.addresses.length && !user.addresses.some(a => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  saveUsers(users);
  return true;
}

function getDefaultUserAddress(email) {
  const addresses = getUserAddresses(email);
  return addresses.find(a => a.isDefault) || addresses[0] || null;
}

function formatSavedAddress(addr) {
  if (!addr) return '';
  const parts = [
    addr.fullName,
    addr.apartment,
    addr.lane,
    addr.landmark,
    addr.area,
    `${addr.city}, ${addr.state} — ${addr.pincode}`,
    addr.phone ? 'Phone: ' + addr.phone : ''
  ].filter(Boolean);
  return parts.join(', ');
}

function addUserNotification(email, data) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return null;
  if (!user.notifications) user.notifications = [];
  const note = {
    id: 'note_' + Date.now(),
    type: data.type || 'info',
    message: data.message,
    orderId: data.orderId || null,
    productId: data.productId || null,
    read: false,
    createdAt: new Date().toISOString()
  };
  user.notifications.unshift(note);
  saveUsers(users);
  return note;
}

function getUserNotifications(email) {
  const user = getUsers().find(u => u.email === email);
  return user?.notifications || [];
}

function markNotificationRead(email, noteId) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user || !user.notifications) return;
  const note = user.notifications.find(n => n.id === noteId);
  if (note) note.read = true;
  saveUsers(users);
}

function isCustomerLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY);
}

function ensureAccountRequiredModal() {
  if (document.getElementById('account-required-modal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'account-required-modal';
  overlay.className = 'account-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="account-modal-card" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
      <button type="button" class="account-modal-close" aria-label="Close">&times;</button>
      <span class="account-modal-badge">Account Required</span>
      <h2 id="account-modal-title">Create an account first</h2>
      <p>Please sign up or log in to add items to your cart and place orders.</p>
      <div class="account-modal-actions">
        <a href="signup.html" class="btn btn-primary">Create Account</a>
        <a href="login.html" class="btn btn-outline-accent">Login</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.account-modal-close').addEventListener('click', () => hideAccountRequiredModal());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideAccountRequiredModal();
  });
}

function showAccountRequiredModal() {
  ensureAccountRequiredModal();
  const overlay = document.getElementById('account-required-modal');
  if (!overlay) return;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function hideAccountRequiredModal() {
  const overlay = document.getElementById('account-required-modal');
  if (!overlay) return;
  overlay.hidden = true;
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  startAuthSync();
});
