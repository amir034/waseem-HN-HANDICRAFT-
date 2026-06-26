const { sendJson, readJson, methodNotAllowed } = require('../lib/http');
const { loadSiteContent, saveSiteContent } = require('../lib/site-content');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const data = await loadSiteContent();
    sendJson(res, data);
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

    const content = payload.content;
    if (!content || typeof content !== 'object') {
      sendJson(res, { success: false, message: 'Invalid content payload.' }, 400);
      return;
    }

    try {
      await saveSiteContent({
        content,
        updatedAt: new Date().toISOString()
      });
      sendJson(res, { success: true });
    } catch (error) {
      sendJson(res, { success: false, message: error.message || 'Save failed.' }, 500);
    }
    return;
  }

  methodNotAllowed(res, ['GET', 'PUT']);
};
