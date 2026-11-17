import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useFetch } from '../../useFetch.js';
import { baht, categoryColor, dateTime, NEXT_STATUS } from '../../format.js';
import Photo from '../../components/Photo.jsx';
import { ErrorBox, Loading } from '../../components/Status.jsx';
import { ADMIN_ORDER_STATUS, Icon, OrderStatusBadge, PageHeader, Panel, SearchBox } from './ui.jsx';

const ACTION = {
  shipped: { label: 'ทำเครื่องหมายว่าจัดส่งแล้ว', primary: true },
  delivered: { label: 'ทำเครื่องหมายว่าส่งถึงแล้ว', primary: true },
  cancelled: { label: 'ยกเลิกคำสั่งซื้อ (คืนสต็อก)', primary: false },
};

export default function AdminOrders() {
  const { data: orders, setData, error, loading } = useFetch('/orders');
  const { data: products } = useFetch('/products');
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const status = params.get('status') ?? '';
  const openId = params.get('id');

  const thumbs = useMemo(() => Object.fromEntries((products ?? []).map((p) => [p.productId, p])), [products]);
  const counts = useMemo(() => {
    const c = { '': orders?.length ?? 0 };
    for (const o of orders ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const keyword = q.trim().toLowerCase();
  const visible = (orders ?? []).filter(
    (o) =>
      (!status || o.status === status) &&
      (!keyword || [o.orderId, o.shipping.name, o.email, o.shipping.phone].some((v) => v.toLowerCase().includes(keyword))),
  );
  const open = (orders ?? []).find((o) => o.orderId === openId);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === 'status' });
  };

  return (
    <>
      <PageHeader title="คำสั่งซื้อ" subtitle="กดที่แถวเพื่อดูรายละเอียดและเปลี่ยนสถานะการจัดส่ง" />
      <ErrorBox>{error}</ErrorBox>

      <Panel padded={false}>
        <div className="flex gap-1 overflow-x-auto border-b border-[#ecebe5] px-3 pt-2" role="tablist" aria-label="กรองตามสถานะ">
          {[['', 'ทั้งหมด'], ...Object.entries(ADMIN_ORDER_STATUS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key || 'all'}
              role="tab"
              aria-selected={status === key}
              onClick={() => setParam('status', key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                status === key ? 'border-forest text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
              <span className="rounded-full bg-[#eeeee9] px-1.5 text-xs tabular-nums">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="border-b border-[#ecebe5] p-3">
          <SearchBox id="order-search" value={q} onChange={setQ} placeholder="ค้นหาเลขที่คำสั่งซื้อ ชื่อลูกค้า อีเมล หรือเบอร์โทร" />
        </div>

        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">ไม่มีคำสั่งซื้อที่ตรงกับตัวกรอง</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#faf9f6] text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">คำสั่งซื้อ</th>
                  <th className="px-3 py-2.5 font-semibold">วันที่</th>
                  <th className="px-3 py-2.5 font-semibold">ลูกค้า</th>
                  <th className="px-3 py-2.5 text-right font-semibold">สินค้า</th>
                  <th className="px-3 py-2.5 text-right font-semibold">ยอดรวม</th>
                  <th className="px-5 py-2.5 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ecebe5]">
                {visible.map((o) => (
                  <tr
                    key={o.orderId}
                    onClick={() => setParam('id', o.orderId)}
                    className={`cursor-pointer hover:bg-[#faf9f6] ${o.orderId === openId ? 'bg-[#f1f7f4]' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <button
                        className="font-mono text-[13px] font-semibold hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setParam('id', o.orderId);
                        }}
                      >
                        {o.orderId}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-muted">{dateTime(o.createdAt)}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{o.shipping.name}</p>
                      <p className="text-xs text-muted">{o.email}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{o.items.reduce((n, i) => n + i.qty, 0)} ชิ้น</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{baht(o.total)}</td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <OrderPanel
        order={open}
        thumbs={thumbs}
        onClose={() => setParam('id', '')}
        onUpdated={(updated) => setData(orders.map((o) => (o.orderId === updated.orderId ? updated : o)))}
      />
    </>
  );
}

function OrderPanel({ order, thumbs, onClose, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isOpen = Boolean(order);

  useEffect(() => {
    setConfirmCancel(false);
    setError('');
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, order?.orderId]);

  async function change(status) {
    setBusy(true);
    setError('');
    try {
      onUpdated(await api(`/orders/${order.orderId}`, { method: 'PATCH', body: { status } }));
      setConfirmCancel(false);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-40" style={{ pointerEvents: isOpen ? 'auto' : 'none' }} aria-hidden={!isOpen} inert={isOpen ? undefined : ''}>
      <div className={`absolute inset-0 bg-black/25 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="รายละเอียดคำสั่งซื้อ"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-soft-lg transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {order && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-[#ecebe5] px-5 py-4">
              <div>
                <p className="font-mono text-base font-bold">{order.orderId}</p>
                <p className="mt-0.5 text-xs text-muted">{dateTime(order.createdAt)}</p>
                <div className="mt-2">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
              <button ref={closeRef} onClick={onClose} aria-label="ปิดรายละเอียด" className="grid size-8 place-items-center rounded-md hover:bg-[#f3f2ee]">
                <Icon name="close" className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm">
              <section>
                <h3 className="mb-3 font-sans text-xs font-bold tracking-wide text-muted">สินค้า</h3>
                <ul className="space-y-3">
                  {order.items.map((i) => {
                    const p = thumbs[i.productId];
                    return (
                      <li key={i.productId} className="flex items-center gap-3">
                        <span className="size-11 shrink-0 overflow-hidden rounded-md border border-[#ecebe5]">
                          <Photo src={p?.thumbUrl} alt="" color={categoryColor(p?.category)} className="size-full" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{i.name}</span>
                          <span className="text-xs text-muted tabular-nums">
                            {baht(i.price)} × {i.qty}
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums">{baht(i.price * i.qty)}</span>
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-4 space-y-1.5 border-t border-[#ecebe5] pt-3">
                  <Row label="ค่าจัดส่ง" value="ฟรี" />
                  <Row label="ยอดรวม" value={baht(order.total)} strong />
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-sans text-xs font-bold tracking-wide text-muted">ลูกค้าและที่อยู่จัดส่ง</h3>
                <p className="font-semibold">{order.shipping.name}</p>
                <p className="text-muted">{order.email}</p>
                <p className="text-muted tabular-nums">{order.shipping.phone}</p>
                <p className="mt-2 leading-relaxed">{order.shipping.address}</p>
              </section>

              <section>
                <h3 className="mb-2 font-sans text-xs font-bold tracking-wide text-muted">การชำระเงิน</h3>
                <dl className="space-y-1.5">
                  <Row label="วิธีชำระ" value={`บัตรลงท้าย ${order.cardLast4}`} />
                  <Row label="รหัสการชำระเงิน" value={<span className="font-mono text-xs">{order.paymentId}</span>} />
                </dl>
              </section>
            </div>

            {NEXT_STATUS[order.status].length > 0 && (
              <footer className="space-y-2 border-t border-[#ecebe5] px-5 py-4">
                <ErrorBox>{error}</ErrorBox>
                {NEXT_STATUS[order.status].map((s) =>
                  s === 'cancelled' ? (
                    confirmCancel ? (
                      <div key={s} className="flex items-center justify-between gap-2 rounded-lg bg-[#fde4e1] px-3 py-2">
                        <span className="text-xs font-semibold text-[#a1271b]">ยืนยันยกเลิก? สต็อกจะถูกคืน</span>
                        <span className="flex gap-2">
                          <button className="rounded-md bg-pop px-3 py-1 text-xs font-semibold text-white" disabled={busy} onClick={() => change(s)}>
                            ยกเลิกคำสั่งซื้อ
                          </button>
                          <button className="rounded-md border border-[#d6d4cc] bg-white px-3 py-1 text-xs font-semibold" onClick={() => setConfirmCancel(false)}>
                            ไม่ยกเลิก
                          </button>
                        </span>
                      </div>
                    ) : (
                      <button key={s} className="w-full rounded-lg border border-[#d6d4cc] py-2 text-sm font-semibold text-[#a1271b] hover:bg-[#fdf6f5]" onClick={() => setConfirmCancel(true)}>
                        {ACTION[s].label}
                      </button>
                    )
                  ) : (
                    <button key={s} className="btn-primary w-full rounded-lg py-2.5" disabled={busy} onClick={() => change(s)}>
                      {busy ? 'กำลังบันทึก…' : ACTION[s].label}
                    </button>
                  ),
                )}
              </footer>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right tabular-nums ${strong ? 'text-base font-bold' : ''}`}>{value}</dd>
    </div>
  );
}
