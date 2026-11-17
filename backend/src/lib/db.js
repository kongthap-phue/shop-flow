import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from './config.js';

const DB_FILE = path.join(DATA_DIR, 'db.json');

async function load() {
  try {
    return JSON.parse(await readFile(DB_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return { products: {}, orders: {} };
    throw err;
  }
}

async function save(data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

let queue = Promise.resolve();
function run(fn, write) {
  const job = queue.then(async () => {
    const data = await load();
    const result = await fn(data);
    if (write) await save(data);
    return result;
  });
  queue = job.catch(() => {});
  return job;
}
const read = (fn) => run(fn, false);
const write = (fn) => run(fn, true);

export const listProducts = () => read((d) => Object.values(d.products));
export const getProduct = (id) => read((d) => d.products[id] ?? null);
export const putProduct = (product) => write((d) => (d.products[product.productId] = product));
export const deleteProduct = (id) => write((d) => void delete d.products[id]);

export const adjustStock = (id, delta) =>
  write((d) => {
    const product = d.products[id];
    if (!product) return null;
    product.stock = Math.max(0, product.stock + delta);
    product.updatedAt = new Date().toISOString();
    return product;
  });

export const listOrders = () => read((d) => Object.values(d.orders));
export const listOrdersByUser = (userId) => read((d) => Object.values(d.orders).filter((o) => o.userId === userId));
export const getOrder = (id) => read((d) => d.orders[id] ?? null);
export const putOrder = (order) => write((d) => (d.orders[order.orderId] = order));

export const updateOrder = (id, patch) =>
  write((d) => {
    const order = d.orders[id];
    if (!order) return null;
    return Object.assign(order, patch);
  });
