import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { useFetch } from '../useFetch.js';
import { baht, categoryColor } from '../format.js';
import { CATEGORY_COPY, HERO, IMAGES } from '../content.js';
import Photo from '../components/Photo.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Confetti, ScallopBadge } from '../components/Decor.jsx';
import { DeliveryScene, EarbudsCase, Mouse, NotebookPencil, OrangeSlice, ToteBag, TShirt, Tumbler } from '../components/Illustrations.jsx';
import { ErrorBox, Loading } from '../components/Status.jsx';

const CATEGORY_ORDER = ['เสื้อผ้า', 'อุปกรณ์ไอที', 'ของใช้', 'เครื่องเขียน'];
const priceText = (p) => baht(p.price).replace('.00', '');

export default function Home() {
  const { data: products, error, loading } = useFetch('/products');
  const list = products ?? [];
  const categories = useMemo(() => {
    const counts = new Map();
    for (const p of list) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const rank = (name) => (CATEGORY_ORDER.includes(name) ? CATEGORY_ORDER.indexOf(name) : 99);
    return [...counts].sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [list]);

  return (
    <>
      <Hero products={list} />
      {error && (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
      {loading ? <Loading /> : <Collections products={list} categories={categories.map(([name]) => name)} />}
      <WhyUs products={list} />
      <QuoteBand />
      <Lifestyle categories={categories} />
      <Delivery />
      <StickerSection />
    </>
  );
}

function Hero({ products }) {
  const { add, items } = useCart();
  const product = products.find((p) => p.name === HERO.productName);
  const inCart = items.find((i) => i.productId === product?.productId)?.qty ?? 0;
  const canAdd = product && product.stock > inCart;

  return (
    <section className="grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center bg-pop px-6 py-16 text-center text-milk sm:px-12 lg:min-h-[min(80vh,640px)]">
        <p className="rise font-semibold text-milk/85">{HERO.eyebrow}</p>
        <h1 className="mt-3 text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[1.15] text-milk">
          {HERO.headline.map((line, i) => (
            <span key={line} className="rise block" style={{ '--d': `${80 + i * 80}ms` }}>
              {line}
            </span>
          ))}
        </h1>
        <p className="rise mt-5 max-w-md text-lg text-milk/90" style={{ '--d': '220ms' }}>
          เก็บความเย็นได้ 24 ชั่วโมง ฝาปิดสนิทไม่หก จุ 900 ml ส่งฟรีถึงบ้าน
        </p>
        <div className="rise mt-8 flex flex-wrap items-center justify-center gap-5" style={{ '--d': '300ms' }}>
          {product ? (
            <button className="btn bg-lime px-9 py-3 text-lg text-forest hover:bg-white" disabled={!canAdd} onClick={() => add(product)}>
              {product.stock === 0 ? 'สินค้าหมด' : !canAdd ? 'อยู่ในตะกร้าแล้ว' : `ใส่ตะกร้า ${priceText(product)}`}
            </button>
          ) : (
            <Link to="/shop" className="btn bg-lime px-9 py-3 text-lg text-forest hover:bg-white">
              ช้อปเลย
            </Link>
          )}
          <Link to={product ? `/products/${product.productId}` : '/shop'} className="font-semibold underline decoration-2 underline-offset-4 hover:text-white">
            ดูรายละเอียด
          </Link>
        </div>
      </div>

      <div className="relative min-h-[26rem] overflow-hidden bg-[#f6c9d6]">
        {product && <img src={product.imageUrl} alt={product.name} className="absolute inset-0 size-full object-cover object-[55%_42%]" />}
        <ScallopBadge className="pop-in absolute top-6 right-6 size-28 text-lg sm:size-32 sm:text-xl" style={{ '--d': '450ms' }}>
          {HERO.seals[0]}
        </ScallopBadge>
        <span className="sticker-cut pop-in absolute bottom-8 left-6 hidden w-24 lg:block" style={{ '--d': '550ms', rotate: '-18deg' }}>
          <OrangeSlice className="w-full" />
        </span>
      </div>
    </section>
  );
}

function Collections({ products, categories }) {
  const [active, setActive] = useState('');
  const rowRef = useRef(null);
  const shown = products.filter((p) => !active || p.category === active);
  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section id="collections" className="scroll-mt-24 bg-milk py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight">ช้อปตามหมวด</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2" role="tablist" aria-label="หมวดสินค้า">
          {['', ...categories].map((c) => (
            <button
              key={c || 'all'}
              role="tab"
              aria-selected={active === c}
              onClick={() => setActive(c)}
              className={`rounded-full border-2 border-forest px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                active === c ? 'bg-forest text-milk' : 'text-forest hover:bg-forest/10'
              }`}
            >
              {c || 'ทั้งหมด'}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          {shown.length} รายการ ส่งฟรีทุกชิ้น
        </p>
      </div>

      <div className="relative mx-auto mt-8 max-w-6xl">
        <div ref={rowRef} className="flex snap-x gap-6 overflow-x-auto scroll-smooth px-4 pt-4 pb-2 [scrollbar-width:none] sm:px-14">
          {shown.map((p) => (
            <div key={p.productId} className="w-56 shrink-0 snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        {[
          [-1, 'left-1', 'M15 6l-6 6 6 6', 'เลื่อนไปทางซ้าย'],
          [1, 'right-1', 'M9 6l6 6-6 6', 'เลื่อนไปทางขวา'],
        ].map(([dir, pos, path, label]) => (
          <button
            key={dir}
            onClick={() => scroll(dir)}
            aria-label={label}
            className={`absolute top-[38%] hidden size-11 place-items-center rounded-full border-2 border-forest bg-milk text-forest transition-colors duration-150 hover:bg-forest hover:text-milk sm:grid ${pos}`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={path} />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}

function WhyUs({ products }) {
  const lineup = products.filter((p) => p.imageKey && p.stock > 0).slice(0, 5);
  return (
    <section
      className="relative overflow-hidden pt-16 text-center sm:pt-20"
      style={{
        background:
          'radial-gradient(ellipse 30% 18% at 20% 22%, rgba(255,255,255,.75), transparent 70%), radial-gradient(ellipse 26% 14% at 78% 30%, rgba(255,255,255,.65), transparent 70%), radial-gradient(ellipse 40% 16% at 55% 8%, rgba(255,255,255,.5), transparent 70%), linear-gradient(180deg,#6fbdf5 0%,#9fd6ff 55%,#d9efff 100%)',
      }}
    >
      <div className="relative mx-auto max-w-2xl px-4">
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight">ทำไมต้อง Shop Flow?</h2>
        <p className="mt-4 text-lg">
          เราคัดของใช้ที่ใช้จริงทุกวัน ทั้งเสื้อผ้า อุปกรณ์ไอที ของใช้ และเครื่องเขียน เลือกเฉพาะรุ่นที่คุ้มราคา แล้วส่งฟรีถึงบ้านทุกออร์เดอร์
        </p>
        <Link to="/shop" className="btn-primary mt-6 px-8">
          ดูสินค้าทั้งหมด
        </Link>
      </div>
      <div className="relative mx-auto mt-12 flex max-w-5xl items-end justify-center px-4 pb-10">
        {lineup.map((p, i) => (
          <Link
            key={p.productId}
            to={`/products/${p.productId}`}
            className="-mx-2 block w-[19%] max-w-44 overflow-hidden rounded-[22px] border-4 border-white shadow-soft-lg transition-[translate] duration-300 ease-(--ease-snap) hover:-translate-y-3 sm:-mx-3"
            style={{ rotate: `${(i - 2) * 3}deg`, translate: `0 ${Math.abs(i - 2) * 10}px`, zIndex: 5 - Math.abs(i - 2) }}
          >
            <Photo src={p.thumbUrl} alt={p.name} color={categoryColor(p.category)} className="aspect-[4/5] w-full" />
          </Link>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white/70" aria-hidden="true" />
    </section>
  );
}

function QuoteBand() {
  return (
    <section className="relative overflow-hidden bg-teal px-4 py-20 text-center text-milk sm:py-28">
      <Confetti />
      <ul className="relative flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold tracking-wide text-milk/75">
        <li>ส่งฟรีทุกออร์เดอร์</li>
        <li>ถึงบ้านใน 1–2 วัน</li>
        <li>ชำระด้วยบัตรได้ทันที</li>
      </ul>
      <p className="relative mx-auto mt-6 max-w-3xl font-fat text-[clamp(1.75rem,3.8vw,2.75rem)] leading-[1.35]">
        ของใช้ที่ใช้จริงทุกวัน คัดมาแล้วว่าคุ้ม และส่งฟรีถึงหน้าบ้านคุณ
      </p>
    </section>
  );
}

function Lifestyle({ categories }) {
  return (
    <section className="bg-milk py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-[clamp(2rem,4.5vw,3rem)] leading-tight">ช้อปตามไลฟ์สไตล์</h2>
        <div className="mt-10 grid gap-x-10 gap-y-14 sm:grid-cols-2">
          {categories.map(([name, count]) => (
            <article key={name} className="text-center">
              <Link to={`/shop?category=${encodeURIComponent(name)}`} className="group relative block">
                <div className="overflow-hidden rounded-3xl shadow-soft">
                  <Photo
                    src={IMAGES.categories[name]}
                    alt={name}
                    color={categoryColor(name)}
                    className="aspect-[4/3] w-full transition-[scale] duration-500 ease-(--ease-snap) group-hover:scale-[1.04]"
                  />
                </div>
                <ScallopBadge className="absolute -top-4 right-6 size-24 text-lg">{`${count}\nรายการ`}</ScallopBadge>
              </Link>
              <h3 className="mt-6 text-[1.75rem] leading-tight">{name}</h3>
              <p className="mx-auto mt-2 max-w-sm text-muted">{CATEGORY_COPY[name] ?? ''}</p>
              <Link to={`/shop?category=${encodeURIComponent(name)}`} className="btn-primary mt-5 px-7">
                ช้อป{name}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Delivery() {
  return (
    <section className="bg-salmon px-4 py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight">ส่งถึงบ้านใน 1–2 วัน</h2>
          <p className="mt-4 max-w-md text-lg">แพ็กอย่างดี ส่งออกทุกวันทำการ ติดตามสถานะได้ที่หน้าคำสั่งซื้อของคุณ</p>
          <Link to="/shop" className="btn-primary mt-6 px-8">
            เริ่มช้อป
          </Link>
        </div>
        <DeliveryScene className="pop-in mx-auto w-full max-w-md drop-shadow-[0_18px_30px_rgba(19,74,64,0.18)]" />
      </div>
    </section>
  );
}

const STICKERS = [
  { Art: TShirt, className: 'top-6 left-[7%] w-40', rotate: '-12deg' },
  { Art: Tumbler, className: 'top-[34%] left-[1%] w-40', rotate: '10deg' },
  { Art: OrangeSlice, className: 'bottom-8 left-[15%] w-32', rotate: '-20deg' },
  { Art: EarbudsCase, className: 'top-4 right-[9%] w-40', rotate: '14deg' },
  { Art: NotebookPencil, className: 'top-[36%] right-[1%] w-40', rotate: '-8deg' },
  { Art: Mouse, className: 'bottom-6 right-[15%] w-36', rotate: '6deg' },
  { Art: ToteBag, className: 'bottom-2 left-[38%] w-24 lg:block', rotate: '-6deg', small: true },
];

function StickerSection() {
  return (
    <section className="relative overflow-hidden bg-milk px-4 py-32 text-center sm:py-44">
      {STICKERS.map(({ Art, className, rotate, small }, i) => (
        <span key={i} className={`sticker-cut absolute hidden ${small ? 'xl:block' : 'md:block'} ${className}`} style={{ rotate }} aria-hidden="true">
          <Art className="w-full" />
        </span>
      ))}

      <div className="relative mx-auto max-w-xl">
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] leading-tight">พร้อมส่งทั่วประเทศ</h2>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-lg font-semibold">
          <li>ส่งฟรี ไม่มีขั้นต่ำ</li>
          <li>ถึงบ้าน 1–2 วัน</li>
          <li>จ่ายด้วยบัตร</li>
        </ul>
        <Link to="/shop" className="btn-primary mt-8 px-9 py-3 text-lg">
          เริ่มช้อป
        </Link>
      </div>
    </section>
  );
}
