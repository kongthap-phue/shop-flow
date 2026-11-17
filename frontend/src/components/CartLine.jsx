import { Link } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { baht } from '../format.js';
import ProductImage from './ProductImage.jsx';

export default function CartLine({ item, onNavigate }) {
  const { setQty, remove } = useCart();
  return (
    <li className="flex gap-4">
      <Link to={`/products/${item.productId}`} onClick={onNavigate} className="block size-20 shrink-0 overflow-hidden rounded-xl bg-white shadow-soft-sm">
        <ProductImage product={item} glyphClass="text-3xl" className="size-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/products/${item.productId}`} onClick={onNavigate} className="font-fat text-[17px] leading-snug hover:text-teal">
              {item.name}
            </Link>
            <p className="text-sm text-muted">{item.category}</p>
          </div>
          <p className="shrink-0 font-bold tabular-nums">{baht(item.price * item.qty).replace('.00', '')}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QtyStepper qty={item.qty} max={item.stock} onChange={(q) => setQty(item.productId, q)} />
          <button className="text-sm text-muted underline underline-offset-2 hover:text-pop" onClick={() => remove(item.productId)}>
            ลบ
          </button>
        </div>
      </div>
    </li>
  );
}

export function QtyStepper({ qty, max, onChange }) {
  const btn = 'grid size-8 place-items-center rounded-full text-lg transition-colors duration-150 hover:bg-forest/10 disabled:opacity-30';
  return (
    <div className="flex items-center rounded-full border-2 border-forest/80 px-0.5">
      <button className={btn} aria-label="ลดจำนวน" disabled={qty <= 1} onClick={() => onChange(qty - 1)}>
        −
      </button>
      <span className="w-7 text-center font-semibold tabular-nums">{qty}</span>
      <button className={btn} aria-label="เพิ่มจำนวน" disabled={qty >= max} onClick={() => onChange(qty + 1)}>
        +
      </button>
    </div>
  );
}

export function FreeShippingBar() {
  return (
    <div>
      <p className="text-center text-sm font-semibold">ออร์เดอร์นี้ส่งฟรี ไม่มีขั้นต่ำ</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest/10">
        <div className="h-full w-full rounded-full bg-teal" />
      </div>
    </div>
  );
}
