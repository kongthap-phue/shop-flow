import { loadSession } from './session.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = loadSession()?.token;
  if (token) headers.Authorization = token;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `เกิดข้อผิดพลาด (${res.status})`);
  return data;
}

export async function uploadImage(file) {
  const { key, uploadUrl } = await api('/uploads', { method: 'POST', body: { contentType: file.type } });
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ');
  return key;
}
