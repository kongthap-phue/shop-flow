import express from 'express';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as products from '../src/handlers/products.js';
import * as uploads from '../src/handlers/uploads.js';
import * as orders from '../src/handlers/orders.js';
import * as onImageUploaded from '../src/events/onImageUploaded.js';
import * as onOrderCreated from '../src/events/onOrderCreated.js';
import * as dailyReport from '../src/events/dailyReport.js';
import { json, route, HttpError } from '../src/lib/http.js';
import { requireAdmin } from '../src/lib/auth.js';
import { listNotifications } from '../src/lib/notify.js';
import { writeObject } from '../src/lib/storage.js';
import { UPLOAD_DIR } from '../src/lib/config.js';
import { login, register, verifyToken } from './auth-local.js';

const PORT = Number(process.env.API_PORT || process.env.PORT || 4301);
const app = express();

function fireEvent(name, fn) {
  fn().catch((err) => console.error(`[${name}] ล้มเหลว:`, err));
}

function claimsFrom(req) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  return token ? verifyToken(token) : null;
}

function toEvent(req, resource) {
  const claims = claimsFrom(req);
  return {
    httpMethod: req.method,
    resource,
    path: req.path,
    pathParameters: Object.keys(req.params).length ? req.params : null,
    queryStringParameters: Object.keys(req.query).length ? req.query : null,
    headers: req.headers,
    body: typeof req.body === 'string' && req.body.length ? req.body : null,
    requestContext: claims ? { authorizer: { claims } } : {},
  };
}

function mount(method, path, fn, after) {
  app[method](path, express.text({ type: '*/*', limit: '1mb' }), async (req, res) => {
    const result = await fn(toEvent(req, path));
    res.status(result.statusCode).set(result.headers ?? {}).send(result.body);
    after?.(result);
  });
}

function afterOrderCreated(result) {
  if (result.statusCode !== 201) return;
  const order = JSON.parse(result.body);
  const event = {
    Records: [{ eventName: 'INSERT', dynamodb: { NewImage: marshall(order, { removeUndefinedValues: true }) } }],
  };
  fireEvent('onOrderCreated', () => onOrderCreated.handler(event));
}

const authRoute = (fn) =>
  route(async (event) => json(200, await fn(JSON.parse(event.body ?? '{}'))));
mount('post', '/auth/register', authRoute(register));
mount('post', '/auth/login', authRoute(login));

mount('get', '/products', products.list);
mount('get', '/products/:id', products.get);
mount('post', '/products', products.create);
mount('put', '/products/:id', products.update);
mount('delete', '/products/:id', products.remove);
mount('post', '/uploads', uploads.create);
mount('post', '/orders', orders.create, afterOrderCreated);
mount('get', '/orders/me', orders.listMine);
mount('get', '/orders', orders.listAll);
mount('patch', '/orders/:id', orders.updateStatus);

app.use('/assets', express.static(UPLOAD_DIR, { maxAge: '1h' }));

app.put('/local-upload/*', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  const key = req.params[0];
  try {
    if (!key.startsWith('uploads/') || !req.body?.length) throw new Error('invalid upload');
    await writeObject(key, req.body);
  } catch {
    return res.status(400).json({ message: 'ไฟล์ไม่ถูกต้อง' });
  }
  res.sendStatus(200);
  const s3Key = key.split('/').map(encodeURIComponent).join('/');
  fireEvent('onImageUploaded', () => onImageUploaded.handler({ Records: [{ s3: { object: { key: s3Key } } }] }));
});

mount(
  'get',
  '/local/notifications',
  route(async (event) => {
    requireAdmin(event);
    return json(200, await listNotifications());
  }),
);
mount(
  'post',
  '/local/run-report',
  route(async (event) => {
    requireAdmin(event);
    return json(200, await dailyReport.handler({ source: 'local' }));
  }),
);

app.use((req, res) => res.status(404).json({ message: `ไม่พบ ${req.method} ${req.path}` }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err instanceof HttpError ? err.status : 500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
});

app.listen(PORT, () => console.log(`API พร้อมใช้งานที่ http://localhost:${PORT}`));
