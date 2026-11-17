import { useState } from 'react';

export default function Photo({ src, alt = '', className = '', color = 'var(--color-grape)', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={className} style={{ background: color }} role={alt ? 'img' : undefined} aria-label={alt || undefined} />;
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      className={`object-cover ${className}`}
      style={{ background: color }}
      onError={() => setFailed(true)}
    />
  );
}
