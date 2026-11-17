import { HttpError } from './http.js';

export function getUser(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name || claims.email,
    groups: parseGroups(claims['cognito:groups']),
  };
}

function parseGroups(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).replace(/[[\]]/g, '').split(/[,\s]+/).filter(Boolean);
}

export function requireUser(event) {
  const user = getUser(event);
  if (!user) throw new HttpError(401, 'กรุณาเข้าสู่ระบบ');
  return user;
}

export function requireAdmin(event) {
  const user = requireUser(event);
  if (!user.groups.includes('admin')) throw new HttpError(403, 'หน้านี้สำหรับผู้ดูแลร้านเท่านั้น');
  return user;
}
