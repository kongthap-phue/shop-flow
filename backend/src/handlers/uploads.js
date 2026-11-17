import { randomUUID } from 'node:crypto';
import { HttpError, json, parseBody, route } from '../lib/http.js';
import { requireAdmin } from '../lib/auth.js';
import { createUploadUrl } from '../lib/storage.js';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const create = route(async (event) => {
  requireAdmin(event);
  const { contentType } = parseBody(event);
  const ext = EXTENSIONS[contentType];
  if (!ext) throw new HttpError(400, 'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP');
  const key = `uploads/${randomUUID()}.${ext}`;
  return json(200, { key, uploadUrl: await createUploadUrl(key, contentType) });
});
