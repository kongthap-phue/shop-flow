import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth.jsx';
import { ArchLogo } from '../../components/Decor.jsx';
import { Icon } from './ui.jsx';

const NAV = [
  { to: '/admin', end: true, icon: 'home', label: 'ภาพรวม' },
  { to: '/admin/orders', icon: 'cart', label: 'คำสั่งซื้อ' },
  { to: '/admin/products', icon: 'box', label: 'สินค้า' },
  { to: '/admin/notifications', icon: 'bell', label: 'การแจ้งเตือน' },
];

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
    isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'
  }`;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f3f2ee] lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col bg-forest text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Link to="/admin" className="block w-24 text-milk" aria-label="ภาพรวมหลังร้าน">
            <ArchLogo className="w-full" />
          </Link>
          <span className="rounded-md bg-white/12 px-2 py-0.5 text-xs font-semibold text-white/80">หลังร้าน</span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible" aria-label="เมนูหลังร้าน">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <Icon name={item.icon} className="size-[18px] shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
          <a href="/" target="_blank" rel="noreferrer" className={`${navClass({ isActive: false })} lg:mt-4`}>
            <Icon name="store" className="size-[18px] shrink-0" />
            <span className="whitespace-nowrap">ดูหน้าร้าน</span>
            <Icon name="external" className="ml-auto hidden size-3.5 lg:block" />
          </a>
        </nav>

        <div className="hidden border-t border-white/10 px-4 py-4 lg:block">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-white/60">{user?.email}</p>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="mt-3 flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Icon name="logout" className="size-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
