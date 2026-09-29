import { cn } from '../../lib/cn';
import { Car, ParkingGlyph } from './Car';

const MAX_LABEL = 12;

/**
 * La place de l'annonce, en grand, entre deux voisines occupées : le box peint
 * au sol, le panneau P, et un cadre qui l'entoure. C'est l'image de tête de la
 * fiche — les photos d'une annonce ne sont que des références, et une place
 * dessinée vaut mieux qu'un rectangle gris.
 */
export const BayScene = ({ box, className }: { box: string; className?: string }) => {
  const label = box.length > MAX_LABEL ? `${box.slice(0, MAX_LABEL - 1)}…` : box;

  return (
    <svg
      viewBox="0 0 720 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn('block h-full w-full', className)}
    >
      <rect width="720" height="400" fill="#161a24" />
      <path
        d="M60 36V318M260 36V318M460 36V318M660 36V318M60 36H660"
        stroke="#e9edf5"
        strokeOpacity="0.5"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 364H720"
        stroke="#ffd23f"
        strokeOpacity="0.8"
        strokeWidth="5"
        strokeDasharray="34 24"
      />

      <g style={{ filter: 'drop-shadow(0 10px 10px rgb(0 0 0 / 0.5))' }}>
        <g transform="translate(160 176) rotate(91) scale(2.05)">
          <Car color="#e8ebf0" />
        </g>
        <g transform="translate(562 178) rotate(88) scale(2.05)">
          <Car color="#c9483b" />
        </g>
      </g>

      <rect
        x="282"
        y="58"
        width="156"
        height="238"
        rx="22"
        fill="#3a64f8"
        fillOpacity="0.14"
        stroke="#6d90ff"
        strokeWidth="3"
        strokeDasharray="12 12"
        className="animate-march"
      />
      <circle
        cx="360"
        cy="150"
        r="46"
        fill="#3a64f8"
        opacity="0.35"
        className="animate-pulse-ring [transform-box:fill-box] [transform-origin:center]"
      />
      <g transform="translate(324 114) scale(2.25)">
        <ParkingGlyph />
      </g>
      <text
        x="360"
        y="262"
        textAnchor="middle"
        fill="#ffd23f"
        fontFamily="Geist Mono, ui-monospace, monospace"
        fontWeight="700"
        fontSize={label.length > 6 ? 26 : 38}
        letterSpacing="0.08em"
      >
        {label}
      </text>
    </svg>
  );
};
