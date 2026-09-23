import { useId } from 'react';

import { cn } from '../../lib/cn';
import { ParkingGlyph } from './Car';

// Le trait de côte de la baie des Anges, simplifié : l'aéroport à gauche, la
// Promenade qui s'incurve, la colline du Château et le port à droite.
const COAST =
  'M0 236 C 70 240 130 250 200 252 S 330 250 400 232 S 478 198 520 178 C 544 168 558 188 572 212 L 600 244';

// Des places réparties comme elles le sont vraiment : près de la mer, dans le
// centre, quelques-unes sur les hauteurs.
const PINS = [
  { x: 150, y: 214 },
  { x: 262, y: 206 },
  { x: 332, y: 150 },
  { x: 404, y: 190 },
  { x: 470, y: 118 },
  { x: 214, y: 132 },
];

/** Carte stylisée de Nice. Décorative : elle illustre « uniquement à Nice ». */
export const RivieraMap = ({ className }: { className?: string }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const sea = `sea-${uid}`;
  const streets = `streets-${uid}`;

  return (
    <svg
      viewBox="0 0 600 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn('block h-full w-full', className)}
    >
      <defs>
        <linearGradient id={sea} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f9bd1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1f46e0" stopOpacity="0.15" />
        </linearGradient>
        <pattern
          id={streets}
          width="34"
          height="34"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-18)"
        >
          <path d="M0 0H34M0 0V34" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1.5" />
        </pattern>
      </defs>

      <rect width="600" height="360" fill={`url(#${streets})`} />
      <path d="M-20 36 C 120 70 260 40 380 88 S 560 60 640 96" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="6" fill="none" />
      <path d="M90 -10 C 110 80 170 150 240 250" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="5" fill="none" />
      <path d={`${COAST} L600 360 L0 360 Z`} fill={`url(#${sea})`} />
      <path d={COAST} stroke="#ffd23f" strokeOpacity="0.9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text
        x="250"
        y="318"
        fill="#ffffff"
        fillOpacity="0.45"
        fontFamily="Geist Mono, ui-monospace, monospace"
        fontSize="12"
        letterSpacing="0.3em"
      >
        BAIE DES ANGES
      </text>

      {PINS.map((pin, index) => (
        <g key={`${String(pin.x)}-${String(pin.y)}`} transform={`translate(${String(pin.x - 13)} ${String(pin.y - 13)})`}>
          <g
            className="animate-drop"
            style={{ '--i': index } as React.CSSProperties}
          >
            <circle cx="13" cy="30" r="5" fill="#000" opacity="0.35" />
            <g transform="scale(0.8125)">
              <ParkingGlyph />
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
};
