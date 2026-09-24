import { CircleCheck } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { cn } from '../../lib/cn';
import { Car, ParkingGlyph } from './Car';

// Six places par rangée, 80 de large ; rangée haute de 24 à 164, allée de 164
// à 276, rangée basse de 276 à 416.
const BAY_X = [60, 140, 220, 300, 380, 460];
const TOP_Y = 94;
const BOTTOM_Y = 346;
const FREE_BAY = 3;

// Des teintes de parking réel : beaucoup de blanc, de gris et de sombre, une
// voiture rouge. Le décalage et l'angle cassent l'alignement parfait qui
// trahirait le dessin.
const TOP_ROW = [
  { color: '#e8ebf0', dx: -2, angle: 91 },
  { color: '#2b3142', dx: 2, angle: 88 },
  { color: '#c9483b', dx: -1, angle: 90 },
  null,
  { color: '#8c96aa', dx: 3, angle: 92 },
  { color: '#d9c7a3', dx: -2, angle: 89 },
];

const BOTTOM_ROW = [
  { color: '#3d7f86', dx: 1, angle: -91 },
  { color: '#e8ebf0', dx: -3, angle: -88 },
  null,
  { color: '#2b3142', dx: 2, angle: -90 },
  { color: '#8c96aa', dx: -1, angle: -92 },
  { color: '#e8ebf0', dx: 2, angle: -89 },
];

// La trajectoire de la voiture qui se gare : elle entre par la voie basse de
// l'allée, tourne, et finit capot vers le fond de la place libre.
const ARRIVAL = `M -80 248 L 170 248 C 262 248 300 236 300 170 L ${BAY_X[FREE_BAY]} ${TOP_Y}`;
const LOOP = '9s';

const lines = (fromY: number, toY: number, backY: number): string =>
  [
    ...[20, 100, 180, 260, 340, 420, 500].map((x) => `M${x} ${fromY}V${toY}`),
    `M20 ${backY}H500`,
  ].join('');

/**
 * Un parking vu du dessus, dessiné plutôt que photographié : il porte le
 * propos de la marque — une place libre, qu'une voiture vient prendre — sans
 * montrer un lieu qui n'existe pas. Décoratif de bout en bout : les deux
 * étiquettes flottantes répètent ce que le dessin montre.
 */
