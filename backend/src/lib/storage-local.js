import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ASSET_BASE_URL, UPLOAD_BASE_URL, UPLOAD_DIR } from './config.js';

function filePath(key) {
  const full = path.resolve(UPLOAD_DIR, key);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) throw new Error(`invalid key: ${key}`);
  return full;
}

export async function createUploadUrl(key) {
  return `${UPLOAD_BASE_URL}/${key}`;
}

export const publicUrl = (key) => (key ? `${ASSET_BASE_URL}/${key}` : null);

export const thumbKeyFor = (key) => key.replace(/^uploads\//, 'thumbs/').replace(/\.[^.]+$/, '.webp');

export const readObject = (key) => readFile(filePath(key));

export async function writeObject(key, body) {
  const full = filePath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
}
