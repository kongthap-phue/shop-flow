import { unmarshall } from '@aws-sdk/util-dynamodb';
import { adjustStock } from '../lib/db.js';
import { publish } from '../lib/notify.js';
import { baht } from '../lib/format.js';
import { LOW_STOCK } from '../lib/config.js';

export const handler = async (event) => {
  for (const record of event.Records ?? []) {
    if (record.eventName !== 'INSERT') continue;
    const order = unmarshall(record.dynamodb.NewImage);

    const lowStock = [];
    for (const item of order.items) {
      const product = await adjustStock(item.productId, -item.qty);
      if (product && product.stock <= LOW_STOCK) lowStock.push(product);
    }

    const lines = [
      `ลูกค้า: ${order.shipping.name} (${order.email})`,
      `โทร: ${order.shipping.phone}`,
      `ที่อยู่: ${order.shipping.address}`,
      '',
      ...order.items.map((i) => `- ${i.name} x${i.qty} = ${baht(i.price * i.qty)}`),
      `รวม ${baht(order.total)} (บัตรลงท้าย ${order.cardLast4})`,
    ];
    if (lowStock.length) {
      lines.push('', 'สินค้าใกล้หมด:', ...lowStock.map((p) => `- ${p.name} เหลือ ${p.stock} ชิ้น`));
    }
    await publish(`ออร์เดอร์ใหม่ ${order.orderId} · ${baht(order.total)}`, lines.join('\n'));
  }
};
