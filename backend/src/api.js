import * as products from './handlers/products.js';
import * as orders from './handlers/orders.js';
import * as uploads from './handlers/uploads.js';
import { json } from './lib/http.js';

const ROUTES = {
  'GET /products': products.list,
  'POST /products': products.create,
  'GET /products/{id}': products.get,
  'PUT /products/{id}': products.update,
  'DELETE /products/{id}': products.remove,
  'POST /uploads': uploads.create,
  'POST /orders': orders.create,
  'GET /orders': orders.listAll,
  'GET /orders/me': orders.listMine,
  'PATCH /orders/{id}': orders.updateStatus,
};

export const handler = async (event) => {
  const fn = ROUTES[`${event.httpMethod} ${event.resource}`];
  return fn ? fn(event) : json(404, { message: 'ไม่พบเส้นทางนี้' });
};
