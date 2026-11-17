import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from '../src/lib/config.js';
import { HttpError } from '../src/lib/http.js';

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET = process.env.LOCAL_AUTH_SECRET || 'it332-local-dev-secret';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function loadUsers() {
  try {
    return JSON.parse(await readFile(USERS_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function saveUsers(users) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

const hash = (password, salt) => scryptSync(password, salt, 32).toString('hex');
const sign = (data) => createHmac('sha256', SECRET).update(data).digest('base64url');
const publicUser = (u) => ({ id: u.sub, email: u.email, name: u.name, groups: u.groups });

function issueToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.sub,
      email: user.email,
      name: user.name,
      'cognito:groups': user.groups.join(','),
      exp: Date.now() + TOKEN_TTL_MS,
    }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  const [payload, signature] = String(token ?? '').split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return claims.exp > Date.now() ? claims : null;
}

export async function ensureUser({ email, password, name, groups }) {
  const users = await loadUsers();
  const key = email.toLowerCase();
  const salt = randomBytes(16).toString('hex');
  users[key] = { sub: users[key]?.sub ?? randomUUID(), email: key, name, groups, salt, passwordHash: hash(password, salt) };
  await saveUsers(users);
  return users[key];
}

export async function register({ email, password, name }) {
  email = String(email ?? '').trim().toLowerCase();
  name = String(name ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'อีเมลไม่ถูกต้อง');
  if (String(password ?? '').length < 8) throw new HttpError(400, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร');
  if (!name) throw new HttpError(400, 'กรุณาใส่ชื่อ');
  if ((await loadUsers())[email]) throw new HttpError(409, 'อีเมลนี้สมัครไว้แล้ว');
  const user = await ensureUser({ email, password, name, groups: ['customer'] });
  return { token: issueToken(user), user: publicUser(user) };
}

export async function login({ email, password }) {
  const user = (await loadUsers())[String(email ?? '').trim().toLowerCase()];
  if (!user || hash(String(password ?? ''), user.salt) !== user.passwordHash) {
    throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
  return { token: issueToken(user), user: publicUser(user) };
}
