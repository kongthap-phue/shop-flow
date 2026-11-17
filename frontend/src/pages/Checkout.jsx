import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useCart } from '../cart.jsx';
import { baht } from '../format.js';
import { ErrorBox } from '../components/Status.jsx';
import { ArchLogo } from '../components/Decor.jsx';
import ProductImage from '../components/ProductImage.jsx';

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExp = (v) => v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user.name, phone: '', address: '', number: '', exp: '', cvc: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <Link to="/" className="block w-40 text-forest">
          <ArchLogo className="w-full" />
        </Link>
        <p className="mt-8 font-fat text-2xl">ยังไม่มีสินค้าในตะกร้า</p>
        <Link to="/shop" className="btn-primary mt-6 px-8">
          เลือกซื้อสินค้า
        </Link>
      </div>
    );
  }

  const set = (key, format = (v) => v) => (e) => setForm({ ...form, [key]: format(e.target.value) });
  const count = items.reduce((n, i) => n + i.qty, 0);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map(({ productId, qty }) => ({ productId, qty })),
          shipping: { name: form.name, phone: form.phone, address: form.address },
          card: { number: form.number, exp: form.exp, cvc: form.cvc },
        },
      });
      clear();
      navigate(`/orders?new=${order.orderId}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="order-2 px-5 py-8 sm:px-10 lg:order-1 lg:border-r lg:border-ink/10 lg:py-12">
        <div className="ml-auto max-w-xl lg:mr-0">
          <Link to="/" className="block w-36 text-forest" aria-label="กลับหน้าแรก">
            <ArchLogo className="w-full" />
          </Link>
          <nav className="mt-5 flex flex-wrap items-center gap-2 text-sm" aria-label="ขั้นตอนการสั่งซื้อ">
            <Link to="/cart" className="text-teal hover:underline">
              ตะกร้า
            </Link>
            <Chevron />
            <span className="font-semibold">ข้อมูลจัดส่งและชำระเงิน</span>
            <Chevron />
            <span className="text-muted">เสร็จสิ้น</span>
          </nav>

          <Section title="ติดต่อ">
            <div className="flex items-center justify-between rounded-md border border-ink/15 px-4 py-3 text-sm">
              <span className="text-muted">อีเมล</span>
              <span className="font-semibold">{user.email}</span>
            </div>
          </Section>

          <Section title="ที่อยู่จัดส่ง">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input id="ship-name" label="ชื่อผู้รับ" required value={form.name} onChange={set('name')} autoComplete="name" />
              <Input id="ship-phone" label="เบอร์โทร" required inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
            <label htmlFor="ship-address" className="sr-only">
              ที่อยู่
            </label>
            <textarea
              id="ship-address"
              required
              value={form.address}
              onChange={set('address')}
              placeholder="ที่อยู่ (บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์)"
              className="checkout-input min-h-24"
              autoComplete="street-address"
            />
          </Section>

          <Section title="วิธีจัดส่ง">
            <div className="flex items-center justify-between rounded-md border-2 border-forest bg-teal/[0.06] px-4 py-3.5">
              <span className="flex items-center gap-3">
                <span className="grid size-4 place-items-center rounded-full border-2 border-forest">
                  <span className="size-1.5 rounded-full bg-forest" />
                </span>
                <span>
                  <span className="block font-semibold">จัดส่งมาตรฐาน</span>
                  <span className="text-sm text-muted">ถึงบ้านใน 1–2 วันทำการ</span>
                </span>
              </span>
              <span className="font-bold">ฟรี</span>
            </div>
          </Section>

          <Section title="ชำระเงิน" note="โหมดทดสอบ ไม่มีการตัดเงินจริง">
            <div className="overflow-hidden rounded-md border-2 border-forest">
              <div className="flex items-center justify-between bg-teal/[0.06] px-4 py-3">
                <span className="font-semibold">บัตรเครดิต / เดบิต</span>
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-5 w-8 rounded bg-[#1a1f71]" />
                  <span className="relative h-5 w-8 overflow-hidden rounded bg-[#222]">
                    <span className="absolute top-1 left-1.5 size-3 rounded-full bg-[#eb001b]" />
                    <span className="absolute top-1 right-1.5 size-3 rounded-full bg-[#f79e1b]/90" />
                  </span>
                </span>
              </div>
              <div className="space-y-3 border-t border-ink/10 bg-[#fafafa] p-4">
                <Input
                  id="card-number"
                  label="เลขบัตร"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  className="font-mono"
                  value={form.number}
                  onChange={set('number', formatCard)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input id="card-exp" label="วันหมดอายุ (MM/YY)" required inputMode="numeric" autoComplete="cc-exp" className="font-mono" value={form.exp} onChange={set('exp', formatExp)} />
                  <Input
                    id="card-cvc"
                    label="CVC"
                    required
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    className="font-mono"
                    value={form.cvc}
                    onChange={set('cvc', (v) => v.replace(/\D/g, '').slice(0, 4))}
                  />
                </div>
                <p className="text-sm text-muted">
                  บัตรทดสอบ <span className="font-mono">4242 4242 4242 4242</span> จ่ายสำเร็จ หรือ <span className="font-mono">4000 0000 0000 0002</span> ลองกรณีบัตรถูกปฏิเสธ
                </p>
              </div>
            </div>
          </Section>

          <div className="mt-6">
            <ErrorBox>{error}</ErrorBox>
          </div>
          <button type="submit" className="btn-primary mt-4 w-full rounded-md py-4 text-lg" disabled={submitting}>
            {submitting ? 'กำลังชำระเงิน…' : `ชำระเงิน ${baht(total)}`}
          </button>
          <Link to="/cart" className="mt-5 inline-flex items-center gap-1 text-sm text-teal hover:underline">
            <Chevron left />
            กลับไปที่ตะกร้า
          </Link>
        </div>
      </div>

      <aside className="order-1 border-b border-ink/10 bg-milk px-5 py-8 sm:px-10 lg:order-2 lg:border-b-0 lg:py-12">
        <div className="max-w-md lg:sticky lg:top-12">
          <h2 className="sr-only">สรุปคำสั่งซื้อ</h2>
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-4">
                <span className="relative shrink-0">
                  <span className="block size-16 overflow-hidden rounded-lg border border-ink/10 bg-white">
                    <ProductImage product={i} glyphClass="text-2xl" className="size-full" />
                  </span>
                  <span className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full bg-muted px-1.5 text-xs font-bold text-white tabular-nums">
                    {i.qty}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{i.name}</span>
                  <span className="text-sm text-muted">{i.category}</span>
                </span>
                <span className="shrink-0 tabular-nums">{baht(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-[15px]">
            <div className="flex justify-between">
              <dt>ราคาสินค้า ({count} ชิ้น)</dt>
              <dd className="tabular-nums">{baht(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>ค่าจัดส่ง</dt>
              <dd className="font-semibold">ฟรี</dd>
            </div>
            <div className="flex items-baseline justify-between pt-3">
              <dt className="text-lg font-bold">ยอดชำระ</dt>
              <dd className="text-right">
                <span className="mr-1.5 text-xs text-muted">THB</span>
                <span className="text-2xl font-bold tabular-nums">{baht(total)}</span>
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </form>
  );
}

function Section({ title, note, children }) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-xl font-bold">{title}</h2>
        {note && <p className="text-sm text-muted">{note}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Input({ id, label, className = '', ...props }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input id={id} placeholder={label} className={`checkout-input ${className}`} {...props} />
    </div>
  );
}

function Chevron({ left = false }) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={left ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  );
}
