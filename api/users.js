const { sendJson, readJson, methodNotAllowed } = require('../lib/http');
const { ADMIN_EMAIL, loadStore, saveStore, normalizeEmail } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const store = await loadStore();
    const users = (store.users || []).map((user) => ({
      ...user,
      password: user.password || ''
    }));
    sendJson(res, { users });
    return;
  }

  if (req.method === 'PUT') {
    let payload;
    try {
      payload = await readJson(req);
    } catch {
      sendJson(res, { success: false, message: 'Invalid JSON body.' }, 400);
      return;
    }

    const incoming = payload.users;
    if (!Array.isArray(incoming)) {
      sendJson(res, { success: false, message: 'Invalid users payload.' }, 400);
      return;
    }

    const store = await loadStore();
    const merged = {};

    (store.users || []).forEach((user) => {
      const email = normalizeEmail(user.email);
      if (email && email !== ADMIN_EMAIL) merged[email] = user;
    });

    incoming.forEach((user) => {
      const email = normalizeEmail(user.email);
      if (!email || email === ADMIN_EMAIL) return;
      merged[email] = { ...(merged[email] || {}), ...user, email };
    });

    store.users = Object.values(merged);
    const saved = await saveStore(store);
    if (!saved) {
      sendJson(res, { success: false, message: 'Could not save profile changes. Update data/users.txt or connect Redis storage.' }, 503);
      return;
    }

    sendJson(res, { success: true, users: store.users });
    return;
  }

  methodNotAllowed(res, ['GET', 'PUT']);
};
