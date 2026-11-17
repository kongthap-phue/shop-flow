import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch } from '../../useFetch.js';
import { dateTime } from '../../format.js';
import { ErrorBox, Loading } from '../../components/Status.jsx';
import { Badge, Icon, PageHeader, Panel } from './ui.jsx';

const kindOf = (subject) =>
  subject.startsWith('ออร์เดอร์ใหม่') ? { label: 'ออร์เดอร์ใหม่', tone: 'info', icon: 'cart' } : { label: 'รายงาน', tone: 'neutral', icon: 'bell' };

export default function AdminNotifications() {
  const { data: notifications, error, loading, reload } = useFetch('/local/notifications');
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [openId, setOpenId] = useState(null);

  async function runReport() {
    setRunError('');
    setRunning(true);
    try {
      await api('/local/run-report', { method: 'POST' });
      await reload();
    } catch (err) {
      setRunError(err.message);
    }
    setRunning(false);
  }

  return (
    <>
      <PageHeader
        title="การแจ้งเตือน"
        subtitle="อีเมลที่ระบบส่งถึงแอดมินอัตโนมัติ (ตอนรันในเครื่องแสดงที่หน้านี้แทนการส่งอีเมลจริง)"
        actions={
          <>
            <button className="rounded-lg border border-[#d6d4cc] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#faf9f6]" onClick={reload}>
              รีเฟรช
            </button>
            <button className="btn-primary rounded-lg px-4 py-2" onClick={runReport} disabled={running}>
              {running ? 'กำลังสร้าง…' : 'สร้างรายงานยอดขายตอนนี้'}
            </button>
          </>
        }
      />
      <ErrorBox>{error || runError}</ErrorBox>

      <Panel padded={false}>
        {loading ? (
          <Loading />
        ) : notifications?.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">ยังไม่มีการแจ้งเตือน ลองสั่งซื้อสินค้าหรือกดสร้างรายงานดู</p>
        ) : (
          <ul className="divide-y divide-[#ecebe5]">
            {notifications?.map((n) => {
              const kind = kindOf(n.subject);
              const open = openId === n.id;
              return (
                <li key={n.id}>
                  <button
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[#faf9f6]"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : n.id)}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eeeee9] text-muted">
                      <Icon name={kind.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{n.subject}</span>
                      <span className="text-xs text-muted">{dateTime(n.sentAt)}</span>
                    </span>
                    <Badge tone={kind.tone}>{kind.label}</Badge>
                    <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {open && <pre className="mx-5 mb-4 rounded-lg bg-[#faf9f6] p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{n.message}</pre>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
