import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, UPLOAD_DIR } from '../src/lib/config.js';
import { writeObject } from '../src/lib/storage.js';
import { handler as makeThumbnail } from '../src/events/onImageUploaded.js';
import { ensureUser } from './auth-local.js';
import { SEED_PRODUCTS as PRODUCTS } from '../src/seed-data.js';

const SEED_IMAGES = path.resolve(import.meta.dirname, 'seed-images');

async function findPhoto(slug) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    try {
      return { body: await readFile(path.join(SEED_IMAGES, `${slug}.${ext}`)), ext: ext === 'jpeg' ? 'jpg' : ext };
    } catch {
    }
  }
  return null;
}

await rm(DATA_DIR, { recursive: true, force: true });
await rm(UPLOAD_DIR, { recursive: true, force: true });
await mkdir(DATA_DIR, { recursive: true });

const now = Date.now();
const products = {};
let withPhoto = 0;
for (const [i, [slug, name, category, price, stock, description]] of PRODUCTS.entries()) {
  const productId = randomUUID();
  const createdAt = new Date(now - i * 60_000).toISOString();
  let imageKey = null;
  const photo = await findPhoto(slug);
  if (photo) {
    imageKey = `uploads/${productId}.${photo.ext}`;
    await writeObject(imageKey, photo.body);
    await makeThumbnail({ Records: [{ s3: { object: { key: imageKey } } }] });
    withPhoto++;
  }
  products[productId] = { productId, name, category, price, stock, description, imageKey, createdAt, updatedAt: createdAt };
}
await writeFile(path.join(DATA_DIR, 'db.json'), JSON.stringify({ products, orders: {} }, null, 2));

await ensureUser({ email: 'admin@shop.local', password: 'admin1234', name: 'แอดมินร้าน', groups: ['admin'] });
await ensureUser({ email: 'customer@shop.local', password: 'customer1234', name: 'ลูกค้าทดลอง', groups: ['customer'] });

console.log(`ใส่สินค้าตัวอย่าง ${PRODUCTS.length} รายการแล้ว (มีรูป ${withPhoto} รายการ)`);
console.log('บัญชีแอดมิน:  admin@shop.local / admin1234');
console.log('บัญชีลูกค้า:  customer@shop.local / customer1234');
