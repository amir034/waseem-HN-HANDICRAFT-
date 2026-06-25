const { sendJson, readJson, methodNotAllowed } = require('../../lib/http');
const { ADMIN_EMAIL, loadStore, saveStore, normalizeEmail, findUser } = require('../../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') {
    methodNotAllowed(res, ['PUT']);
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
  if (!email || email === ADMIN_EMAIL) {
    sendJson(res, { success: false, message: 'Invalid user.' }, 400);
    return;
  }

  const store = await loadStore();
  const users = store.users || [];
  const user = findUser(users, email);
  if (!user) {
    sendJson(res, { success: false, message: 'User not found.' }, 404);
    return;
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'email' && key !== 'id') user[key] = value;
  });
  user.email = email;

  const saved = await saveStore(store);
  if (!saved) {
    sendJson(res, { success: false, message: 'Could not save changes. Connect Vercel Blob storage and redeploy.' }, 503);
    return;
  }

  sendJson(res, { success: true, user });
};
