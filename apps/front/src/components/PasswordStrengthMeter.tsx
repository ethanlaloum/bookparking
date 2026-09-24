import { useTranslation } from 'react-i18next';

import { passwordGaugeOf, passwordStrengthOf } from '../app/account/domain/entities/Password';
import { cn } from '../lib/cn';

const SEGMENT = { danger: 'bg-danger', warn: 'bg-warn', ok: 'bg-ok' } as const;
const LABEL = { danger: 'text-danger', warn: 'text-warn', ok: 'text-ok' } as const;

/**
 * La jauge de SPEC-007 RG-02. `role="meter"` et `aria-valuetext` donnent au
 * lecteur d'écran le mot (« Faible ») plutôt qu'un nombre de segments.
 */
export const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const { t } = useTranslation('auth');
  if (password === '') return null;

  const strength = passwordStrengthOf(password);
  const gauge = passwordGaugeOf(strength);
  const label = t(`strength.${strength}`);

  return (
    <div
      role="meter"
      aria-label={t('strength.label')}
      aria-valuemin={0}
      aria-valuemax={3}
      aria-valuenow={gauge.segments}
      aria-valuetext={label}
      className="flex items-center gap-3"
    >
      <div className="flex flex-1 gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              segment <= gauge.segments ? SEGMENT[gauge.tone] : 'bg-line',
            )}
          />
        ))}
      </div>
      <span className={cn('min-w-16 text-right text-xs font-medium', LABEL[gauge.tone])}>{label}</span>
    </div>
  );
};
