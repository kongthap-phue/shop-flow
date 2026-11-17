import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useCart } from '../cart.jsx';
import { SHOP_NAME } from '../format.js';
import { ANNOUNCEMENTS } from '../content.js';
import { ArchLogo, Wave } from './Decor.jsx';
import CartDrawer from './CartDrawer.jsx';

const navClass = ({ isActive }) =>
  `text-[15px] font-semibold underline-offset-[6px] decoration-2 transition-colors duration-150 hover:text-teal ${
    isActive ? 'underline' : ''
  }`;

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const FULL_BLEED = { '/': 'var(--color-milk)', '/login': 'var(--color-mint)', '/register': 'var(--color-mint)' };
  const fullBleed = pathname in FULL_BLEED;

  if (pathname.startsWith('/admin')) return <Outlet />;

  if (pathname === '/checkout') {
    return (
      <div className="min-h-screen bg-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Announcement />

      <header className="sticky top-0 z-20 border-b border-ink/10 bg-milk/95 text-ink backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2.5">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-1" aria-label="เมนูหลัก">
            <NavLink to="/shop" className={navClass}>
              ช้อป
            </NavLink>
            <a href="/#collections" className="text-[15px] font-semibold hover:text-teal">
              หมวดสินค้า
            </a>
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                หลังร้าน
              </NavLink>
            )}
          </nav>

          <Link to="/" className="block w-28 text-forest transition-colors duration-150 hover:text-teal sm:w-36">
            <ArchLogo className="w-full" />
          </Link>

          <div className="flex items-center justify-end gap-4">
            {user ? (
              <>
                <NavLink to="/orders" className={`${navClass({ isActive: pathname === '/orders' })} hidden sm:inline`}>
                  คำสั่งซื้อ
                </NavLink>
                <button
                  className="text-[15px] font-semibold hover:text-teal"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  title={user.name}
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <NavLink to="/login" className={navClass}>
                เข้าสู่ระบบ
              </NavLink>
            )}
            <button onClick={openCart} className="relative grid size-10 place-items-center rounded-full hover:bg-ink/5" aria-label={`เปิดตะกร้า ${count} ชิ้น`}>
              <CartIcon />
              {count > 0 && (
                <span key={count} className="bump absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-pop px-1 text-[11px] font-bold text-white tabular-nums">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className={fullBleed ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-10'} style={{ background: FULL_BLEED[pathname] }}>
        <Outlet />
      </main>

      <footer className="text-milk">
        <Wave color="var(--color-teal)" background={FULL_BLEED[pathname] ?? 'transparent'} />
        <div className="bg-teal">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-10 pb-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="font-fat text-[clamp(1.9rem,4vw,2.75rem)] leading-tight">
                ของใช้ทุกวัน
                <br />
                ส่งฟรีทุกออร์เดอร์
              </p>
              <Link to="/shop" className="btn mt-6 bg-lime px-7 text-forest hover:bg-white">
                เริ่มช้อป
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <FooterColumn
                title="ช้อป"
                links={[
                  ['/shop', 'สินค้าทั้งหมด'],
                  [`/shop?category=${encodeURIComponent('เสื้อผ้า')}`, 'เสื้อผ้า'],
                  [`/shop?category=${encodeURIComponent('อุปกรณ์ไอที')}`, 'อุปกรณ์ไอที'],
                  [`/shop?category=${encodeURIComponent('ของใช้')}`, 'ของใช้'],
                  [`/shop?category=${encodeURIComponent('เครื่องเขียน')}`, 'เครื่องเขียน'],
                ]}
              />
              <FooterColumn
                title="บัญชีของฉัน"
                links={[
                  ['/orders', 'คำสั่งซื้อ'],
                  ['/cart', 'ตะกร้า'],
                  [user ? '/orders' : '/login', user ? user.name : 'เข้าสู่ระบบ'],
                ]}
              />
            </div>
          </div>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-milk/20 px-4 py-6 text-sm text-milk/80">
            <p>© 2026 {SHOP_NAME}</p>
            <p>โปรเจกต์วิชา IT332 ร้านค้าออนไลน์บน AWS</p>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}

function Announcement() {
  const [i, setI] = useState(0);
  const step = (d) => setI((x) => (x + d + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  return (
    <div className="flex items-center justify-between bg-lime px-2 py-1.5 text-sm font-semibold text-forest">
      <button onClick={() => step(-1)} className="grid size-7 place-items-center rounded-full hover:bg-forest/10" aria-label="ข้อความก่อนหน้า">
        <Chevron dir="left" />
      </button>
      <p key={i} className="rise text-center" aria-live="polite">
        {ANNOUNCEMENTS[i]}
      </p>
      <button onClick={() => step(1)} className="grid size-7 place-items-center rounded-full hover:bg-forest/10" aria-label="ข้อความถัดไป">
        <Chevron dir="right" />
      </button>
    </div>
  );
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2.5l2.2 11h10.6L20.5 7H7" />
      <circle cx="9.5" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </svg>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="font-fat text-lg">{title}</p>
      <ul className="mt-3 space-y-2 text-milk/85">
        {links.map(([to, label]) => (
          <li key={label}>
            <Link to={to} className="hover:text-white hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
