import { LOW_STOCK } from '../format.js';

export default function StockBadge({ stock, className = '' }) {
  if (stock === 0) return <span className={`sticker -rotate-3 bg-white px-3 py-0.5 text-xs ${className}`}>หมดแล้ว</span>;
  if (stock <= LOW_STOCK) return <span className={`sticker -rotate-3 bg-sun px-3 py-0.5 text-xs ${className}`}>เหลือ {stock} ชิ้น!</span>;
  return null;
}
