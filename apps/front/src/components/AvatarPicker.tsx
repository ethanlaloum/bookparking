import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { AVATARS, type Avatar as AvatarId } from '../app/account/domain/entities/Avatar';
import { cn } from '../lib/cn';
import { Avatar } from './Avatar';

interface AvatarPickerProps {
  value: AvatarId;
  onChange: (avatar: AvatarId) => void;
  disabled?: boolean;
  /** Nom du groupe de boutons radio : deux sélecteurs sur une page ne doivent pas se mêler. */
  name: string;
}

/**
 * Les cinq pilotes, en boutons radio natifs cachés sous leur vignette : les
 * flèches du clavier passent d'un pilote à l'autre comme dans n'importe quel
 * groupe, et chaque option est nommée par son pilote.
 */
export const AvatarPicker = ({ value, onChange, disabled = false, name }: AvatarPickerProps) => {
  const { t } = useTranslation('common');
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-medium text-fg">
        {t('common:avatar.label')}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-5 gap-2">
        {AVATARS.map((avatar) => (
          <label
            key={avatar}
            className={cn(
              'group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-line bg-bg-raised p-2 transition-[border-color,box-shadow,translate] duration-200 ease-[var(--ease-spring)]',
              'hover:-translate-y-0.5 hover:border-line-strong',
              'has-[:checked]:border-brand has-[:checked]:bg-accent-soft has-[:checked]:shadow-[var(--shadow-brand)]',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={avatar}
              checked={value === avatar}
              disabled={disabled}
              onChange={() => onChange(avatar)}
              className="sr-only"
            />
            <Avatar avatar={avatar} className="size-12 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105 sm:size-14" />
            <span className="text-center text-[0.7rem] leading-tight font-medium text-fg-muted group-has-[:checked]:font-semibold group-has-[:checked]:text-fg">
              {t(`common:avatar.name.${avatar}`)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
