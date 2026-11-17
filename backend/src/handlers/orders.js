import { randomBytes } from 'node:crypto';
import * as db from '../lib/db.js';
import { HttpError, json, parseBody, route } from '../lib/http.js';
import { requireAdmin, requireUser } from '../lib/auth.js';
import { charge } from '../lib/payment.js';
import { roundMoney } from '../lib/format.js';

const NEXT_STATUS = {
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const newOrderId = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ORD-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
};

const byNewest = (a, b) => b.createdAt.localeCompare(a.createdAt);

function readShipping(shipping) {
  const name = String(shipping?.name ?? '').trim();
  const phone = String(shipping?.phone ?? '').trim();
  const address = String(shipping?.address ?? '').trim();
  if (!name || !phone || !address) throw new HttpError(400, 'กรุณากรอกชื่อ เบอร์โทร และที่อยู่จัดส่งให้ครบ');
  return { name, phone, address };
}

async function readItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'ตะกร้าสินค้าว่างอยู่');
  const qtyById = new Map();
  for (const { productId, qty } of items) {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'จำนวนสินค้าไม่ถูกต้อง');
    qtyById.set(productId, (qtyById.get(productId) ?? 0) + n);
  }
  const lines = [];
  for (const [productId, qty] of qtyById) {
    const product = await db.getProduct(productId);
    if (!product) throw new HttpError(400, 'มีสินค้าในตะกร้าที่ร้านเลิกขายไปแล้ว กรุณาลบออกก่อน');
    if (product.stock < qty) throw new HttpError(409, `${product.name} เหลือเพียง ${product.stock} ชิ้น`);
    lines.push({ productId, name: product.name, price: product.price, qty, imageKey: product.imageKey });
  }
  return lines;
}

export const create = route(async (event) => {
  const user = requireUser(event);
  const body = parseBody(event);
  const shipping = readShipping(body.shipping);
  const items = await readItems(body.items);
  const total = roundMoney(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const payment = await charge({ amount: total, card: body.card });

  const order = {
    orderId: newOrderId(),
    userId: user.id,
    email: user.email,
    items,
    total,
    shipping,
    status: 'paid',
    paymentId: payment.paymentId,
    cardLast4: payment.last4,
    createdAt: new Date().toISOString(),
  };
  await db.putOrder(order);
  return json(201, order);
});

export const listMine = route(async (event) => {
  const user = requireUser(event);
  const orders = await db.listOrdersByUser(user.id);
  return json(200, orders.sort(byNewest));
});

export const listAll = route(async (event) => {
  requireAdmin(event);
  const orders = await db.listOrders();
  return json(200, orders.sort(byNewest));
});

export const updateStatus = route(async (event) => {
  requireAdmin(event);
  const { status } = parseBody(event);
  const order = await db.getOrder(event.pathParameters.id);
  if (!order) throw new HttpError(404, 'ไม่พบออร์เดอร์นี้');
  if (!NEXT_STATUS[order.status]?.includes(status)) {
    throw new HttpError(400, `เปลี่ยนสถานะจาก ${order.status} เป็น ${status} ไม่ได้`);
  }
  if (status === 'cancelled') {
    for (const item of order.items) await db.adjustStock(item.productId, item.qty);
  }
  const updated = await db.updateOrder(order.orderId, { status, updatedAt: new Date().toISOString() });
  return json(200, updated);
});
