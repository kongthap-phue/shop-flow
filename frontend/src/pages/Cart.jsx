import { Link } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { baht } from '../format.js';
import CartLine, { FreeShippingBar } from '../components/CartLine.jsx';

export default function Cart() {
  const { items, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[clamp(2rem,6vw,3rem)] leading-tight">ตะกร้ายังว่างอยู่</h1>
        <p className="mt-3 text-muted">เลือกของใช้ที่ชอบใส่ตะกร้าได้เลย ส่งฟรีทุกออร์เดอร์</p>
        <Link to="/shop" className="btn-primary mt-7 px-9 py-3 text-lg">
          เริ่มช้อป
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-center text-[clamp(2.25rem,5vw,3.25rem)] leading-tight">ตะกร้าของคุณ</h1>
      <div className="mx-auto mt-5 max-w-sm">
        <FreeShippingBar />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="sr-only">รายการสินค้า</h2>
          <ul className="space-y-6 divide-y divide-ink/10 [&>li:not(:first-child)]:pt-6">
            {items.map((item) => (
              <CartLine key={item.productId} item={item} />
            ))}
          </ul>
        </section>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-2xl">สรุปยอด</h2>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between">
              <dt>ราคาสินค้า ({count} ชิ้น)</dt>
              <dd className="tabular-nums">{baht(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>ค่าจัดส่ง</dt>
              <dd className="font-semibold">ฟรี</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
              <dt className="font-fat text-lg">ยอดรวม</dt>
              <dd className="text-2xl font-bold tabular-nums">{baht(total)}</dd>
            </div>
          </dl>
          <Link to="/checkout" className="btn-primary mt-5 w-full py-3.5 text-lg">
            ไปชำระเงิน
          </Link>
          <Link to="/shop" className="mt-3 block text-center text-sm font-semibold underline underline-offset-4 hover:text-teal">
            เลือกซื้อสินค้าต่อ
          </Link>
        </aside>
      </div>
    </div>
  );
}
