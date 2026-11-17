import { SHOP_NAME } from '../format.js';

export function Wave({ color, background = 'transparent', className = '' }) {
  return (
    <div style={{ background }} className={className}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-8 w-full sm:h-12" aria-hidden="true">
        <path d="M0,38 C240,0 480,0 720,26 C960,52 1200,58 1440,20 L1440,60 L0,60 Z" fill={color} />
      </svg>
    </div>
  );
}

const CONFETTI = [
  ['circle', 'top-[14%] left-[6%]', 'size-4', '#ffd84a'],
  ['star', 'top-[8%] left-[12%]', 'size-9', '#ff5c7a'],
  ['circle', 'top-[40%] left-[4%]', 'size-6', '#9fd6ff'],
  ['circle', 'bottom-[18%] left-[9%]', 'size-8', '#ffffff'],
  ['circle', 'bottom-[30%] left-[16%]', 'size-3', '#ff5c7a'],
  ['circle', 'top-[12%] right-[8%]', 'size-5', '#c9b0ff'],
  ['circle', 'top-[30%] right-[14%]', 'size-3', '#ff8a3d'],
  ['star', 'bottom-[22%] right-[10%]', 'size-8', '#ff9fd6'],
  ['circle', 'bottom-[12%] right-[18%]', 'size-6', '#ffd84a'],
  ['circle', 'top-[52%] right-[5%]', 'size-7', '#9fd6ff'],
];

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      {CONFETTI.map(([shape, pos, size, color], i) =>
        shape === 'circle' ? (
          <span key={i} className={`absolute rounded-full border-2 border-forest ${pos} ${size}`} style={{ background: color }} />
        ) : (
          <svg key={i} viewBox="0 0 24 24" className={`absolute ${pos} ${size}`}>
            <path
              d="M12 1.5l3 6.6 7.1.8-5.3 4.8 1.5 7-6.3-3.6-6.3 3.6 1.5-7L1.9 8.9 9 8.1z"
              fill={color}
              stroke="var(--color-forest)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        ),
      )}
    </div>
  );
}

export function ScallopBadge({ children, color = 'var(--color-sun)', textColor = 'var(--color-forest)', className = '', style }) {
  const points = Array.from({ length: 32 }, (_, i) => {
    const r = i % 2 ? 44 : 50;
    const a = (i / 32) * Math.PI * 2;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <span className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} grid place-items-center ${className}`} style={{ color: textColor, ...style }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <polygon points={points} fill={color} />
      </svg>
      <span className="relative text-center leading-[1.1] font-bold whitespace-pre-line">{children}</span>
    </span>
  );
}

export function ArchLogo({ className = '' }) {
  const text = SHOP_NAME.toUpperCase();
  return (
    <svg viewBox="0 0 260 74" className={className} role="img" aria-label={SHOP_NAME}>
      <path id="logo-arch" d="M10,68 Q130,0 250,68" fill="none" />
      <text className="font-fat" fontSize="30" fill="currentColor" textAnchor="middle" letterSpacing="1">
        <textPath href="#logo-arch" startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  );
}
