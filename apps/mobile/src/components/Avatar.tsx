import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import type { Avatar as AvatarId } from '@front/app/account/domain/entities/Avatar';
import { AVATAR_DISC, AVATAR_VIEWBOX, pilotDrawingOf, type PilotLayer } from '@front/lib/avatarArt';

const Layer = ({ layer }: { layer: PilotLayer }) => <Path d={layer.d} fill={layer.fill} opacity={layer.opacity} />;

/**
 * Le pilote choisi comme avatar, peint depuis les tracés du site
 * (`@front/lib/avatarArt`) : le même compte a le même casque dans l'app et sur
 * le site. Sans libellé, il est décoratif — l'onglet qui le porte a déjà son nom.
 */
export const Avatar = ({ avatar, size, label }: { avatar: AvatarId; size: number; label?: string }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const drawing = pilotDrawingOf(avatar);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={AVATAR_VIEWBOX}
      accessible={label !== undefined}
      accessibilityRole={label === undefined ? undefined : 'image'}
      accessibilityLabel={label}
    >
      <Defs>
        <ClipPath id={`disc-${uid}`}>
          <Circle cx={AVATAR_DISC.cx} cy={AVATAR_DISC.cy} r={AVATAR_DISC.r} />
        </ClipPath>
        <ClipPath id={`shell-${uid}`}>
          <Path d={drawing.shell.d} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#disc-${uid})`}>
        <Rect width={64} height={64} fill={drawing.background} />
        {drawing.body.map((layer) => (
          <Layer key={layer.d} layer={layer} />
        ))}
        <Layer layer={drawing.shell} />
        <G clipPath={`url(#shell-${uid})`}>
          {drawing.onShell.map((layer) => (
            <Layer key={layer.d} layer={layer} />
          ))}
        </G>
        {drawing.front.map((layer) => (
          <Layer key={layer.d} layer={layer} />
        ))}
      </G>
    </Svg>
  );
};
