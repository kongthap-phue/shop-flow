import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, UPLOAD_DIR } from '../src/lib/config.js';
import { writeObject } from '../src/lib/storage.js';
import { handler as makeThumbnail } from '../src/events/onImageUploaded.js';
import { ensureUser } from './auth-local.js';

const SEED_IMAGES = path.resolve(import.meta.dirname, 'seed-images');

const PRODUCTS = [
  ['tshirt', 'เสื้อยืด Cotton 100% สีขาว', 'เสื้อผ้า', 290, 40, 'ผ้านุ่ม ระบายอากาศดี ใส่ได้ทุกวัน มีไซซ์ S–XL'],
  ['hoodie', 'เสื้อฮู้ดผ้าฟลีซ', 'เสื้อผ้า', 790, 12, 'ผ้าด้านในบุฟลีซ อุ่นสบาย เหมาะกับห้องแอร์และหน้าหนาว'],
  ['shorts', 'กางเกงขาสั้นผ้าร่ม', 'เสื้อผ้า', 350, 3, 'ผ้าแห้งเร็ว มีกระเป๋าซิป ใส่ออกกำลังกายได้'],
  ['earbuds', 'หูฟังไร้สาย Bluetooth 5.3', 'อุปกรณ์ไอที', 1290, 15, 'แบตใช้ได้ 30 ชั่วโมงรวมเคส ตัดเสียงรบกวนขณะคุยสาย'],
  ['mouse', 'เมาส์ไร้สายแบบเงียบ', 'อุปกรณ์ไอที', 450, 30, 'คลิกเงียบ ไม่รบกวนคนข้าง ๆ ใช้ถ่าน AA ก้อนเดียวได้นานหลายเดือน'],
  ['usb-cable', 'สาย USB-C ถัก 1 เมตร', 'อุปกรณ์ไอที', 159, 4, 'รองรับชาร์จเร็ว 60W และรับส่งข้อมูล'],
  ['tumbler', 'แก้วเก็บความเย็น 900 ml', 'ของใช้', 390, 25, 'เก็บความเย็นได้ 24 ชั่วโมง ฝาปิดสนิทไม่หก'],
  ['tote', 'กระเป๋าผ้าแคนวาส', 'ของใช้', 250, 0, 'ผ้าหนา ใส่โน้ตบุ๊ก 14 นิ้วได้ มีช่องซิปด้านใน'],
  ['notebook', 'สมุดโน้ตปกแข็ง A5', 'เครื่องเขียน', 120, 60, 'กระดาษ 100 แกรม 160 หน้า ไม่ซึมเมื่อใช้ปากกาเจล'],
  ['pens', 'ปากกาเจล 0.5 mm แพ็ก 5 ด้าม', 'เครื่องเขียน', 89, 80, 'หมึกน้ำเงิน เขียนลื่น แห้งเร็ว'],
];

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
