import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@front/components/EmptyState';
import { Notice } from '@front/components/Notice';
import { Badge } from '@front/components/ui/badge';
import type { BadgeVariantProps } from '@front/components/ui/badgeVariants';
import { Skeleton } from '@front/components/ui/skeleton';
import { cn } from '@front/lib/cn';
import { formatCount, formatMoment } from '@front/lib/format';

import {
  settingChangesOf,
  type AdminActionKind,
  type AdminJournalEntry,
  type JournalFilter,
  type SettingChange,
} from '../app/back-office/domain/entities/AdminJournalEntry';
import { readAdminJournalRequested } from '../app/back-office/domain/use-cases/read-admin-journal/readAdminJournalEpic';
import { Td, TableShell, Th } from '../components/TableShell';
import {
  selectJournal,
  selectJournalError,
  selectJournalLoading,
} from '../selectors/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const FILTERS: readonly JournalFilter[] = ['all', 'moderation', 'settings'];

// Une sanction en rouge, sa levée en vert, le reste en neutre : l'œil repère
// d'abord ce qui a coûté quelque chose à quelqu'un.
const TONE_BY_KIND: Record<AdminActionKind, BadgeVariantProps['tone']> = {
  UNPUBLISH_LISTING: 'danger',
  SUSPEND_ACCOUNT: 'danger',
  LIFT_ACCOUNT_SUSPENSION: 'ok',
  CANCEL_RENTAL_REQUEST: 'danger',
  CHANGE_PLATFORM_SETTINGS: 'warn',
  RESOLVE_RENTAL_ISSUE: 'accent',
};

const FILTER_CLASS =
  'inline-flex min-h-9 items-center rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors';

export const AdminJournalPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<JournalFilter>('all');
  const entries = useAppSelector((state) => selectJournal(state, filter));
  const loading = useAppSelector(selectJournalLoading);
  const error = useAppSelector(selectJournalError);

  useEffect(() => {
    dispatch(readAdminJournalRequested());
  }, [dispatch]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="tabular text-sm text-fg-subtle">
          {t('admin:journal.subtitle', { total: entries.length })}
        </p>
        <div
          role="group"
          aria-label={t('admin:journal.filter.label')}
          className="flex gap-1 rounded-xl bg-bg-sunken p-1 ring-1 ring-line ring-inset"
        >
          {FILTERS.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={filter === name}
              onClick={() => setFilter(name)}
              className={cn(
                FILTER_CLASS,
                filter === name
                  ? 'bg-bg-raised font-semibold text-fg shadow-[var(--shadow-panel)] ring-1 ring-line-strong'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t(`admin:journal.filter.${name}`)}
            </button>
          ))}
        </div>
      </div>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-4">
        {loading && entries.length === 0 && <Skeleton className="h-64" />}
        {!loading && entries.length === 0 && <EmptyState title={t('admin:journal.empty')} />}

        {entries.length > 0 && (
          <TableShell
            caption={t('admin:journal.caption')}
            head={
              <>
                <Th>{t('admin:journal.column.date')}</Th>
                <Th>{t('admin:journal.column.admin')}</Th>
                <Th>{t('admin:journal.column.action')}</Th>
                <Th>{t('admin:journal.column.target')}</Th>
                <Th>{t('admin:journal.column.reason')}</Th>
              </>
            }
          >
            {entries.map((entry) => (
              <JournalRow key={entry.id} entry={entry} />
            ))}
          </TableShell>
        )}
      </div>
    </div>
  );
};

const JournalRow = ({ entry }: { entry: AdminJournalEntry }) => {
  const { t } = useTranslation('admin');
  const changes = settingChangesOf(entry);

  const valueOf = (change: SettingChange, value: number) =>
    t(change.setting === 'platformFeePercent' ? 'journal.value.percent' : 'journal.value.hours', {
      value: formatCount(value),
    });

  return (
    <tr className="border-b border-line align-top last:border-b-0">
      <Td className="tabular whitespace-nowrap text-fg-muted">{formatMoment(entry.actedAt)}</Td>
      <Td className="text-fg">{entry.adminEmail ?? t('journal.unknownAdmin')}</Td>
      <Td>
        <Badge tone={TONE_BY_KIND[entry.kind]}>{t(`journal.kind.${entry.kind}`)}</Badge>
      </Td>
      <Td className="text-fg">
        {entry.targetType === 'PLATFORM_SETTINGS' ? (
          <>
            {t('journal.target.settings')}
            <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-fg-muted">
              {changes.map((change) => (
                <li key={change.setting} className="tabular">
                  {t(`journal.setting.${change.setting}`)} :{' '}
                  {change.from === null
                    ? valueOf(change, change.to)
                    : t('journal.change', {
                        from: valueOf(change, change.from),
                        to: valueOf(change, change.to),
                      })}
                </li>
              ))}
            </ul>
          </>
        ) : (
          (entry.targetLabel ?? <span className="text-fg-subtle">{t('journal.target.gone')}</span>)
        )}
      </Td>
      <Td className="max-w-[22rem] text-fg-muted">{entry.reason}</Td>
    </tr>
  );
};
