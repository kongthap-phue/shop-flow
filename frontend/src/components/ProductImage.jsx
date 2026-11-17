import { useState } from 'react';
import { categoryColor } from '../format.js';

export default function ProductImage({ product, full = false, className = '', glyphClass = 'text-[clamp(3rem,9vw,5.5rem)]' }) {
  const sources = (full ? [product.imageUrl] : [product.thumbUrl, product.imageUrl]).filter(Boolean);
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ background: categoryColor(product.category) }}>
        <span className={`font-display font-bold leading-none ${glyphClass}`} aria-hidden="true">
          {product.name?.replace(/^[เแโใไ]/, '')[0]}
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      className={`object-cover ${className}`}
      style={{ background: categoryColor(product.category) }}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
