const { sendJson, readJson, methodNotAllowed } = require('../../lib/http');
const {
  ADMIN_EMAIL,
  loadStore,
  saveStore,
  normalizeEmail,
  findUser,
  safeUser
} = require('../../lib/store');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    sendJson(res, { success: false, message: 'Invalid JSON body.' }, 400);
    return;
  }

  const name = (payload.name || '').trim();
  const email = normalizeEmail(payload.email);
  const password = payload.password || '';

  if (!name || !email || !password) {
    sendJson(res, { success: false, message: 'All fields are required.' }, 400);
    return;
  }
  if (email === ADMIN_EMAIL) {
    sendJson(res, { success: false, message: 'This email is reserved for admin use.' }, 400);
    return;
  }
  if (password.length < 6) {
    sendJson(res, { success: false, message: 'Password must be at least 6 characters.' }, 400);
    return;
  }
  if (!EMAIL_RE.test(email)) {
    sendJson(res, { success: false, message: 'Please enter a valid email address.' }, 400);
    return;
  }

  const store = await loadStore();
  const users = store.users || [];
  if (findUser(users, email)) {
    sendJson(res, { success: false, message: 'An account with this email already exists.' }, 409);
    return;
  }

  const user = {
    id: 'user_' + Date.now(),
    name,
    email,
    password,
    addresses: [],
    loginCount: 1,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  store.users = users;

  const saved = await saveStore(store);
  if (!saved) {
    sendJson(
      res,
      {
        success: false,
        message:
          'Sign up could not be saved for all devices. In Vercel go to Storage → Blob, create a store, connect it to this project, then redeploy.'
      },
      503
    );
    return;
  }

  sendJson(res, { success: true, user: safeUser(user) });
};
