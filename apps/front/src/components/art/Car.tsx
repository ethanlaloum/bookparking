/**
 * Une voiture vue du dessus, capot vers +x, centrée sur l'origine : 100 × 52.
 * Pointer vers +x est ce qu'attend `animateMotion rotate="auto"` — la voiture
 * s'oriente alors d'elle-même le long de sa trajectoire. Une voiture garée se
 * tourne par un `rotate()` sur son groupe parent.
 */
export const Car = ({ color }: { color: string }) => (
  <g>
    <rect x="-50" y="-26" width="100" height="52" rx="15" fill={color} />
    <rect x="11" y="-31" width="8" height="6" rx="2" fill={color} />
    <rect x="11" y="25" width="8" height="6" rx="2" fill={color} />
    <path d="M22 -19 Q31 0 22 19 L9 15.5 Q13 0 9 -15.5 Z" fill="#0b0d12" opacity="0.82" />
    <rect x="-22" y="-16" width="29" height="32" rx="7" fill="#ffffff" opacity="0.14" />
    <path
      d="M-25 -16.5 L-37 -18 Q-42 0 -37 18 L-25 16.5 Q-28 0 -25 -16.5 Z"
      fill="#0b0d12"
      opacity="0.74"
    />
    <rect x="44" y="-20" width="4" height="10" rx="2" fill="#fff6c2" />
    <rect x="44" y="10" width="4" height="10" rx="2" fill="#fff6c2" />
    <rect x="-49" y="-20" width="3" height="9" rx="1.5" fill="#ff5a4f" />
    <rect x="-49" y="11" width="3" height="9" rx="1.5" fill="#ff5a4f" />
  </g>
);

/** Le panneau P, 32 × 32, à placer par un `translate` / `scale` parent. */
export const ParkingGlyph = ({ fill = '#1f46e0' }: { fill?: string }) => (
  <g>
    <rect width="32" height="32" rx="7" fill={fill} />
    <path
      d="M11 24V8h6.4c3.5 0 5.6 2 5.6 5.1s-2.1 5.2-5.6 5.2h-2.6V24H11zm3.8-8.6h2.2c1.6 0 2.6-.9 2.6-2.3s-1-2.2-2.6-2.2h-2.2v4.5z"
      fill="#ffffff"
    />
  </g>
);