export const ParkingLotIllustration = ({ className }: { className?: string }) => {
  const { t } = useTranslation('listing');
  const reduced = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const shadow = `lot-shadow-${uid}`;
  const clip = `lot-clip-${uid}`;
  const beam = `lot-beam-${uid}`;

  return (
    <div aria-hidden="true" className={cn('relative select-none', className)}>
      {/* Lueur sous la dalle : le parking flotte au-dessus de l'encre. */}
      <div className="absolute inset-x-10 top-1/4 bottom-0 rounded-full bg-signal-500/25 blur-3xl" />

      <div className="relative [transform:perspective(1600px)_rotateX(18deg)_rotateZ(-5deg)] [transform-style:preserve-3d]">
        <svg viewBox="0 0 520 440" className="h-auto w-full drop-shadow-[0_40px_50px_rgb(0_0_0/0.55)]">
          <defs>
            <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#000" floodOpacity="0.55" />
            </filter>
            <clipPath id={clip}>
              <rect width="520" height="440" rx="34" />
            </clipPath>
            <linearGradient id={beam} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#fff6c2" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fff6c2" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="520" height="440" rx="34" fill="#161a24" />
          <rect
            x="0.75"
            y="0.75"
            width="518.5"
            height="438.5"
            rx="33.25"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.08"
            strokeWidth="1.5"
          />

          {/* Marquages : lignes de places, axe de l'allée, flèches. */}
          <path
            d={lines(24, 164, 24) + lines(276, 416, 416)}
            stroke="#e9edf5"
            strokeOpacity="0.5"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M36 220H484"
            stroke="#ffd23f"
            strokeOpacity="0.85"
            strokeWidth="3"
            strokeDasharray="20 14"
            strokeLinecap="round"
          />
          <path d="M78 244H102V237L116 248L102 259V252H78Z" fill="#ffffff" opacity="0.2" />
          <path d="M442 188H418V181L404 192L418 203V196H442Z" fill="#ffffff" opacity="0.2" />

          {/* Voitures garées. */}
          <g filter={`url(#${shadow})`}>
            {TOP_ROW.map((car, index) =>
              car === null ? null : (
                <g
                  key={`top-${String(index)}`}
                  transform={`translate(${String(BAY_X[index] + car.dx)} ${String(TOP_Y)}) rotate(${String(car.angle)})`}
                >
                  <Car color={car.color} />
                </g>
              ),
            )}
            {BOTTOM_ROW.map((car, index) =>
              car === null ? null : (
                <g
                  key={`bottom-${String(index)}`}
                  transform={`translate(${String(BAY_X[index] + car.dx)} ${String(BOTTOM_Y)}) rotate(${String(car.angle)})`}
                >
                  <Car color={car.color} />
                </g>
              ),
            )}
          </g>

          {/* La place libre : cadre en pointillés qui défilent, pulsation,
              panneau P au sol. Elle s'efface quand la voiture arrive. */}
          <g>
            {!reduced && (
              <animate
                attributeName="opacity"
                values="1;1;0;0;1;1"
                keyTimes="0;0.36;0.42;0.88;0.94;1"
                dur={LOOP}
                repeatCount="indefinite"
              />
            )}
            <rect
              x={BAY_X[FREE_BAY] - 34}
              y={TOP_Y - 58}
              width="68"
              height="116"
              rx="14"
              fill="#3a64f8"
              fillOpacity="0.16"
              stroke="#6d90ff"
              strokeWidth="2"
              strokeDasharray="7 7"
              className="animate-march"
            />
            <circle
              cx={BAY_X[FREE_BAY]}
              cy={TOP_Y}
              r="24"
              fill="#3a64f8"
              opacity="0.4"
              className="animate-pulse-ring [transform-box:fill-box] [transform-origin:center]"
            />
            <g transform={`translate(${String(BAY_X[FREE_BAY] - 18)} ${String(TOP_Y - 18)}) scale(1.125)`}>
              <ParkingGlyph />
            </g>
          </g>

          {/* La voiture qui se gare, puis la coche de confirmation. */}
          {!reduced && (
            <>
              <g clipPath={`url(#${clip})`}>
                <g filter={`url(#${shadow})`}>
                  <g>
                    <animateMotion
                      path={ARRIVAL}
                      dur={LOOP}
                      repeatCount="indefinite"
                      rotate="auto"
                      calcMode="spline"
                      keyPoints="0;1;1;1"
                      keyTimes="0;0.42;0.86;1"
                      keySplines="0.45 0 0.2 1;0 0 1 1;0 0 1 1"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;1;0;0"
                      keyTimes="0;0.04;0.42;0.84;0.9;1"
                      dur={LOOP}
                      repeatCount="indefinite"
                    />
                    <path d="M48 -18L118 -44V44L48 18Z" fill={`url(#${beam})`}>
                      <animate
                        attributeName="opacity"
                        values="1;1;0;0"
                        keyTimes="0;0.4;0.46;1"
                        dur={LOOP}
                        repeatCount="indefinite"
                      />
                    </path>
                    <Car color="#3a64f8" />
                  </g>
                </g>
              </g>

              <g transform={`translate(${String(BAY_X[FREE_BAY] + 30)} ${String(TOP_Y - 52)})`} opacity="0">
                <animate
                  attributeName="opacity"
                  values="0;0;1;1;0;0"
                  keyTimes="0;0.44;0.48;0.82;0.86;1"
                  dur={LOOP}
                  repeatCount="indefinite"
                />
                <circle r="14" fill="#22c55e" stroke="#161a24" strokeWidth="3" />
                <path
                  d="M-6 0.5L-1.8 4.6L6.2 -4"
                  stroke="#ffffff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            </>
          )}
        </svg>
      </div>

      {/* Deux étiquettes, à plat : elles ne suivent pas l'inclinaison de la
          dalle, comme une interface posée au-dessus du monde. */}
      <div className="animate-float absolute top-[4%] -left-2 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-ink-raised/85 py-2.5 pr-4 pl-3 text-sm text-on-ink shadow-[var(--shadow-float)] backdrop-blur-md sm:-left-6">
        <span className="relative grid size-2.5 place-items-center">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-green-400" />
          <span className="relative size-2.5 rounded-full bg-green-400" />
        </span>
        <span className="font-medium">{t('home.visual.free')}</span>
      </div>

      <div className="animate-float absolute top-[30%] right-0 flex items-center gap-2.5 rounded-2xl bg-white py-2.5 pr-4 pl-3 text-sm text-asphalt-950 shadow-[var(--shadow-float)] [animation-delay:-3s] sm:-right-4">
        <CircleCheck className="size-5 text-green-600" aria-hidden="true" />
        <span className="font-medium">{t('home.visual.confirmed')}</span>
      </div>
    </div>
  );
};
