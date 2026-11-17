import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../useFetch.js';
import { baht, dateTime, LOW_STOCK } from '../../format.js';
import { ErrorBox, Loading } from '../../components/Status.jsx';
import { OrderStatusBadge, PageHeader, Panel, StockBadge } from './ui.jsx';

const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d) => new Date(d).toDateString();
const shortDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

export default function AdminDashboard() {
  const orders = useFetch('/orders');
  const products = useFetch('/products');

  const stats = useMemo(() => {
    const list = (orders.data ?? []).filter((o) => o.status !== 'cancelled');
    const now = Date.now();
    const inRange = (o, from, to) => {
      const t = Date.parse(o.createdAt);
      return t >= from && t < to;
    };
    const week = list.filter((o) => inRange(o, now - 7 * DAY, now + 1));
    const prevWeek = list.filter((o) => inRange(o, now - 14 * DAY, now - 7 * DAY));
    const sum = (arr) => arr.reduce((s, o) => s + o.total, 0);

    const days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(now - (13 - i) * DAY);
      const ofDay = list.filter((o) => dayKey(o.createdAt) === dayKey(date));
      return { date, revenue: sum(ofDay), orders: ofDay.length };
    });

    const sold = new Map();
    for (const item of list.flatMap((o) => o.items)) {
      const s = sold.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
      s.qty += item.qty;
      s.revenue += item.qty * item.price;
      sold.set(item.productId, s);
    }

    return {
      revenue: sum(week),
      prevRevenue: sum(prevWeek),
      orderCount: week.length,
      average: week.length ? sum(week) / week.length : 0,
      toShip: (orders.data ?? []).filter((o) => o.status === 'paid').length,
      days,
      topSellers: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    };
  }, [orders.data]);

  const lowStock = (products.data ?? []).filter((p) => p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock);
  const recent = (orders.data ?? []).slice(0, 6);
  const loading = orders.loading || products.loading;

  const change = stats.prevRevenue ? ((stats.revenue - stats.prevRevenue) / stats.prevRevenue) * 100 : null;

  return (
    <>
      <PageHeader title="ภาพรวม" subtitle="ยอดขายและงานที่ต้องจัดการในช่วง 7 วันล่าสุด" />
      <ErrorBox>{orders.error || products.error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="ยอดขาย 7 วัน" value={baht(stats.revenue)} note={change === null ? 'ไม่มียอดขายใน 7 วันก่อนหน้า' : `${change >= 0 ? '+' : ''}${change.toFixed(0)}% จาก 7 วันก่อนหน้า`} />
            <Kpi label="คำสั่งซื้อ 7 วัน" value={stats.orderCount.toLocaleString('th-TH')} note={`เฉลี่ย ${baht(stats.average)} ต่อออร์เดอร์`} />
            <Kpi label="รอจัดส่ง" value={stats.toShip} note="ออร์เดอร์ที่ชำระแล้วแต่ยังไม่ส่ง" to="/admin/orders?status=paid" alert={stats.toShip > 0} />
            <Kpi label="สินค้าใกล้หมด" value={lowStock.length} note={`เหลือ ${LOW_STOCK} ชิ้นหรือน้อยกว่า`} to="/admin/products?stock=low" alert={lowStock.length > 0} />
          </div>

          <Panel title="ยอดขายรายวัน 14 วันล่าสุด">
            <RevenueChart days={stats.days} />
          </Panel>

          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Panel
              title="คำสั่งซื้อล่าสุด"
              padded={false}
              action={
                <Link to="/admin/orders" className="text-sm font-semibold text-teal hover:underline">
                  ดูทั้งหมด
                </Link>
              }
            >
              {recent.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted">ยังไม่มีคำสั่งซื้อ</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-[#ecebe5]">
                    {recent.map((o) => (
                      <tr key={o.orderId} className="hover:bg-[#faf9f6]">
                        <td className="px-5 py-3">
                          <Link to={`/admin/orders?id=${o.orderId}`} className="font-mono text-[13px] font-semibold hover:underline">
                            {o.orderId}
                          </Link>
                          <p className="text-xs text-muted">{dateTime(o.createdAt)}</p>
                        </td>
                        <td className="hidden px-2 py-3 sm:table-cell">{o.shipping.name}</td>
                        <td className="px-2 py-3">
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums">{baht(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <div className="space-y-5">
              <Panel title="สินค้าใกล้หมด" padded={false}>
                {lowStock.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted">สต็อกทุกชิ้นยังเพียงพอ</p>
                ) : (
                  <ul className="divide-y divide-[#ecebe5]">
                    {lowStock.map((p) => (
                      <li key={p.productId} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <img src={p.thumbUrl} alt="" className="size-9 shrink-0 rounded-md bg-[#eeeee9] object-cover" />
                        <Link to={`/admin/products/${p.productId}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">
                          {p.name}
                        </Link>
                        <span className="tabular-nums text-muted">{p.stock} ชิ้น</span>
                        <StockBadge stock={p.stock} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="ขายดี (ตลอดช่วง)" padded={false}>
                {stats.topSellers.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted">ยังไม่มีข้อมูลการขาย</p>
                ) : (
                  <ol className="divide-y divide-[#ecebe5]">
                    {stats.topSellers.map((s, i) => (
                      <li key={s.name} className="flex items-center gap-3 px-5 py-3 text-sm">
                        <span className="w-4 text-muted tabular-nums">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                        <span className="tabular-nums text-muted">{s.qty} ชิ้น</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, note, to, alert = false }) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold text-muted">
        {label}
        {alert && <span className="size-2 rounded-full bg-[#e0a100]" aria-label="ต้องจัดการ" />}
      </p>
      <p className="mt-2 text-[1.75rem] leading-none font-bold tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </>
  );
  const className = 'block rounded-xl border border-[#e3e1da] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';
  return to ? (
    <Link to={to} className={`${className} transition-colors duration-150 hover:border-forest/40`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

const W = 720;
const H = 240;
const PAD = { top: 16, right: 8, bottom: 28, left: 60 };

function niceMax(v) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

function RevenueChart({ days }) {
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(...days.map((d) => d.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / days.length;
  const barW = Math.min(30, band * 0.62);
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  const empty = days.every((d) => d.revenue === 0);

  const bar = (x, top) => {
    const h = PAD.top + plotH - top;
    if (h <= 0) return '';
    const r = Math.min(4, h, barW / 2);
    return `M${x},${PAD.top + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${PAD.top + plotH} Z`;
  };

  const active = hover === null ? null : days[hover];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="กราฟแท่งยอดขายรายวัน 14 วันล่าสุด">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ecebe5" strokeWidth="1" />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {t >= 1000 ? `฿${(t / 1000).toLocaleString('th-TH', { maximumFractionDigits: 1 })}k` : `฿${t}`}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = PAD.left + i * band + (band - barW) / 2;
          return (
            <g key={i}>
              {d.revenue > 0 && <path d={bar(x, y(d.revenue))} fill="#00806a" opacity={hover === null || hover === i ? 1 : 0.45} />}
              {i % 2 === 1 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
                  {shortDate(d.date)}
                </text>
              )}
              <rect
                x={PAD.left + i * band}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="#c9c7bf" strokeWidth="1" />
      </svg>

      {empty && <p className="absolute inset-0 grid place-items-center text-sm text-muted">ยังไม่มียอดขายในช่วงนี้</p>}

      {active && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-[#e3e1da] bg-white px-3 py-2 text-xs shadow-soft"
          style={{ left: `${((PAD.left + (hover + 0.5) * band) / W) * 100}%` }}
        >
          <p className="font-semibold">{active.date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="mt-0.5 tabular-nums">
            {baht(active.revenue)} <span className="text-muted">· {active.orders} ออร์เดอร์</span>
          </p>
        </div>
      )}
    </div>
  );
}
