import { ArrowRight, X } from 'lucide-react';
import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { markNotificationReadRequested } from '../app/notification/domain/use-cases/mark-notification-read/markNotificationReadEpic';
import { listMyRentalRequestsRequested } from '../app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { accountHrefOf } from '../lib/accountTabs';
import { formatShortDay } from '../lib/format';
import { selectBookingToCelebrate } from '../selectors/notification/notificationSelectors';
import { selectMyRentalRequests } from '../selectors/rental/rentalSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { AccessInstructions } from './AccessInstructions';
import { BarrierScene } from './art/BarrierScene';
import { buttonVariants } from './ui/buttonVariants';

const CONFETTI_COLORS = ['#1f46e0', '#ffd23f', '#22c55e', '#ff5a4f', '#3a64f8', '#ffffff'];

// Des éclats répartis en éventail, calculés une fois : pas de hasard, donc le
// même feu d'artifice à chaque rendu et aucun `Math.random` dans un composant.
const CONFETTI = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2;
  const reach = 90 + (index % 5) * 22;
  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    style: {
      '--confetti-x': `${Math.round(Math.cos(angle) * reach)}px`,
      '--confetti-y': `${Math.round(Math.sin(angle) * reach * 0.8 + 60)}px`,
      '--confetti-turn': `${(index % 2 === 0 ? 1 : -1) * (220 + index * 17)}deg`,
      animationDelay: `${1100 + (index % 7) * 45}ms`,
    } as CSSProperties,
    wide: index % 3 === 0,
  };
});

const dayOf = (day: string): string => formatShortDay(`${day}T00:00:00.000Z`);

/**
 * La réservation confirmée, fêtée au premier écran qui la voit : la barrière
 * se lève, la voiture passe, les consignes d'accès sont là. La fermer marque
 * la notification lue — on ne la fête qu'une fois, sur le site comme dans
 * l'app. La cloche se relit toutes les minutes : la fête vient avec elle.
 */
export const BookingCelebration = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const booking = useAppSelector(selectBookingToCelebrate);
  const mine = useAppSelector(selectMyRentalRequests);
  const titleId = useId();
  const primaryRef = useRef<HTMLAnchorElement>(null);

  const bookingId = booking?.id ?? null;
  const request =
    booking === null ? null : (mine.find((candidate) => candidate.id === booking.requestId) ?? null);

  useEffect(() => {
    if (bookingId === null) return;
    // Les consignes ne sont que dans la demande relue : la notification ne
    // les porte pas.
    dispatch(listMyRentalRequestsRequested());
    primaryRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(markNotificationReadRequested({ notificationId: bookingId }));
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [bookingId, dispatch]);

  if (booking === null) return null;

  const dismiss = () => dispatch(markNotificationReadRequested({ notificationId: booking.id }));

  return (
    <div className="animate-fade fixed inset-0 z-[60] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-pop relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-bg-raised shadow-[var(--shadow-float)]"
      >
        <div className="relative">
          <BarrierScene mode="opening" />
          <p className="sr-only">{t('celebration.scene')}</p>
          <div className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden="true">
            {CONFETTI.map((piece, index) => (
              <span
                key={index}
                className={`animate-confetti absolute block rounded-[2px] ${piece.wide ? 'h-1.5 w-3' : 'h-2.5 w-1.5'}`}
                style={{ ...piece.style, backgroundColor: piece.color }}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="animate-pop size-10 shrink-0" aria-hidden="true">
              <circle cx="20" cy="20" r="19" className="fill-ok" />
              <path
                d="M12 20.5 L17.5 26 L28 14.5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                className="animate-draw"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="label-ticket text-ok">{t('celebration.eyebrow')}</p>
              <h2 id={titleId} className="font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-fg">
                {t('celebration.title')}
              </h2>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t('celebration.close')}
              className="grid size-9 shrink-0 cursor-pointer place-items-center self-start rounded-full text-fg-muted transition-colors hover:bg-bg-sunken hover:text-fg"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-fg-muted">
            {booking.fromDay === booking.toDay
              ? t('celebration.bodySingleDay', { day: dayOf(booking.fromDay) })
              : t('celebration.body', { from: dayOf(booking.fromDay), to: dayOf(booking.toDay) })}
          </p>
          <p className="mt-1 text-sm font-medium text-fg">
            {booking.address} · <span className="font-mono text-[0.9em]">{booking.box}</span>
          </p>

          {request?.accessInstructions ? (
            <AccessInstructions instructions={request.accessInstructions} className="mt-4" />
          ) : (
            <p className="mt-4 rounded-xl bg-bg-sunken px-4 py-3 text-sm text-fg-muted">
              {request === null ? t('celebration.accessPending') : t('celebration.accessLater')}
            </p>
          )}

          <Link
            ref={primaryRef}
            to={accountHrefOf('mine')}
            onClick={dismiss}
            className={`${buttonVariants({ variant: 'primary' })} mt-5 w-full`}
          >
            {t('celebration.cta')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
};
