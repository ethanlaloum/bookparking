import { useId } from 'react';

import type { Avatar as AvatarId } from '../app/account/domain/entities/Avatar';
import { AVATAR_DISC, AVATAR_VIEWBOX, pilotDrawingOf, type PilotLayer } from '../lib/avatarArt';
import { cn } from '../lib/cn';

interface AvatarProps {
  avatar: AvatarId;
  className?: string;
  /** Sans libellé, l'avatar est décoratif : le lien ou l'option qui le porte a déjà son nom. */
  label?: string;
}

const Layer = ({ layer }: { layer: PilotLayer }) => (
  <path d={layer.d} fill={layer.fill} opacity={layer.opacity} />
);

/**
 * Le pilote choisi comme avatar, peint depuis `lib/avatarArt.ts` — les mêmes
 * tracés que l'app, pour que le même compte ait le même casque partout.
 */
export const Avatar = ({ avatar, className, label }: AvatarProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const drawing = pilotDrawingOf(avatar);

  return (
    <svg
      viewBox={AVATAR_VIEWBOX}
      className={cn('shrink-0 rounded-full', className)}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
      focusable="false"
    >
      <clipPath id={`disc-${uid}`}>
        <circle cx={AVATAR_DISC.cx} cy={AVATAR_DISC.cy} r={AVATAR_DISC.r} />
      </clipPath>
      <clipPath id={`shell-${uid}`}>
        <path d={drawing.shell.d} />
      </clipPath>
      <g clipPath={`url(#disc-${uid})`}>
        <rect width="64" height="64" fill={drawing.background} />
        {drawing.body.map((layer) => (
          <Layer key={layer.d} layer={layer} />
        ))}
        <Layer layer={drawing.shell} />
        <g clipPath={`url(#shell-${uid})`}>
          {drawing.onShell.map((layer) => (
            <Layer key={layer.d} layer={layer} />
          ))}
        </g>
        {drawing.front.map((layer) => (
          <Layer key={layer.d} layer={layer} />
        ))}
      </g>
    </svg>
  );
};
