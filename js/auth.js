const AUTH_KEY = 'hc_users';
const SESSION_KEY = 'hc_session';
const ADMIN_SESSION_KEY = 'hc_admin_session';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123321';

function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
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
  return getUsers().find(u => u.email === email) || null;
}

function isLoggedIn() {
  return isAdmin() || !!localStorage.getItem(SESSION_KEY);
}

function recordUserLogin(email) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user) {
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
  }
}

function signup(name, email, password) {
  if (isAdminEmail(email)) {
    return { success: false, message: 'This email is reserved for admin use.' };
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
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
  return { success: true };
}

function login(email, password) {
  email = email.trim().toLowerCase();
  if (isAdminEmail(email)) {
    if (password === ADMIN_PASSWORD) {
      const users = getUsers().filter(u => u.email.toLowerCase() !== ADMIN_EMAIL);
      saveUsers(users);
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      localStorage.removeItem(SESSION_KEY);
      return { success: true, user: { name: 'Admin', email: ADMIN_EMAIL, role: 'admin' }, isAdmin: true };
    }
    return { success: false, message: 'Invalid admin password.' };
  }
  const user = getUsers().find(u => u.email.toLowerCase() === email && u.password === password);
  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }
  localStorage.setItem(SESSION_KEY, email);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  recordUserLogin(email);
  return { success: true, user, isAdmin: false };
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
