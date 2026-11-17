import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { listProducts, putProduct } from './lib/db.js';
import { writeObject } from './lib/storage.js';
import { SEED_PRODUCTS } from './seed-data.js';

const SEED_IMAGES = path.resolve(import.meta.dirname, '../local/seed-images');

export const handler = async () => {
  if ((await listProducts()).length) return { created: 0, message: 'Products table is not empty, nothing to seed' };

  const now = Date.now();
  for (const [i, [slug, name, category, price, stock, description]] of SEED_PRODUCTS.entries()) {
    const productId = randomUUID();
    const createdAt = new Date(now - i * 60_000).toISOString();
    const imageKey = `uploads/${productId}.jpg`;
    await writeObject(imageKey, await readFile(path.join(SEED_IMAGES, `${slug}.jpg`)), 'image/jpeg');
    await putProduct({ productId, name, category, price, stock, description, imageKey, createdAt, updatedAt: createdAt });
  }
  return { created: SEED_PRODUCTS.length };
};
