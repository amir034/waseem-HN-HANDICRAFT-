const { sendJson, methodNotAllowed } = require('../lib/http');
const { canPersist, getStorageMode } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }
  sendJson(res, {
    ok: true,
    persist: canPersist(),
    storage: getStorageMode()
  });
};
