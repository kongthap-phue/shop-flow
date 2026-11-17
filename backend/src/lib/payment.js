import { randomUUID } from 'node:crypto';
import { HttpError } from './http.js';

const DECLINED = '4000000000000002';

export async function charge({ amount, card }) {
  const number = String(card?.number ?? '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(number)) throw new HttpError(400, 'เลขบัตรต้องมี 16 หลัก');
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(card?.exp ?? ''))) throw new HttpError(400, 'วันหมดอายุต้องอยู่ในรูปแบบ MM/YY');
  if (!/^\d{3,4}$/.test(String(card?.cvc ?? ''))) throw new HttpError(400, 'CVC ไม่ถูกต้อง');
  if (number === DECLINED) throw new HttpError(402, 'บัตรถูกปฏิเสธ กรุณาใช้บัตรใบอื่น');
  return { paymentId: `pay_${randomUUID().slice(0, 12)}`, amount, last4: number.slice(-4) };
}
