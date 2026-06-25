const fs = require('fs');
const path = require('path');

const USERS_TXT_FILE = path.join(process.cwd(), 'data', 'users.txt');
const BLOB_STORE_PATH = 'hc-store.json';
const BLOB_USERS_PATH = 'hc-users.txt';
const ADMIN_EMAIL = 'admin@gmail.com';
const STORE_KEY = 'hc:site-store';
const STORE_TXT_KEY = 'hc:users-txt';
const GITHUB_OWNER = () => process.env.GITHUB_REPO_OWNER || 'amir034';
const GITHUB_REPO = () => process.env.GITHUB_REPO_NAME || 'waseem-HN-HANDICRAFT-';
const GITHUB_BRANCH = () => process.env.GITHUB_BRANCH || 'main';

function hasBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function blobClientOptions() {
  const options = {
    token: process.env.BLOB_READ_WRITE_TOKEN
  };
  if (process.env.BLOB_STORE_ID) {
    options.storeId = process.env.BLOB_STORE_ID;
  }
  return options;
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

function mergeUserLists(...lists) {
  const byEmail = new Map();
  lists.flat().forEach((user) => {
    if (!user || !user.email) return;
    const key = normalizeEmail(user.email);
    if (!key || key === ADMIN_EMAIL) return;
    const existing = byEmail.get(key);
    byEmail.set(key, {
      ...(existing || {}),
      ...user,
      email: key,
      password: user.password || existing?.password,
      name: user.name || existing?.name
    });
  });
  return Array.from(byEmail.values());
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

async function getBlobText(pathname) {
  if (!hasBlob()) return null;
  try {
    const { get } = require('@vercel/blob');
    const result = await get(pathname, {
      ...blobClientOptions(),
      access: 'private',
      useCache: false
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return readStreamText(result.stream);
  } catch {
    return null;
  }
}

async function loadFromBlob() {
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
    /* try next source */
  }
  return null;
}

async function loadFromGitHubRaw() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER()}/${GITHUB_REPO()}/${GITHUB_BRANCH()}/data/users.txt`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const users = parseUsersTxt(await res.text());
    if (users.length) return { users };
  } catch {
    /* try next source */
  }
  return null;
}

async function saveToBlob(data) {
  if (!hasBlob()) return false;
  try {
    const { put } = require('@vercel/blob');
    const baseOptions = {
      ...blobClientOptions(),
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true
    };
    const txt = formatUsersTxt(data.users || []);
    const json = JSON.stringify(data, null, 2);
    await put(BLOB_USERS_PATH, txt, {
      ...baseOptions,
      contentType: 'text/plain; charset=utf-8'
    });
    await put(BLOB_STORE_PATH, json, {
      ...baseOptions,
      contentType: 'application/json; charset=utf-8'
    });
    return true;
  } catch (error) {
    console.error('saveToBlob failed:', error.message);
    return false;
  }
}

async function loadStore() {
  if (hasBlob()) {
    const blobData = await loadFromBlob();
    if (blobData?.users?.length) {
      return blobData;
    }
  }

  const redis = getRedis();
  if (redis) {
    const data = await redis.get(STORE_KEY);
    if (data?.users?.length) return data;
  }

  const sources = [];
  const githubData = await loadFromGitHubRaw();
  if (githubData?.users?.length) sources.push(githubData.users);
  sources.push(readFileStore().users);

  return { users: mergeUserLists(...sources) };
}

async function saveStore(data) {
  let saved = false;

  if (hasBlob()) {
    saved = await saveToBlob(data);
  }

  const redis = getRedis();
  if (redis) {
    await redis.set(STORE_KEY, data);
    await redis.set(STORE_TXT_KEY, formatUsersTxt(data.users || []));
    saved = true;
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
  if (hasBlob()) return 'blob';
  if (hasRedis()) return 'redis';
  if (!process.env.VERCEL) return 'local';
  return 'github-readonly';
}

function canPersist() {
  return hasBlob() || hasRedis() || !process.env.VERCEL;
}

async function getStorageStatus() {
  const status = {
    blobConfigured: hasBlob(),
    storeIdSet: !!process.env.BLOB_STORE_ID,
    persist: canPersist(),
    storage: getStorageMode(),
    userCount: 0,
    blobUserCount: 0
  };

  try {
    const store = await loadStore();
    status.userCount = store.users?.length || 0;
  } catch {
    /* ignore */
  }

  if (hasBlob()) {
    try {
      const blobData = await loadFromBlob();
      status.blobUserCount = blobData?.users?.length || 0;
    } catch {
      /* ignore */
    }
  }

  return status;
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
  getStorageMode,
  getStorageStatus
};
