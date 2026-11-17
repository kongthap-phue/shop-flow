import { listOrders, listProducts } from '../lib/db.js';
import { publish } from '../lib/notify.js';
import { baht, roundMoney } from '../lib/format.js';
import { LOW_STOCK } from '../lib/config.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const handler = async () => {
  const since = Date.now() - DAY_MS;
  const orders = (await listOrders()).filter((o) => Date.parse(o.createdAt) >= since && o.status !== 'cancelled');
  const revenue = roundMoney(orders.reduce((sum, o) => sum + o.total, 0));

  const soldByName = new Map();
  for (const item of orders.flatMap((o) => o.items)) {
    soldByName.set(item.name, (soldByName.get(item.name) ?? 0) + item.qty);
  }
  const bestSellers = [...soldByName].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lowStock = (await listProducts()).filter((p) => p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock);

  const lines = [`ออร์เดอร์ ${orders.length} รายการ ยอดขายรวม ${baht(revenue)}`];
  if (bestSellers.length) {
    lines.push('', 'ขายดี:', ...bestSellers.map(([name, qty], i) => `${i + 1}. ${name} (${qty} ชิ้น)`));
  }
  lines.push('', lowStock.length ? 'สินค้าใกล้หมด:' : 'ไม่มีสินค้าใกล้หมด');
  lines.push(...lowStock.map((p) => `- ${p.name} เหลือ ${p.stock} ชิ้น`));

  const date = new Date().toLocaleDateString('th-TH', { dateStyle: 'long' });
  await publish(`รายงานยอดขายประจำวัน ${date}`, lines.join('\n'));
  return { orders: orders.length, revenue, lowStock: lowStock.length };
};
