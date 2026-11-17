import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from './config.js';

const LOG_FILE = path.join(DATA_DIR, 'notifications.json');
const KEEP = 100;

export async function listNotifications() {
  try {
    return JSON.parse(await readFile(LOG_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function publish(subject, message) {
  const entry = { id: randomUUID(), subject, message, sentAt: new Date().toISOString() };
  console.log(`\n[แจ้งเตือน] ${subject}\n${message}\n`);
  const list = [entry, ...(await listNotifications())].slice(0, KEEP);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LOG_FILE, JSON.stringify(list, null, 2));
  return entry;
}
