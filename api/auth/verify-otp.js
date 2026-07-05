const { sendJson, readJson, methodNotAllowed } = require('../../lib/http');
const { loadStore, saveStore, normalizeEmail, findUser, safeUser } = require('../../lib/store');

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

  const email = normalizeEmail(payload.email);
  const otp = (payload.otp || '').trim();

  if (!email || !otp) {
    sendJson(res, { success: false, message: 'Email and OTP are required.' }, 400);
    return;
  }

  const store = await loadStore();
  const pending = store.pending_otps ? store.pending_otps[email] : null;

  if (!pending) {
    sendJson(res, { success: false, message: 'No registration request found or OTP expired.' }, 400);
    return;
  }
  if (pending.otp !== otp) {
    sendJson(res, { success: false, message: 'Invalid verification code.' }, 400);
    return;
  }
  if (Date.now() > pending.expiresAt) {
    delete store.pending_otps[email];
    await saveStore(store);
    sendJson(res, { success: false, message: 'Verification code has expired.' }, 400);
    return;
  }

  // Create User
  const users = store.users || [];
  if (findUser(users, email)) {
    sendJson(res, { success: false, message: 'An account with this email already exists.' }, 409);
    return;
  }

  const user = {
    id: 'user_' + Date.now(),
    name: pending.name,
    email,
    password: pending.password,
    addresses: [],
    loginCount: 1,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  store.users = users;

  // Clear pending OTP
  delete store.pending_otps[email];

  const saved = await saveStore(store);
  if (!saved && process.env.VERCEL) {
    sendJson(res, { success: false, message: 'Failed to write data on server.' }, 503);
    return;
  }

  sendJson(res, { success: true, user: safeUser(user) });
};
