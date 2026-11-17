import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/Status.jsx';
import AuthShell, { Field, outlineButton } from '../components/AuthShell.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = params.get('next');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate(next || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const options = [
    {
      question: 'มีบัญชีอยู่แล้ว?',
      action: (
        <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className={outlineButton}>
          เข้าสู่ระบบ
        </Link>
      ),
    },
    {
      question: 'ยังไม่พร้อมสมัคร?',
      action: (
        <Link to="/shop" className={outlineButton}>
          ดูสินค้าก่อน
        </Link>
      ),
    },
  ];

  return (
    <AuthShell title="สมัครสมาชิก" options={options}>
      <form onSubmit={submit} className="space-y-5">
        <Field id="reg-name" label="ชื่อ" autoComplete="name" value={form.name} onChange={set('name')} />
        <Field id="reg-email" label="อีเมล" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        <Field
          id="reg-password"
          label="รหัสผ่าน"
          type="password"
          minLength={8}
          autoComplete="new-password"
          hint="อย่างน้อย 8 ตัวอักษร"
          value={form.password}
          onChange={set('password')}
        />
        <ErrorBox>{error}</ErrorBox>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button className="btn-primary min-w-52 py-3" disabled={busy}>
            {busy ? 'กำลังสมัคร…' : 'สมัครสมาชิก'}
          </button>
          <Link to="/shop" className="font-semibold underline underline-offset-4 hover:text-teal">
            กลับไปช้อปต่อ
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
