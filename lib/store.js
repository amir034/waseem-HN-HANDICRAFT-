const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'site-store.json');
const ADMIN_EMAIL = 'admin@gmail.com';
const STORE_KEY = 'hc:site-store';

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

function hasRedis() {
  return !!getRedisConfig();
}

function readFileStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { users: [] };
  }
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

async function loadStore() {
  const redis = getRedis();
  if (redis) {
    let data = await redis.get(STORE_KEY);
    if (!data) {
      data = readFileStore();
      if (data.users && data.users.length) {
        await redis.set(STORE_KEY, data);
      }
    }
    return data || { users: [] };
  }
  return readFileStore();
}

async function saveStore(data) {
  const redis = getRedis();
  if (redis) {
    await redis.set(STORE_KEY, data);
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
  canPersist: () => hasRedis() || !process.env.VERCEL
};
