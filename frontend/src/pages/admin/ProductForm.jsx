import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, uploadImage } from '../../api.js';
import { useFetch } from '../../useFetch.js';
import { ErrorBox, Loading } from '../../components/Status.jsx';
import { Icon, PageHeader, Panel, StockBadge } from './ui.jsx';

const EMPTY = { name: '', category: '', price: '', stock: '', description: '', imageKey: null };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { data: allProducts } = useFetch('/products');
  const categories = [...new Set((allProducts ?? []).map((p) => p.category))];

  useEffect(() => {
    if (!isEdit) return;
    api(`/products/${id}`)
      .then((p) => {
        setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), description: p.description, imageKey: p.imageKey });
        setPreview(p.imageUrl);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const imageKey = await uploadImage(file);
      setForm((f) => ({ ...f, imageKey }));
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
      await api(isEdit ? `/products/${id}` : '/products', { method: isEdit ? 'PUT' : 'POST', body });
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  const stock = Number(form.stock);
  const field = 'mb-1.5 block text-sm font-semibold';

  return (
    <form onSubmit={submit}>
      <PageHeader
        back={
          <Link to="/admin/products" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
            <Icon name="back" className="size-4" />
            สินค้า
          </Link>
        }
        title={isEdit ? form.name || 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
        actions={
          <>
            <Link to="/admin/products" className="rounded-lg border border-[#d6d4cc] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#faf9f6]">
              ยกเลิก
            </Link>
            <button className="btn-primary rounded-lg px-5 py-2" disabled={saving || uploading}>
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </>
        }
      />
      <ErrorBox>{error}</ErrorBox>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Panel title="ข้อมูลสินค้า">
            <div className="space-y-4">
              <div>
                <label htmlFor="product-name" className={field}>ชื่อสินค้า</label>
                <input id="product-name" className="admin-input" required value={form.name} onChange={set('name')} placeholder="เช่น เสื้อยืด Cotton 100%" />
              </div>
              <div>
                <label htmlFor="product-description" className={field}>รายละเอียด</label>
                <textarea id="product-description" className="admin-input min-h-32" value={form.description} onChange={set('description')} placeholder="วัสดุ ขนาด จุดเด่นของสินค้า" />
              </div>
            </div>
          </Panel>

          <Panel title="ราคาและสต็อก">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product-price" className={field}>ราคา</label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">฿</span>
                  <input id="product-price" type="number" min="0" step="0.01" className="admin-input pl-7 tabular-nums" required value={form.price} onChange={set('price')} />
                </div>
              </div>
              <div>
                <label htmlFor="product-stock" className={field}>จำนวนในสต็อก</label>
                <input id="product-stock" type="number" min="0" step="1" className="admin-input tabular-nums" required value={form.stock} onChange={set('stock')} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="สถานะ">
            {form.stock === '' ? <p className="text-sm text-muted">ใส่จำนวนสต็อกเพื่อดูสถานะ</p> : <StockBadge stock={stock} />}
            <p className="mt-2 text-xs text-muted">สต็อกจะถูกตัดอัตโนมัติเมื่อมีคำสั่งซื้อใหม่ และคืนเมื่อยกเลิกคำสั่งซื้อ</p>
          </Panel>

          <Panel title="รูปสินค้า">
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#d6d4cc] bg-[#faf9f6]">
              {preview ? <img src={preview} alt="" className="size-full object-cover" /> : <span className="text-sm text-muted">ยังไม่มีรูป</span>}
            </div>
            <label htmlFor="product-image" className="mt-3 flex w-full cursor-pointer justify-center rounded-lg border border-[#d6d4cc] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#faf9f6]">
              {uploading ? 'กำลังอัปโหลด…' : preview ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
            </label>
            <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} disabled={uploading} />
            <p className="mt-2 text-xs text-muted">JPG, PNG หรือ WEBP ระบบย่อเป็นรูปการ์ด 4:5 ให้อัตโนมัติ</p>
          </Panel>

          <Panel title="การจัดหมวด">
            <label htmlFor="product-category" className={field}>หมวดสินค้า</label>
            <input id="product-category" list="category-options" className="admin-input" value={form.category} onChange={set('category')} placeholder="เลือกหรือพิมพ์หมวดใหม่" />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Panel>
        </div>
      </div>
    </form>
  );
}
