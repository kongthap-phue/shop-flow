import { ORDER_STATUS } from '../format.js';

export function StatusPill({ status }) {
  const s = ORDER_STATUS[status] ?? { label: status, className: 'bg-white' };
  return (
    <span className={`inline-block rounded-full border border-ink/20 px-3 py-0.5 font-display text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-2xl border border-ink/20 bg-alert px-4 py-2.5 text-sm font-medium" role="alert">
      {children}
    </p>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="กำลังโหลด">
      <span className="size-9 animate-spin rounded-full border-4 border-ink border-t-pop" />
    </div>
  );
}
