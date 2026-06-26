const path = require('path');
const fs = require('fs');
const { sendJson, readJson, methodNotAllowed } = require('../lib/http');

const UPLOAD_DIR = path.join(process.cwd(), 'assets', 'uploads');

function hasBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function blobClientOptions() {
  const options = { token: process.env.BLOB_READ_WRITE_TOKEN };
  if (process.env.BLOB_STORE_ID) options.storeId = process.env.BLOB_STORE_ID;
  return options;
}

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return null;
  }
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg';
  return { buffer: Buffer.from(match[2], 'base64'), ext, mime };
}

async function saveToBlob(buffer, ext, mime) {
  const { put } = require('@vercel/blob');
  const filename = `uploads/img_${Date.now()}.${ext}`;
  const result = await put(filename, buffer, {
    ...blobClientOptions(),
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: mime
  });
  return result.url;
}

function saveToDisk(buffer, ext) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `img_${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/assets/uploads/${name}`;
}

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

  const parsed = parseDataUrl(payload.data);
  if (!parsed) {
    sendJson(res, { success: false, message: 'Invalid image data.' }, 400);
    return;
  }

  try {
    let url;
    if (hasBlob()) {
      url = await saveToBlob(parsed.buffer, parsed.ext, parsed.mime);
    } else if (!process.env.VERCEL) {
      url = saveToDisk(parsed.buffer, parsed.ext);
    } else {
      sendJson(res, { success: false, message: 'Image upload storage is not configured.' }, 503);
      return;
    }
    sendJson(res, { success: true, url });
  } catch (error) {
    sendJson(res, { success: false, message: error.message || 'Upload failed.' }, 500);
  }
};
