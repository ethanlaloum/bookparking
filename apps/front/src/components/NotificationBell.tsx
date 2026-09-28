import {
  Ban,
  Banknote,
  Bell,
  CalendarCheck,
  CalendarX,
  CreditCard,
  Hourglass,
  Inbox,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  destinationOf,
  isUnread,
  toneOf,
  type Notification,
  type NotificationKind,
  type NotificationTone,
} from '../app/notification/domain/entities/Notification';
import { listNotificationsRequested } from '../app/notification/domain/use-cases/list-notifications/listNotificationsEpic';
import { markNotificationsReadRequested } from '../app/notification/domain/use-cases/mark-notifications-read/markNotificationsReadEpic';
import { accountHrefOf } from '../lib/accountTabs';
import { cn } from '../lib/cn';
import { formatShortDay, formatShortMoment } from '../lib/format';
import {
  selectNotifications,
  selectNotificationsError,
  selectUnreadNotificationCount,
} from '../selectors/notification/notificationSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { buttonVariants } from './ui/buttonVariants';

// Une minute : assez pour qu'un loueur voie sa demande arriver pendant qu'il
// navigue, assez peu pour ne pas charger l'api. Un retour sur l'onglet relit
// aussitôt.
const POLL_INTERVAL_IN_MS = 60_000;

const ICON: Record<NotificationKind, LucideIcon> = {
  RENTAL_REQUEST_RECEIVED: Inbox,
  RENTAL_REQUEST_ACCEPTED: CalendarCheck,
  RENTAL_REQUEST_DECLINED: CalendarX,
  RENTAL_REQUEST_EXPIRED: Hourglass,
  RENTAL_REQUEST_UNANSWERED: Hourglass,
  RENTAL_CANCELLED_BY_RENTER: CalendarX,
  RENTAL_CANCELLED_BY_OWNER: CalendarX,
  RENTAL_CANCELLED_BY_OPERATOR: Ban,
  RENTAL_PAYMENT_FAILED: CreditCard,
  RENTAL_PAYOUT_SENT: Banknote,
};

const TONE_CHIP: Record<NotificationTone, string> = {
  positive: 'bg-ok-bg text-ok',
  negative: 'bg-danger-bg text-danger',
  neutral: 'bg-warn-bg text-warn',
};

const NotificationItem = ({
  notification,
  onFollow,
}: {
  notification: Notification;
  onFollow: () => void;
}) => {
  const { t } = useTranslation('common');
  const Icon = ICON[notification.kind];
  const unread = isUnread(notification);

  return (
    <li>
      <Link
        to={accountHrefOf(destinationOf(notification))}
        onClick={onFollow}
        className={cn(
          'flex gap-3 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-bg-sunken focus-visible:bg-bg-sunken focus-visible:outline-none',
          unread && 'bg-accent-soft/50',
        )}
      >
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl',
            TONE_CHIP[toneOf(notification)],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className={cn('text-sm leading-snug text-fg', unread && 'font-semibold')}>
              {t(`notification.kind.${notification.kind}`)}
            </span>
            {unread && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent">
                <span className="sr-only">{t('notification.unread')}</span>
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-fg-muted">
            {t('notification.place', { address: notification.address, box: notification.box })}
          </span>
          <span className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-subtle">
            <span>
              {t('notification.period', {
                from: formatShortDay(`${notification.fromDay}T00:00:00.000Z`),
                to: formatShortDay(`${notification.toDay}T00:00:00.000Z`),
              })}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={notification.createdAt}>{formatShortMoment(notification.createdAt)}</time>
          </span>
        </span>
      </Link>
    </li>
  );
};

/**
 * La cloche de l'en-tête. Elle se relit seule tant qu'elle est montée — donc
 * tant qu'une session est ouverte — et l'ouvrir lit tout ce qu'elle montre :
 * la pastille tombe, les notifications nouvelles restent marquées jusqu'à la
 * relecture suivante.
 */
export const NotificationBell = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const error = useAppSelector(selectNotificationsError);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const read = () => dispatch(listNotificationsRequested());
    const readWhenVisible = () => {
      if (document.visibilityState === 'visible') read();
    };
    read();
    const timer = window.setInterval(read, POLL_INTERVAL_IN_MS);
    document.addEventListener('visibilitychange', readWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', readWhenVisible);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggle = () => {
    if (!open && unreadCount > 0) dispatch(markNotificationsReadRequested());
    setOpen(!open);
  };

  const label =
    unreadCount > 0 ? t('notification.bellUnread', { count: unreadCount }) : t('notification.bell');

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'relative px-2 sm:px-2.5',
          open && 'bg-bg-sunken text-fg',
        )}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="tabular absolute -top-0.5 -right-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-danger px-1 text-[0.65rem] leading-none font-bold text-white ring-2 ring-bg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('notification.title')}
          className="animate-rise fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-line bg-bg-raised shadow-[var(--shadow-float)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-base font-bold tracking-[-0.02em] text-fg">
              {t('notification.title')}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('action.close')}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'min-h-8 px-2')}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {error !== null && notifications.length === 0 && (
            <p role="status" className="px-4 py-6 text-center text-sm text-fg-muted">
              {t('notification.error')}
            </p>
          )}

          {error === null && notifications.length === 0 && (
            <div className="px-6 py-8 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-bg-sunken text-fg-subtle">
                <Bell className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-fg">{t('notification.empty')}</p>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t('notification.emptyHint')}</p>
            </div>
          )}

          {notifications.length > 0 && (
            <ul className="max-h-[min(28rem,calc(100dvh-8rem))] space-y-0.5 overflow-y-auto overscroll-contain p-1.5">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onFollow={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
