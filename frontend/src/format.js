export const SHOP_NAME = 'Shop Flow';

export const baht = (n) => n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });

export const dateTime = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export const ORDER_STATUS = {
  paid: { label: 'ชำระเงินแล้ว', className: 'bg-tech' },
  shipped: { label: 'กำลังจัดส่ง', className: 'bg-sun' },
  delivered: { label: 'จัดส่งสำเร็จ', className: 'bg-lime' },
  cancelled: { label: 'ยกเลิก', className: 'bg-stone-200' },
};

export const NEXT_STATUS = {
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const LOW_STOCK = 5;

const CATEGORY_COLORS = {
  เสื้อผ้า: 'var(--color-wear)',
  อุปกรณ์ไอที: 'var(--color-tech)',
  ของใช้: 'var(--color-home)',
  เครื่องเขียน: 'var(--color-lime)',
};
const FALLBACK_COLORS = ['var(--color-grape)', 'var(--color-sun)', 'var(--color-wear)', 'var(--color-tech)'];

export function categoryColor(category = '') {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let sum = 0;
  for (const ch of category) sum += ch.codePointAt(0);
  return FALLBACK_COLORS[sum % FALLBACK_COLORS.length];
}
