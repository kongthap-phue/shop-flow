import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFetch } from '../useFetch.js';
import { baht, dateTime } from '../format.js';
import { ErrorBox, Loading, StatusPill } from '../components/Status.jsx';

export default function Orders() {
  const { data: orders, error, loading } = useFetch('/orders/me');
  const [params] = useSearchParams();
  const newId = params.get('new');

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {newId && <OrderSuccess orderId={newId} />}
      <h1 className="text-[clamp(2rem,5vw,3rem)] leading-tight">คำสั่งซื้อของฉัน</h1>
      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : orders?.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-display text-lg">ยังไม่มีคำสั่งซื้อ</p>
          <Link to="/shop" className="btn-primary mt-4">
            เลือกซื้อสินค้า
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {orders?.map((o) => (
            <li key={o.orderId} className={`card p-5 ${o.orderId === newId ? 'bg-lime/40' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-lg tabular-nums">{o.orderId}</p>
                  <p className="text-sm text-muted">{dateTime(o.createdAt)}</p>
                </div>
                <StatusPill status={o.status} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {o.items.map((i) => (
                  <li key={i.productId} className="flex justify-between gap-3">
                    <span>
                      {i.name} <span className="text-muted">×{i.qty}</span>
                    </span>
                    <span className="tabular-nums">{baht(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-dashed border-ink/30 pt-3">
                <span className="text-sm text-muted">จัดส่งถึง {o.shipping.name}</span>
                <span className="font-display text-xl font-semibold tabular-nums">{baht(o.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ['var(--color-pop)', 'var(--color-sun)', 'var(--color-lime)', 'var(--color-tech)', 'var(--color-wear)'];

function OrderSuccess({ orderId }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const distance = 140 + Math.random() * 120;
        return {
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          x: `${Math.cos(angle) * distance}px`,
          y: `${Math.sin(angle) * distance * 0.7 + 60}px`,
          r: `${Math.round(Math.random() * 540 - 270)}deg`,
          d: `${Math.round(Math.random() * 120)}ms`,
          round: i % 3 === 0,
        };
      }),
    [],
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden="true">
        {pieces.map((p, i) => (
          <span
            key={i}
            className={`confetti absolute block border border-ink/20 ${p.round ? 'size-3 rounded-full' : 'h-2.5 w-4 rounded-sm'}`}
            style={{ background: p.color, '--x': p.x, '--y': p.y, '--r': p.r, '--d': p.d }}
          />
        ))}
      </div>
      <div className="pop-in relative rounded-[28px] border border-ink/10 bg-lime px-6 py-8 text-center shadow-soft-lg" role="status">
        <p className="font-fat text-[clamp(2rem,6vw,3.25rem)] leading-tight">สั่งซื้อสำเร็จ!</p>
        <p className="mt-2 text-lg">
          หมายเลขคำสั่งซื้อ <span className="font-display font-semibold tabular-nums">{orderId}</span>
        </p>
        <p className="text-muted">ร้านได้รับออร์เดอร์แล้ว และจะจัดส่งภายใน 1–2 วันทำการ</p>
      </div>
    </div>
  );
}
