import { cn } from '../../lib/cn';
import { Car } from './Car';

const STRIPES = [0, 1, 2, 3];

/**
 * Une barrière de parking vue de dessus, comme le reste des illustrations :
 * la voie de gauche à droite, le poteau au bord, le bras en travers. En
 * attente, le bras hésite et la voiture tourne au ralenti devant ; ouverte, il
 * pivote hors de la voie et la voiture passe. `aria-hidden` : la scène double
 * un texte, elle ne le remplace pas.
 */
export const BarrierScene = ({
  mode,
  className,
}: {
  mode: 'waiting' | 'opening';
  className?: string;
}) => {
  const open = mode === 'opening';

  return (
    <svg viewBox="0 0 360 150" className={cn('w-full', className)} aria-hidden="true">
      <rect x="0" y="34" width="360" height="100" className="fill-bg-sunken" />
      <line x1="0" x2="360" y1="38" y2="38" className="stroke-line-strong" strokeWidth="2" />
      <line x1="0" x2="360" y1="130" y2="130" className="stroke-line-strong" strokeWidth="2" />
      <line
        x1="0"
        x2="360"
        y1="84"
        y2="84"
        className="stroke-line-strong"
        strokeWidth="3"
        strokeDasharray="16 14"
      />
      <line
        x1="232"
        x2="232"
        y1="40"
        y2="128"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="4"
        strokeDasharray="6 6"
      />

      <g className={open ? 'animate-car-through' : undefined}>
        <g className={open ? undefined : 'animate-car-idle'}>
          <g transform="translate(150 84) scale(0.62)">
            <Car color="#1f46e0" />
          </g>
        </g>
      </g>

      <g
        className={open ? 'animate-barrier-open' : 'animate-barrier-idle'}
        style={{ transformOrigin: '252px 24px' }}
      >
        <rect x="247" y="22" width="10" height="110" rx="5" fill="#ffffff" />
        {STRIPES.map((stripe) => (
          <rect key={stripe} x="247" y={40 + stripe * 24} width="10" height="12" fill="#ff5a4f" />
        ))}
      </g>

      <rect x="243" y="14" width="18" height="18" rx="5" fill="#2a2f3d" />
      {!open && (
        <circle
          cx="252"
          cy="23"
          r="5"
          fill="#ff5a4f"
          className="animate-pulse-ring"
          style={{ transformOrigin: '252px 23px' }}
        />
      )}
      <circle cx="252" cy="23" r="4" fill={open ? '#22c55e' : '#ff5a4f'} />
    </svg>
  );
};
