import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/Status.jsx';
import AuthShell, { Field, outlineButton } from '../components/AuthShell.jsx';

const DEMO_ACCOUNTS = [
  ['ลูกค้า', 'customer@shop.local', 'customer1234'],
  ['แอดมิน', 'admin@shop.local', 'admin1234'],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = params.get('next');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(next || (user.groups.includes('admin') ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const options = [
    {
      question: 'ยังไม่มีบัญชี?',
      action: (
        <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className={outlineButton}>
          สมัครสมาชิก
        </Link>
      ),
    },
    import.meta.env.DEV
      ? {
          question: 'อยากลองก่อน? ใช้บัญชีทดลอง',
          action: (
            <div className="flex flex-wrap justify-center gap-2">
              {DEMO_ACCOUNTS.map(([label, demoEmail, demoPassword]) => (
                <button
                  key={label}
                  type="button"
                  className={`${outlineButton} px-4 py-1.5 text-sm`}
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword(demoPassword);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ),
        }
      : {
          question: 'ยังไม่พร้อมเข้าสู่ระบบ?',
          action: (
            <Link to="/shop" className={outlineButton}>
              ดูสินค้าก่อน
            </Link>
          ),
        },
  ];

  return (
    <AuthShell title="เข้าสู่ระบบ" options={options}>
      <form onSubmit={submit} className="space-y-5">
        <Field id="login-email" label="อีเมล" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          id="login-password"
          label="รหัสผ่าน"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorBox>{error}</ErrorBox>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button className="btn-primary min-w-52 py-3" disabled={busy}>
            {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
          <Link to="/shop" className="font-semibold underline underline-offset-4 hover:text-teal">
            กลับไปช้อปต่อ
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
