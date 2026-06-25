const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'site-store.json');
const ADMIN_EMAIL = 'admin@gmail.com';
const KV_KEY = 'hc:site-store';

function hasKv() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function readFileStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { users: [] };
  }
}

async function getKv() {
  if (!hasKv()) return null;
  const { kv } = require('@vercel/kv');
  return kv;
}

async function loadStore() {
  const kv = await getKv();
  if (kv) {
    let data = await kv.get(KV_KEY);
    if (!data) {
      data = readFileStore();
      if (data.users && data.users.length) {
        await kv.set(KV_KEY, data);
      }
    }
    return data || { users: [] };
  }
  return readFileStore();
}

async function saveStore(data) {
  const kv = await getKv();
  if (kv) {
    await kv.set(KV_KEY, data);
    return true;
  }
  if (!process.env.VERCEL) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  }
  return false;
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function findUser(users, email) {
  const normalized = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalized) || null;
}

function safeUser(user) {
  if (!user) return null;
  const copy = { ...user };
  delete copy.password;
  return copy;
}

module.exports = {
  ADMIN_EMAIL,
  loadStore,
  saveStore,
  normalizeEmail,
  findUser,
  safeUser,
  canPersist: () => hasKv() || !process.env.VERCEL
};
