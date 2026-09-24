import { cn } from '../../lib/cn';
import { ParkingGlyph } from './Car';

const MAX_LABEL = 10;

/**
 * La vignette d'une annonce : sa place, vue du dessus, avec le numéro de box
 * peint au sol. Les « photos » d'une annonce ne sont que des références, pas
 * des images qu'on puisse afficher ; plutôt qu'un gris vide, la vignette montre
 * la seule donnée visuelle certaine — le box.
 */
export const BayThumbnail = ({ box, className }: { box: string; className?: string }) => {
  const label = box.length > MAX_LABEL ? `${box.slice(0, MAX_LABEL - 1)}…` : box;

  return (
    <svg
      viewBox="0 0 96 120"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn('block rounded-xl bg-[#161a24]', className)}
    >
      <rect width="96" height="120" fill="#161a24" />
      <path
        d="M12 -4V124M84 -4V124"
        stroke="#e9edf5"
        strokeOpacity="0.5"
        strokeWidth="3"
      />
      <path d="M12 10H84" stroke="#e9edf5" strokeOpacity="0.5" strokeWidth="3" />
      <g transform="translate(30 30) scale(1.125)">
        <ParkingGlyph />
      </g>
      <text
        x="48"
        y="96"
        textAnchor="middle"
        fill="#ffd23f"
        fontFamily="Geist Mono, ui-monospace, monospace"
        fontWeight="600"
        fontSize={label.length > 6 ? 10 : 13}
        letterSpacing="0.06em"
      >
        {label}
      </text>
    </svg>
  );
};
