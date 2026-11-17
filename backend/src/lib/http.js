export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

export const json = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

export function parseBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'รูปแบบข้อมูลไม่ถูกต้อง');
  }
}

export const route = (fn) => async (event) => {
  try {
    return await fn(event);
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { message: err.message });
    console.error(err);
    return json(500, { message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
