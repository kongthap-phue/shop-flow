import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { useFetch } from '../useFetch.js';
import { baht, categoryColor } from '../format.js';
import ProductImage from '../components/ProductImage.jsx';
import StockBadge from '../components/StockBadge.jsx';
import { ErrorBox, Loading } from '../components/Status.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const { data: product, error, loading } = useFetch(`/products/${id}`);
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);

  if (loading) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  const inCart = items.find((i) => i.productId === product.productId)?.qty ?? 0;
  const available = product.stock - inCart;
  const clamp = (n) => Math.max(1, Math.min(available, n));

  return (
    <div className="space-y-6">
      <Link to="/shop" className="inline-block font-display text-muted hover:text-ink">
        ← สินค้าทั้งหมด
      </Link>
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div className="relative">
          <ProductImage
            product={product}
            full
            glyphClass="text-[clamp(7rem,22vw,13rem)]"
            className={`aspect-[4/5] w-full rounded-[28px] ${product.stock === 0 ? 'grayscale' : ''}`}
          />
          <StockBadge stock={product.stock} className="absolute top-5 left-5 text-sm" />
        </div>

        <div className="space-y-6">
          <Link
            to={`/shop?category=${encodeURIComponent(product.category)}`}
            className="inline-block rounded-full border border-ink/20 px-3.5 py-0.5 font-display text-sm"
            style={{ background: categoryColor(product.category) }}
          >
            {product.category}
          </Link>
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] leading-[1.15]">{product.name}</h1>
          <p className="font-display text-4xl font-semibold tabular-nums">{baht(product.price).replace('.00', '')}</p>
          {product.description && <p className="max-w-prose text-lg leading-relaxed">{product.description}</p>}

          {available > 0 ? (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center rounded-full border border-ink/10 bg-white shadow-soft-sm">
                <button className="grid size-11 place-items-center font-display text-xl disabled:opacity-30" aria-label="ลดจำนวน" disabled={qty <= 1} onClick={() => setQty(clamp(qty - 1))}>
                  −
                </button>
                <input
                  id="qty"
                  aria-label="จำนวน"
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setQty(clamp(Number(e.target.value.replace(/\D/g, '')) || 1))}
                  className="w-10 bg-transparent text-center font-display text-lg tabular-nums focus:outline-none"
                />
                <button className="grid size-11 place-items-center font-display text-xl disabled:opacity-30" aria-label="เพิ่มจำนวน" disabled={qty >= available} onClick={() => setQty(clamp(qty + 1))}>
                  +
                </button>
              </div>
              <button
                className="btn-primary px-8 py-3 text-lg"
                onClick={() => {
                  add(product, qty);
                  setQty(1);
                }}
              >
                ใส่ตะกร้า {baht(product.price * qty).replace('.00', '')}
              </button>
            </div>
          ) : (
            <p className="font-display text-lg text-muted">{product.stock === 0 ? 'สินค้าหมดชั่วคราว' : `ใส่ตะกร้าครบ ${inCart} ชิ้นที่มีแล้ว`}</p>
          )}
          <ul className="flex flex-wrap gap-2 pt-2 text-sm">
            <li className="rounded-full border border-ink/20 bg-white px-3 py-1">ส่งฟรี</li>
            <li className="rounded-full border border-ink/20 bg-white px-3 py-1">จัดส่งใน 1–2 วันทำการ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
