import { LOW_STOCK } from '../../format.js';

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-sans text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = '', padded = true }) {
  return (
    <section className={`rounded-xl border border-[#e3e1da] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[#ecebe5] px-5 py-3.5">
          <h2 className="font-sans text-[15px] font-bold">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export const ADMIN_ORDER_STATUS = {
  paid: { label: 'รอจัดส่ง', tone: 'warning' },
  shipped: { label: 'กำลังจัดส่ง', tone: 'info' },
  delivered: { label: 'จัดส่งสำเร็จ', tone: 'good' },
  cancelled: { label: 'ยกเลิก', tone: 'neutral' },
};

const TONES = {
  good: 'bg-[#e3f4e8] text-[#1d6b3a] [--dot:#2e9a55]',
  warning: 'bg-[#fdf1d6] text-[#7a5500] [--dot:#e0a100]',
  critical: 'bg-[#fde4e1] text-[#a1271b] [--dot:#d93a2b]',
  info: 'bg-[#e1edfb] text-[#1f4f8f] [--dot:#3b7ddd]',
  neutral: 'bg-[#eeeee9] text-[#5a5a52] [--dot:#9a9a90]',
};

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>
      <span className="size-1.5 rounded-full bg-(--dot)" aria-hidden="true" />
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const s = ADMIN_ORDER_STATUS[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function StockBadge({ stock }) {
  if (stock === 0) return <Badge tone="critical">หมด</Badge>;
  if (stock <= LOW_STOCK) return <Badge tone="warning">ใกล้หมด</Badge>;
  return <Badge tone="good">มีสินค้า</Badge>;
}

export function SearchBox({ id, value, onChange, placeholder }) {
  return (
    <label htmlFor={id} className="relative block min-w-0 flex-1">
      <span className="sr-only">{placeholder}</span>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="admin-input pl-9" />
    </label>
  );
}

const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  cart: 'M3 4h2.5l2.2 11h10.6L20.5 7H7M9.5 19.5h.01M17 19.5h.01',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  store: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 6l-6 6 6 6',
  close: 'M6 6l12 12M18 6L6 18',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
};

export function Icon({ name, className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
