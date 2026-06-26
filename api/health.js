const { sendJson, methodNotAllowed } = require('../lib/http');
const { getStorageStatus } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }
  const status = await getStorageStatus();
  sendJson(res, { ok: true, siteSync: true, ...status });
};
