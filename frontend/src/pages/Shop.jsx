import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../useFetch.js';
import ProductCard from '../components/ProductCard.jsx';
import { ErrorBox, Loading } from '../components/Status.jsx';

export default function Shop() {
  const { data: products, error, loading } = useFetch('/products');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';

  const categories = useMemo(() => [...new Set((products ?? []).map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'th')), [products]);

  const visible = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return (products ?? []).filter(
      (p) => (!category || p.category === category) && (!keyword || `${p.name} ${p.description}`.toLowerCase().includes(keyword)),
    );
  }, [products, q, category]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-tight">{category || 'สินค้าทั้งหมด'}</h1>
          {!loading && <p className="mt-1 text-muted">{visible.length} รายการ ส่งฟรีทุกชิ้น</p>}
        </div>
        <input
          id="search"
          type="search"
          className="input sm:max-w-xs"
          placeholder="ค้นหาสินค้า เช่น หูฟัง"
          value={q}
          onChange={(e) => update('q', e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['', ...categories].map((c) => {
          const active = category === c;
          return (
            <button
              key={c || 'all'}
              onClick={() => update('category', c)}
              aria-pressed={active}
              className={`rounded-full border-2 border-forest px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                active ? 'bg-forest text-milk' : 'text-forest hover:bg-forest/10'
              }`}
            >
              {c || 'ทั้งหมด'}
            </button>
          );
        })}
      </div>

      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : visible.length === 0 ? (
        <div className="rounded-[26px] bg-milk px-6 py-14 text-center">
          <p className="font-display text-xl">ไม่พบสินค้าที่ตรงกับ "{q || category}"</p>
          <button className="btn-secondary mt-5" onClick={() => setParams({}, { replace: true })}>
            ล้างการค้นหา
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.productId} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
