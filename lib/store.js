const fs = require('fs');
const path = require('path');

const USERS_TXT_FILE = path.join(process.cwd(), 'data', 'users.txt');
const BLOB_STORE_PATH = 'hc-store.json';
const BLOB_USERS_PATH = 'hc-users.txt';
const ADMIN_EMAIL = 'admin@gmail.com';
const STORE_KEY = 'hc:site-store';
const STORE_TXT_KEY = 'hc:users-txt';

function hasBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

function hasRedis() {
  return !!getRedisConfig();
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function parseUsersTxt(raw) {
  const users = [];
  String(raw || '')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('|');
      if (parts.length < 3) return;
      const email = normalizeEmail(parts[0]);
      const password = parts[1].trim();
      const name = parts.slice(2).join('|').trim();
      if (!email || !password || !name) return;
      users.push({
        id: 'user_' + email.replace(/[^a-z0-9]/g, '_'),
        name,
        email,
        password,
        addresses: [],
        loginCount: 0,
        createdAt: new Date().toISOString()
      });
    });
  return users;
}

function formatUsersTxt(users) {
  const lines = [
    '# HN Handicraft login accounts (auto-updated on sign up)',
    '# Format: email|password|full name',
    ''
  ];
  users
    .filter((user) => normalizeEmail(user.email) !== ADMIN_EMAIL)
    .forEach((user) => {
      lines.push(`${normalizeEmail(user.email)}|${user.password}|${user.name}`);
    });
  return lines.join('\n') + '\n';
}

function readFileStore() {
  if (!fs.existsSync(USERS_TXT_FILE)) return { users: [] };
  return { users: parseUsersTxt(fs.readFileSync(USERS_TXT_FILE, 'utf8')) };
}

function writeFileStore(data) {
  fs.mkdirSync(path.dirname(USERS_TXT_FILE), { recursive: true });
  fs.writeFileSync(USERS_TXT_FILE, formatUsersTxt(data.users || []), 'utf8');
}

let redisClient = null;

function getRedis() {
  if (!hasRedis()) return null;
  if (!redisClient) {
    const config = getRedisConfig();
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({ url: config.url, token: config.token });
  }
  return redisClient;
}

async function getBlobText(pathname) {
  const { list, get } = require('@vercel/blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { blobs } = await list({ prefix: pathname, token });
  const blob = blobs.find((entry) => entry.pathname === pathname);
  if (!blob) return null;
  const response = await get(blob.url, { token });
  return response.text();
}

async function loadFromBlob() {
  if (!hasBlob()) return null;
  try {
    const jsonText = await getBlobText(BLOB_STORE_PATH);
    if (jsonText) {
      const data = JSON.parse(jsonText);
      if (data.users && data.users.length) return data;
    }
    const txt = await getBlobText(BLOB_USERS_PATH);
    if (txt) {
      return { users: parseUsersTxt(txt) };
    }
  } catch {
    /* fall back to local seed data */
  }
  return null;
}

async function saveToBlob(data) {
  if (!hasBlob()) return false;
  const { put } = require('@vercel/blob');
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const txt = formatUsersTxt(data.users || []);
  const json = JSON.stringify(data, null, 2);
  await put(BLOB_USERS_PATH, txt, {
    access: 'public',
    token,
    addRandomSuffix: false,
    contentType: 'text/plain; charset=utf-8'
  });
  await put(BLOB_STORE_PATH, json, {
    access: 'public',
    token,
    addRandomSuffix: false,
    contentType: 'application/json; charset=utf-8'
  });
  return true;
}

async function loadStore() {
  const redis = getRedis();
  if (redis) {
    let data = await redis.get(STORE_KEY);
    if (data && data.users) return data;
    data = readFileStore();
    if (data.users && data.users.length) {
      await saveStore(data);
    }
    return data || { users: [] };
  }

  const blobData = await loadFromBlob();
  if (blobData && blobData.users && blobData.users.length) {
    return blobData;
  }

  return readFileStore();
}

async function saveStore(data) {
  let saved = false;

  const redis = getRedis();
  if (redis) {
    await redis.set(STORE_KEY, data);
    await redis.set(STORE_TXT_KEY, formatUsersTxt(data.users || []));
    saved = true;
  }

  if (hasBlob()) {
    saved = (await saveToBlob(data)) || saved;
  }

  if (!process.env.VERCEL) {
    writeFileStore(data);
    saved = true;
  }

  return saved;
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

function formatUserTxtLine(user) {
  return `${normalizeEmail(user.email)}|${user.password}|${user.name}`;
}

function getStorageMode() {
  if (hasRedis()) return 'redis';
  if (hasBlob()) return 'blob';
  if (!process.env.VERCEL) return 'local';
  return 'none';
}

function canPersist() {
  return hasRedis() || hasBlob() || !process.env.VERCEL;
}

module.exports = {
  ADMIN_EMAIL,
  loadStore,
  saveStore,
  normalizeEmail,
  findUser,
  safeUser,
  formatUserTxtLine,
  canPersist,
  getStorageMode
};
