import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useFetch } from '../../useFetch.js';
import { baht, categoryColor, LOW_STOCK } from '../../format.js';
import ProductImage from '../../components/ProductImage.jsx';
import { ErrorBox, Loading } from '../../components/Status.jsx';
import { Icon, PageHeader, Panel, SearchBox, StockBadge } from './ui.jsx';

const STOCK_FILTERS = [
  ['', 'ทุกสต็อก'],
  ['low', 'ใกล้หมด'],
  ['out', 'หมด'],
];

export default function AdminProducts() {
  const { data: products, setData, error, loading } = useFetch('/products');
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [actionError, setActionError] = useState('');
  const stock = params.get('stock') ?? '';

  const categories = useMemo(() => [...new Set((products ?? []).map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'th')), [products]);
  const visible = (products ?? []).filter((p) => {
    if (category && p.category !== category) return false;
    if (stock === 'low' && !(p.stock > 0 && p.stock <= LOW_STOCK)) return false;
    if (stock === 'out' && p.stock !== 0) return false;
    return !q || p.name.toLowerCase().includes(q.trim().toLowerCase());
  });

  async function remove(id) {
    setActionError('');
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      setData(products.filter((p) => p.productId !== id));
    } catch (err) {
      setActionError(err.message);
    }
    setConfirmId(null);
  }

  const setStock = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('stock', value);
    else next.delete('stock');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="สินค้า"
        subtitle={products ? `ทั้งหมด ${products.length} รายการ ใน ${categories.length} หมวด` : undefined}
        actions={
          <Link to="/admin/products/new" className="btn-primary rounded-lg px-4 py-2">
            <Icon name="plus" className="size-4" />
            เพิ่มสินค้า
          </Link>
        }
      />
      <ErrorBox>{error || actionError}</ErrorBox>

      <Panel padded={false}>
        <div className="flex flex-wrap gap-2 border-b border-[#ecebe5] p-3">
          <SearchBox id="product-search" value={q} onChange={setQ} placeholder="ค้นหาชื่อสินค้า" />
          <select id="product-category" aria-label="กรองตามหมวด" className="admin-input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select id="product-stock" aria-label="กรองตามสต็อก" className="admin-input w-auto" value={stock} onChange={(e) => setStock(e.target.value)}>
            {STOCK_FILTERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#faf9f6] text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">สินค้า</th>
                  <th className="px-3 py-2.5 font-semibold">หมวด</th>
                  <th className="px-3 py-2.5 text-right font-semibold">ราคา</th>
                  <th className="px-3 py-2.5 text-right font-semibold">สต็อก</th>
                  <th className="px-3 py-2.5 font-semibold">สถานะ</th>
                  <th className="px-5 py-2.5" aria-label="จัดการ" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ecebe5]">
                {visible.map((p) => (
                  <tr key={p.productId} className="hover:bg-[#faf9f6]">
                    <td className="px-5 py-2.5">
                      <Link to={`/admin/products/${p.productId}`} className="flex items-center gap-3 font-semibold hover:underline">
                        <ProductImage product={p} glyphClass="text-base" className="size-10 shrink-0 rounded-md border border-[#ecebe5]" />
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <span className="size-2 rounded-full" style={{ background: categoryColor(p.category) }} aria-hidden="true" />
                        {p.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{baht(p.price)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{p.stock}</td>
                    <td className="px-3 py-2.5">
                      <StockBadge stock={p.stock} />
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {confirmId === p.productId ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-muted">ลบสินค้านี้?</span>
                          <button className="rounded-md bg-pop px-2.5 py-1 text-xs font-semibold text-white" onClick={() => remove(p.productId)}>
                            ลบ
                          </button>
                          <button className="rounded-md border border-[#d6d4cc] px-2.5 py-1 text-xs font-semibold" onClick={() => setConfirmId(null)}>
                            ยกเลิก
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-4 text-sm font-semibold">
                          <Link to={`/admin/products/${p.productId}`} className="text-teal hover:underline">
                            แก้ไข
                          </Link>
                          <button className="text-muted hover:text-pop" onClick={() => setConfirmId(p.productId)}>
                            ลบ
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
