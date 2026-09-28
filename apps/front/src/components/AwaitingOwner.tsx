import { Check, KeyRound, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { RentalRequestView } from '../app/rental/domain/entities/RentalRequestView';
import { cn } from '../lib/cn';
import { formatDeadline } from '../lib/format';
import { BarrierScene } from './art/BarrierScene';

type StepState = 'done' | 'current' | 'next';

const Step = ({
  state,
  title,
  hint,
  icon,
  last = false,
}: {
  state: StepState;
  title: string;
  hint: string;
  icon: ReactNode;
  last?: boolean;
}) => (
  <li className={cn('relative flex gap-3.5', !last && 'pb-5')}>
    {!last && (
      <span
        aria-hidden="true"
        className={cn('absolute top-8 bottom-0 left-4 w-px', state === 'done' ? 'bg-ok/50' : 'bg-line')}
      />
    )}
    <span
      className={cn(
        'relative grid size-8 shrink-0 place-items-center rounded-full',
        state === 'done' && 'bg-ok text-white',
        state === 'current' && 'bg-accent text-on-brand',
        state === 'next' && 'bg-bg-sunken text-fg-subtle ring-1 ring-line ring-inset',
      )}
    >
      {state === 'current' && (
        <span className="animate-pulse-ring absolute inset-0 rounded-full bg-accent" aria-hidden="true" />
      )}
      <span className="relative">{icon}</span>
    </span>
    <div className="pt-1">
      <p
        className={cn(
          'text-sm font-semibold',
          state === 'next' ? 'text-fg-subtle' : 'text-fg',
        )}
      >
        {title}
        {state === 'current' && (
          <span className="ml-1.5 inline-flex gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="animate-wait-dot inline-block size-1 rounded-full bg-current"
                style={{ animationDelay: `${dot * 160}ms` }}
              />
            ))}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>
    </div>
  </li>
);

/**
 * Après le paiement, la demande attend le loueur : une barrière encore
 * baissée, et les trois étapes du parcours. L'échéance est celle que l'api
 * applique (`answerBy`), jamais un calcul de l'écran.
 */
export const AwaitingOwner = ({ request }: { request: RentalRequestView }) => {
  const { t } = useTranslation('rental');
  const confirmed = request.status === 'CONFIRMED';

  return (
    <div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-line ring-inset">
        <BarrierScene mode={confirmed ? 'opening' : 'waiting'} />
        <p className="sr-only">{t('payment.waiting.scene')}</p>
      </div>

      <ol className="mt-6" aria-label={t('payment.waiting.title')}>
        <Step
          state="done"
          title={t('payment.waiting.stepPaid')}
          hint={t('payment.waiting.stepPaidHint')}
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        />
        <Step
          state={confirmed ? 'done' : 'current'}
          title={t('payment.waiting.stepOwner')}
          hint={
            request.answerBy === null
              ? t('payment.waiting.stepOwnerHintNoDate')
              : t('payment.waiting.stepOwnerHint', { date: formatDeadline(request.answerBy) })
          }
          icon={confirmed ? <Check className="size-4" aria-hidden="true" /> : <span className="text-xs font-bold">2</span>}
        />
        <Step
          state={confirmed ? 'done' : 'next'}
          title={t('payment.waiting.stepConfirmed')}
          hint={t('payment.waiting.stepConfirmedHint')}
          icon={<KeyRound className="size-4" aria-hidden="true" />}
          last
        />
      </ol>

      {!confirmed && (
        <div className="mt-6 space-y-1.5 rounded-xl bg-bg-sunken px-4 py-3 text-sm leading-relaxed text-fg-muted">
          <p>{t('payment.waiting.notify')}</p>
          <p className="text-xs text-fg-subtle">{t('payment.waiting.whatIf')}</p>
        </div>
      )}
    </div>
  );
};
