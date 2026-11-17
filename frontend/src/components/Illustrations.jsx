const FOREST = '#0f3f37';

export function OrangeSlice({ className = '' }) {
  const segments = 10;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#ff8a1f" />
      <circle cx="50" cy="50" r="41" fill="#ffe7ba" />
      {Array.from({ length: segments }, (_, i) => {
        const a1 = (i / segments) * Math.PI * 2 + 0.06;
        const a2 = ((i + 1) / segments) * Math.PI * 2 - 0.06;
        const r = 36;
        const p = (a, rr) => `${50 + rr * Math.cos(a)},${50 + rr * Math.sin(a)}`;
        return (
          <g key={i}>
            <path d={`M${p(a1, 5)} L${p(a1, r)} A${r},${r} 0 0 1 ${p(a2, r)} L${p(a2, 5)} Z`} fill="#ffa53a" />
            <path d={`M${p(a1 + 0.08, 12)} L${p(a1 + 0.08, r - 8)} A${r - 8},${r - 8} 0 0 1 ${p(a2 - 0.08, r - 8)} L${p(a2 - 0.08, 12)} Z`} fill="#ffbd5e" />
          </g>
        );
      })}
      <circle cx="50" cy="50" r="5" fill="#fff4dc" />
      <ellipse cx="62" cy="40" rx="2.4" ry="4" fill="#fff4dc" transform="rotate(35 62 40)" />
      <ellipse cx="40" cy="63" rx="2.4" ry="4" fill="#fff4dc" transform="rotate(35 40 63)" />
      <path d="M18 34 A36 36 0 0 1 40 12" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function TShirt({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M38 18 L50 13 C54 21 66 21 70 13 L82 18 L106 38 L93 55 L84 48 L84 104 C70 109 50 109 36 104 L36 48 L27 55 L14 38 Z" fill="#ffd84a" />
      <path d="M82 18 L106 38 L93 55 L84 48 Z" fill="#f4c22e" />
      <path d="M84 48 L84 104 C79 106 75 107 70 107 L72 44 Z" fill="#f4c22e" />
      <path d="M50 13 C54 23 66 23 70 13" fill="none" stroke="#e3a91a" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 70 C54 62 46 66 50 73 L60 82 L70 73 C74 66 66 62 60 70 Z" fill="#ff5c7a" />
      <path d="M44 30 L44 56" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Tumbler({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g transform="rotate(14 72 22)">
        <rect x="68" y="2" width="7" height="34" rx="3.5" fill="#fff" />
        <rect x="68" y="8" width="7" height="4" fill="#ff7a9c" />
        <rect x="68" y="18" width="7" height="4" fill="#ff7a9c" />
      </g>
      <rect x="40" y="21" width="40" height="7" rx="3.5" fill="#ff7a9c" />
      <rect x="36" y="26" width="48" height="13" rx="4" fill="#ff8fab" />
      <path d="M38 38 L82 38 L77 106 C72 112 48 112 43 106 Z" fill="#ffb3c7" />
      <path d="M70 38 L82 38 L77 106 C75 109 72 110 68 110 Z" fill="#ff9fb8" />
      <rect x="46" y="44" width="5" height="52" rx="2.5" fill="#fff" fillOpacity="0.6" />
      <circle cx="61" cy="66" r="6" fill="#ff8fab" />
    </svg>
  );
}

export function EarbudsCase({ className = '' }) {
  const bud = (x, y, r) => (
    <g transform={`rotate(${r} ${x} ${y})`}>
      <rect x={x - 3.5} y={y} width="7" height="22" rx="3.5" fill="#fff" />
      <circle cx={x} cy={y} r="9" fill="#fff" />
      <circle cx={x + 3} cy={y + 2} r="3.5" fill="#e6dcff" />
    </g>
  );
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {bud(34, 22, -24)}
      {bud(86, 18, 22)}
      <rect x="22" y="46" width="76" height="58" rx="26" fill="#c9b0ff" />
      <path d="M22 66 L98 66" stroke="#a98be8" strokeWidth="3" />
      <path d="M86 50 C94 58 98 70 96 84 C94 96 86 102 76 104 L90 104 C98 98 98 84 98 72 C98 62 94 54 86 50 Z" fill="#b498f0" />
      <circle cx="60" cy="80" r="2.6" fill="#6fe39a" />
      <path d="M34 54 C30 60 30 72 32 82" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Mouse({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <g transform="rotate(-18 60 60)">
        <path d="M60 12 C83 12 93 34 93 60 C93 91 79 108 60 108 C41 108 27 91 27 60 C27 34 37 12 60 12 Z" fill="#5b7cff" />
        <path d="M74 16 C86 24 93 40 93 60 C93 91 79 108 60 108 C74 100 82 84 82 60 C82 40 79 26 74 16 Z" fill="#4565ea" />
        <path d="M29 48 C46 53 74 53 91 48" stroke="#3a56d4" strokeWidth="3" fill="none" />
        <path d="M60 12 L60 51" stroke="#3a56d4" strokeWidth="3" />
        <rect x="55.5" y="22" width="9" height="16" rx="4.5" fill="#1d2a6b" />
        <path d="M38 34 C34 44 34 56 36 64" stroke="#fff" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function NotebookPencil({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="30" y="16" width="62" height="86" rx="6" fill="#fff1db" />
      <rect x="24" y="12" width="62" height="86" rx="6" fill="#00806a" />
      <rect x="24" y="12" width="11" height="86" rx="4" fill="#006b59" />
      <rect x="74" y="12" width="5" height="86" fill="#ff5c7a" />
      <rect x="42" y="32" width="26" height="14" rx="3" fill="#fff1db" />
      <g transform="rotate(-38 82 84)">
        <rect x="52" y="79" width="8" height="10" rx="2" fill="#ff8fab" />
        <rect x="59" y="79" width="5" height="10" fill="#c9c9c9" />
        <rect x="63" y="79" width="44" height="10" fill="#ffd84a" />
        <rect x="63" y="84" width="44" height="5" fill="#f4c22e" />
        <polygon points="107,79 119,84 107,89" fill="#f3d3a2" />
        <polygon points="115,82.3 119,84 115,85.7" fill={FOREST} />
      </g>
    </svg>
  );
}

export function ToteBag({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M42 48 C42 16 64 16 64 48" fill="none" stroke="#e2c690" strokeWidth="6" strokeLinecap="round" />
      <path d="M56 48 C56 18 80 18 80 48" fill="none" stroke="#eed6a6" strokeWidth="6" strokeLinecap="round" />
      <path d="M22 44 L98 44 L92 108 L28 108 Z" fill="#f6e4c2" />
      <path d="M80 44 L98 44 L92 108 L78 108 Z" fill="#ead2a6" />
      <circle cx="58" cy="76" r="13" fill="#00806a" />
      <path d="M50 76 C53 82 63 82 66 76" stroke="#f6e4c2" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="53" cy="71" r="1.8" fill="#f6e4c2" />
      <circle cx="63" cy="71" r="1.8" fill="#f6e4c2" />
    </svg>
  );
}

const RAY_COLORS = ['#ffd84a', '#9fd6ff', '#ff9fb0', '#00806a', '#ffbe7a', '#c9b0ff'];

export function DeliveryScene({ className = '' }) {
  const rays = 22;
  const cx = 0;
  const cy = 22;
  return (
    <svg viewBox="-100 -100 200 200" className={className} role="img" aria-label="ภาพวาดรถส่งของขนกล่องพัสดุ">
      <defs>
        <clipPath id="scene-clip">
          <circle r="96" />
        </clipPath>
      </defs>
      <g clipPath="url(#scene-clip)">
        <rect x="-100" y="-100" width="200" height="200" fill="#fff4e8" />
        {Array.from({ length: rays }, (_, i) => {
          const a1 = (i / rays) * Math.PI * 2;
          const a2 = ((i + 1) / rays) * Math.PI * 2;
          const am = (a1 + a2) / 2;
          const p = (a, r) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
          const deco = i % 3;
          return (
            <g key={i}>
              <path d={`M${cx},${cy} L${p(a1, 200)} L${p(a2, 200)} Z`} fill={RAY_COLORS[i % RAY_COLORS.length]} stroke={FOREST} strokeWidth="0.8" />
              {deco === 0 && <circle cx={cx + 70 * Math.cos(am)} cy={cy + 70 * Math.sin(am)} r="3" fill="#fff" stroke={FOREST} strokeWidth="0.8" />}
              {deco === 1 && (
                <path
                  transform={`translate(${cx + 82 * Math.cos(am)} ${cy + 82 * Math.sin(am)})`}
                  d="M0,-5 L1.4,-1.4 L5,0 L1.4,1.4 L0,5 L-1.4,1.4 L-5,0 L-1.4,-1.4 Z"
                  fill="#fff"
                  stroke={FOREST}
                  strokeWidth="0.7"
                />
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="30" fill="#ffd84a" stroke={FOREST} strokeWidth="1.5" />
        <g fill="#fff" stroke={FOREST} strokeWidth="1.2">
          <path d="M-74,-28 a10,10 0 0 1 18,-6 a12,12 0 0 1 22,4 a8,8 0 0 1 2,16 h-40 a8,8 0 0 1 -2,-14 z" />
          <path d="M40,-46 a9,9 0 0 1 16,-5 a11,11 0 0 1 20,4 a7,7 0 0 1 1,14 h-36 a7,7 0 0 1 -1,-13 z" />
        </g>
        <path d="M-100,52 C-50,34 40,36 100,50 L100,100 L-100,100 Z" fill="#7ccf8a" stroke={FOREST} strokeWidth="1.5" />
        <path d="M-100,70 C-30,58 50,60 100,72 L100,100 L-100,100 Z" fill="#5bb873" />
        <path d="M-100,84 L100,84" stroke="#fff4e8" strokeWidth="3" strokeDasharray="10 8" />

        <g transform="translate(-54 26)" stroke={FOREST} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M-22,8 h12 M-26,18 h16 M-20,28 h10" strokeLinecap="round" fill="none" />
          <rect x="0" y="0" width="66" height="42" rx="4" fill="#fff4e8" />
          <rect x="0" y="27" width="66" height="7" fill="#00806a" strokeWidth="0" />
          <g transform="translate(22 6)">
            <rect x="0" y="0" width="20" height="16" rx="1.5" fill="#e7b77a" strokeWidth="1.6" />
            <path d="M0,5 h20 M10,0 v16" strokeWidth="1.4" fill="none" />
          </g>
          <path d="M66,10 L88,10 L102,26 L102,42 L66,42 Z" fill="#e3173e" />
          <path d="M72,15 L86,15 L95,26 L72,26 Z" fill="#9fd6ff" strokeWidth="1.8" />
          <circle cx="16" cy="44" r="9" fill={FOREST} />
          <circle cx="16" cy="44" r="3.5" fill="#fff4e8" strokeWidth="0" />
          <circle cx="84" cy="44" r="9" fill={FOREST} />
          <circle cx="84" cy="44" r="3.5" fill="#fff4e8" strokeWidth="0" />
        </g>
        <g transform="translate(58 34)" stroke={FOREST} strokeWidth="1.8" strokeLinejoin="round">
          <rect x="0" y="12" width="24" height="20" rx="1.5" fill="#d9a066" />
          <rect x="4" y="-4" width="18" height="16" rx="1.5" fill="#e7b77a" />
          <path d="M0,18 h24 M12,12 v20 M4,2 h18" fill="none" strokeWidth="1.4" />
        </g>
      </g>
      <circle r="96" fill="none" stroke={FOREST} strokeWidth="3" />
    </svg>
  );
}
