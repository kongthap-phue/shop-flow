import { randomUUID } from 'node:crypto';
import * as db from '../lib/db.js';
import { HttpError, json, parseBody, route } from '../lib/http.js';
import { requireAdmin } from '../lib/auth.js';
import { publicUrl, thumbKeyFor } from '../lib/storage.js';

export const withUrls = (p) => ({
  ...p,
  imageUrl: publicUrl(p.imageKey),
  thumbUrl: p.imageKey ? publicUrl(thumbKeyFor(p.imageKey)) : null,
});

function validate(input) {
  const name = String(input.name ?? '').trim();
  const price = Number(input.price);
  const stock = Number(input.stock);
  if (!name) throw new HttpError(400, 'กรุณาใส่ชื่อสินค้า');
  if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
  if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, 'สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
  return {
    name,
    price,
    stock,
    description: String(input.description ?? '').trim(),
    category: String(input.category ?? '').trim() || 'อื่น ๆ',
    imageKey: input.imageKey || null,
  };
}

export const list = route(async (event) => {
  const { q, category } = event.queryStringParameters ?? {};
  let items = await db.listProducts();
  if (category) items = items.filter((p) => p.category === category);
  if (q) {
    const keyword = q.toLowerCase();
    items = items.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(keyword));
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json(200, items.map(withUrls));
});

export const get = route(async (event) => {
  const product = await db.getProduct(event.pathParameters.id);
  if (!product) throw new HttpError(404, 'ไม่พบสินค้านี้');
  return json(200, withUrls(product));
});

export const create = route(async (event) => {
  requireAdmin(event);
  const now = new Date().toISOString();
  const product = { productId: randomUUID(), ...validate(parseBody(event)), createdAt: now, updatedAt: now };
  await db.putProduct(product);
  return json(201, withUrls(product));
});

export const update = route(async (event) => {
  requireAdmin(event);
  const existing = await db.getProduct(event.pathParameters.id);
  if (!existing) throw new HttpError(404, 'ไม่พบสินค้านี้');
  const product = { ...existing, ...validate(parseBody(event)), updatedAt: new Date().toISOString() };
  await db.putProduct(product);
  return json(200, withUrls(product));
});

export const remove = route(async (event) => {
  requireAdmin(event);
  await db.deleteProduct(event.pathParameters.id);
  return json(200, { ok: true });
});
