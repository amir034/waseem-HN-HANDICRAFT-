const fs = require('fs');
const path = require('path');

const SITE_CONTENT_PATH = 'hc-site-content.json';
const LOCAL_CONTENT_FILE = path.join(process.cwd(), 'data', 'site-content.json');

function hasBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function blobClientOptions() {
  const options = { token: process.env.BLOB_READ_WRITE_TOKEN };
  if (process.env.BLOB_STORE_ID) options.storeId = process.env.BLOB_STORE_ID;
  return options;
}

async function readStreamText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function loadFromBlob() {
  if (!hasBlob()) return null;
  try {
    const { get } = require('@vercel/blob');
    const result = await get(SITE_CONTENT_PATH, {
      ...blobClientOptions(),
      access: 'private',
      useCache: false
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return JSON.parse(await readStreamText(result.stream));
  } catch {
    return null;
  }
}

function loadFromFile() {
  if (!fs.existsSync(LOCAL_CONTENT_FILE)) return { content: {} };
  return JSON.parse(fs.readFileSync(LOCAL_CONTENT_FILE, 'utf8'));
}

async function loadSiteContent() {
  const blobData = await loadFromBlob();
  if (blobData?.content) return blobData;
  if (!process.env.VERCEL) return loadFromFile();
  return { content: {} };
}

async function saveToBlob(data) {
  if (!hasBlob()) return false;
  try {
    const { put } = require('@vercel/blob');
    await put(SITE_CONTENT_PATH, JSON.stringify(data, null, 2), {
      ...blobClientOptions(),
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8'
    });
    return true;
  } catch (error) {
    console.error('saveSiteContent blob failed:', error.message);
    return false;
  }
}

function saveToFile(data) {
  fs.mkdirSync(path.dirname(LOCAL_CONTENT_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
  return true;
}

async function saveSiteContent(data) {
  let saved = false;
  if (hasBlob()) saved = await saveToBlob(data);
  if (!process.env.VERCEL) saveToFile(data);
  else if (!saved && hasBlob()) throw new Error('Could not save site content.');
  return true;
}

module.exports = {
  loadSiteContent,
  saveSiteContent
};
