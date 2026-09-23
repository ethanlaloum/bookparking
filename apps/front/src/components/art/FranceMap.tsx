import { useId } from 'react';

import { cn } from '../../lib/cn';
import { ParkingGlyph } from './Car';

// Le contour de la métropole et de la Corse, simplifié à une centaine de points
// réels (longitude, latitude) projetés à la main : la côte d'Opale en haut, la
// pointe bretonne à gauche, la Méditerranée en bas. Un tracé fait de segments,
// comme un marquage au sol, et non une carte.
const MAINLAND =
  'M330 52 L333 50 L347 61 L369 75 L382 79 L381 90 L386 93 L403 98 L409 100 L422 108 L437 109 L454 116 L445 127 L441 142 L441 158 L428 161 L426 167 L409 188 L409 199 L420 195 L427 208 L430 212 L428 222 L420 235 L426 241 L428 256 L439 265 L439 275 L434 278 L431 282 L427 283 L423 286 L421 291 L410 297 L405 296 L393 290 L383 287 L373 285 L362 283 L358 287 L353 291 L346 295 L344 304 L344 313 L347 316 L340 316 L324 318 L316 315 L294 304 L273 305 L258 298 L249 291 L241 288 L246 284 L252 262 L252 248 L256 220 L255 202 L241 192 L233 176 L232 168 L213 161 L207 154 L196 149 L178 144 L183 138 L178 134 L181 127 L194 123 L206 120 L220 129 L236 125 L247 126 L245 120 L238 92 L245 95 L252 94 L254 102 L274 105 L281 100 L283 93 L287 91 L302 86 L308 82 L313 78 L313 68 L313 61 L313 57 L318 54 Z';
const CORSICA = 'M479 299 L480 308 L482 327 L477 342 L474 349 L469 340 L465 332 L462 321 L465 312 L477 309 Z';

// Une place dans chacune des grandes villes, à leur vraie position : Nice, où
// le produit est né, n'est plus qu'un repère parmi d'autres.
const PINS = [
  { city: 'Paris', x: 329, y: 119 },
  { city: 'Lille', x: 344, y: 64 },
  { city: 'Rennes', x: 243, y: 142 },
  { city: 'Strasbourg', x: 444, y: 128 },
  { city: 'Bordeaux', x: 267, y: 243 },
  { city: 'Lyon', x: 382, y: 214 },
  { city: 'Toulouse', x: 310, y: 281 },
  { city: 'Marseille', x: 393, y: 290 },
  { city: 'Nice', x: 434, y: 278 },
];

/** Carte stylisée de la France. Décorative : elle illustre « partout en France ». */
export const FranceMap = ({ className }: { className?: string }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const land = `land-${uid}`;
  const streets = `streets-${uid}`;

  return (
    <svg
      viewBox="0 0 600 360"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn('block h-full w-full', className)}
    >
      <defs>
        <linearGradient id={land} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f46e0" stopOpacity="0.15" />
          <stop offset="1" stopColor="#1f9bd1" stopOpacity="0.45" />
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
      {[MAINLAND, CORSICA].map((outline) => (
        <path
          key={outline}
          d={outline}
          fill={`url(#${land})`}
          stroke="#ffd23f"
          strokeOpacity="0.9"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ))}

      {PINS.map((pin, index) => (
        <g key={pin.city} transform={`translate(${String(pin.x - 13)} ${String(pin.y - 13)})`}>
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
