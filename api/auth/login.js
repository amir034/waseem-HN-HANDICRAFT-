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
  const password = payload.password || '';
  if (!email || !password) {
    sendJson(res, { success: false, message: 'Email and password are required.' }, 400);
    return;
  }

  const store = await loadStore();
  const user = findUser(store.users || [], email);
  if (!user || user.password !== password) {
    sendJson(res, { success: false, message: 'Invalid email or password.' }, 401);
    return;
  }

  user.loginCount = Number(user.loginCount || 0) + 1;
  user.lastLogin = new Date().toISOString();
  await saveStore(store);

  sendJson(res, { success: true, user: safeUser(user) });
};
