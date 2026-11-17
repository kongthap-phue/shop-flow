import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useCart } from '../cart.jsx';
import { baht, categoryColor } from '../format.js';
import CartLine, { FreeShippingBar } from './CartLine.jsx';
import Photo from './Photo.jsx';

export default function CartDrawer() {
  const { items, total, isOpen, closeCart } = useCart();
  const navigate = useNavigate();
  const closeRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocus.current?.focus?.();
    };
  }, [isOpen, closeCart]);

  return (
    <div className="fixed inset-0 z-40" style={{ pointerEvents: isOpen ? 'auto' : 'none' }} aria-hidden={!isOpen} inert={isOpen ? undefined : ''}>
      <div
        className={`absolute inset-0 bg-forest/45 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeCart}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="ตะกร้าของคุณ"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col bg-milk shadow-soft-lg transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="relative border-b border-ink/10 px-5 pt-4 pb-4">
          <h2 className="text-center text-2xl">ตะกร้าของคุณ</h2>
          <button
            ref={closeRef}
            onClick={closeCart}
            aria-label="ปิดตะกร้า"
            className="absolute top-3.5 right-4 grid size-9 place-items-center rounded-full border-2 border-forest/70 text-forest transition-colors duration-150 hover:bg-forest hover:text-milk"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="mt-3">
            <FreeShippingBar />
          </div>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-fat text-[1.75rem] leading-tight">ตะกร้ายังว่างอยู่</p>
            <p className="mt-2 text-muted">เลือกของใช้ที่ชอบใส่ตะกร้าได้เลย ส่งฟรีทุกออร์เดอร์</p>
            <Link to="/shop" onClick={closeCart} className="btn-primary mt-6 px-8">
              เริ่มช้อป
            </Link>
          </div>
        ) : (
          <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {items.map((item) => (
              <CartLine key={item.productId} item={item} onNavigate={closeCart} />
            ))}
          </ul>
        )}

        <AddMore open={isOpen} />

        {items.length > 0 && (
          <footer className="border-t border-ink/10 bg-milk px-5 pt-4 pb-5">
            <div className="flex justify-between text-sm">
              <span>ค่าจัดส่ง</span>
              <span className="font-semibold">ฟรี</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-fat text-lg">ยอดรวม</span>
              <span className="text-xl font-bold tabular-nums">{baht(total)}</span>
            </div>
            <button
              className="btn-primary mt-4 w-full py-3.5 text-lg"
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
            >
              ไปชำระเงิน
            </button>
            <Link to="/cart" onClick={closeCart} className="mt-3 block text-center text-sm font-semibold underline underline-offset-4 hover:text-teal">
              ดูตะกร้าแบบเต็มหน้า
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}

function AddMore({ open }) {
  const { items, add } = useCart();
  const [products, setProducts] = useState([]);
  const rowRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api('/products')
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [open]);

  const inCart = new Set(items.map((i) => i.productId));
  const picks = products.filter((p) => p.stock > 0 && !inCart.has(p.productId));
  if (!picks.length) return null;

  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  return (
    <section className="border-t border-ink/10 bg-white/60 py-4">
      <div className="flex items-center justify-between px-5">
        <h3 className="text-[17px]">เพิ่มของอื่นในตะกร้า</h3>
        <div className="flex gap-1">
          {[
            [-1, 'M15 6l-6 6 6 6', 'เลื่อนไปทางซ้าย'],
            [1, 'M9 6l6 6-6 6', 'เลื่อนไปทางขวา'],
          ].map(([dir, path, label]) => (
            <button key={dir} onClick={() => scroll(dir)} aria-label={label} className="grid size-8 place-items-center rounded-full hover:bg-forest/10">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={path} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <ul ref={rowRef} className="mt-3 flex snap-x gap-3 overflow-x-auto px-5 [scrollbar-width:none]">
        {picks.map((p) => (
          <li key={p.productId} className="flex w-56 shrink-0 snap-start items-center gap-3 rounded-xl border border-ink/10 bg-white p-2.5">
            <span className="size-12 shrink-0 overflow-hidden rounded-lg">
              <Photo src={p.thumbUrl} alt="" color={categoryColor(p.category)} className="size-full" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{p.name}</span>
              <span className="text-sm tabular-nums">{baht(p.price).replace('.00', '')}</span>
            </span>
            <button
              onClick={() => add(p)}
              aria-label={`ใส่ ${p.name} ลงตะกร้า`}
              className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-forest text-forest transition-colors duration-150 hover:bg-forest hover:text-milk"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
