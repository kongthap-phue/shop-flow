import { Link } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { baht, LOW_STOCK } from '../format.js';
import ProductImage from './ProductImage.jsx';
import { ScallopBadge } from './Decor.jsx';

export default function ProductCard({ product }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.productId === product.productId)?.qty ?? 0;
  const soldOut = product.stock === 0;
  const canAdd = product.stock > inCart;

  return (
    <article className="group flex flex-col text-center">
      <Link to={`/products/${product.productId}`} className="relative block">
        <div className="overflow-hidden rounded-3xl shadow-soft">
          <ProductImage
            product={product}
            className={`aspect-[4/5] w-full transition-[scale] duration-500 ease-(--ease-snap) group-hover:scale-[1.04] ${soldOut ? 'grayscale' : ''}`}
          />
        </div>
        {soldOut ? (
          <ScallopBadge color="#ffffff" className="absolute -top-3 -right-3 size-16 text-[13px]">
            {'หมด\nแล้ว'}
          </ScallopBadge>
        ) : product.stock <= LOW_STOCK ? (
          <ScallopBadge color="var(--color-teal)" textColor="var(--color-milk)" className="absolute -top-3 -right-3 size-16 text-[13px]">
            {`เหลือ\n${product.stock}`}
          </ScallopBadge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <p className="text-sm font-semibold text-muted">{product.category}</p>
        <Link to={`/products/${product.productId}`} className="mt-0.5 line-clamp-2 min-h-[2.6em] font-fat text-lg leading-snug hover:text-teal">
          {product.name}
        </Link>
        <p className="mt-1 text-lg font-bold tabular-nums">{baht(product.price).replace('.00', '')}</p>
        <button className="btn-primary mt-3 w-full" disabled={!canAdd} onClick={() => add(product)}>
          {soldOut ? 'สินค้าหมด' : !canAdd ? 'ใส่ครบจำนวนแล้ว' : inCart ? `เพิ่มอีกชิ้น (มี ${inCart})` : 'ใส่ตะกร้า'}
        </button>
      </div>
    </article>
  );
}
