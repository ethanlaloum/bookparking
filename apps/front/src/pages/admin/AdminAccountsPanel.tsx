import { ShieldCheck, ShieldX } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { hasNoActivity, isSuspended } from '../../app/back-office/domain/entities/AdminAccount';
import { listAccountsRequested } from '../../app/back-office/domain/use-cases/list-accounts/listAccountsEpic';
import { EmptyState } from '../../components/EmptyState';
import { ModerationDialog } from '../../components/ModerationDialog';
import { Notice } from '../../components/Notice';
import { Td, TableShell, Th } from '../../components/TableShell';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useModeration } from '../../hooks/useModeration';
import { formatDay, formatMoment } from '../../lib/format';
import {
  selectAccountsError,
  selectAccountsLoading,
  selectSortedAccounts,
  selectSuspendedAccountCount,
} from '../../selectors/back-office/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../../store/redux';

export const AdminAccountsPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const moderation = useModeration();

  const accounts = useAppSelector(selectSortedAccounts);
  const suspended = useAppSelector(selectSuspendedAccountCount);
  const loading = useAppSelector(selectAccountsLoading);
  const error = useAppSelector(selectAccountsError);

  useEffect(() => {
    dispatch(listAccountsRequested());
  }, [dispatch]);

  return (
    <div>
      <p className="tabular text-sm text-fg-subtle">
        {t('admin:accounts.subtitle', { total: accounts.length, suspended })}
      </p>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-4">
        {loading && accounts.length === 0 && <Skeleton className="h-64" />}
        {!loading && accounts.length === 0 && <EmptyState title={t('admin:accounts.empty')} />}

        {accounts.length > 0 && (
          <TableShell
            caption={t('admin:accounts.caption')}
            head={
              <>
                <Th>{t('admin:accounts.column.email')}</Th>
                <Th>{t('admin:accounts.column.registeredAt')}</Th>
                <Th className="text-right">{t('admin:accounts.column.listings')}</Th>
                <Th className="text-right">{t('admin:accounts.column.requests')}</Th>
                <Th>{t('admin:accounts.column.status')}</Th>
                <Th className="text-right">{t('admin:accounts.column.action')}</Th>
              </>
            }
          >
            {accounts.map((account) => {
              const suspendedAt = account.suspendedAt;

              return (
                <tr key={account.id} className="border-b border-line last:border-b-0">
                  <Td className="font-medium text-fg">
                    {account.email}
                    {hasNoActivity(account) && (
                      <Badge tone="neutral" className="ml-2">
                        {t('admin:accounts.noActivity')}
                      </Badge>
                    )}
                  </Td>
                  <Td className="tabular whitespace-nowrap text-fg-muted">
                    {formatDay(account.registeredAt)}
                  </Td>
                  <Td className="tabular text-right text-fg-muted">{account.listingCount}</Td>
                  <Td className="tabular text-right text-fg-muted">{account.requestCount}</Td>
                  <Td>
                    {suspendedAt === null ? (
                      <Badge tone="ok">{t('admin:accounts.status.active')}</Badge>
                    ) : (
                      <Badge
                        tone="danger"
                        title={t('admin:accounts.suspendedSince', {
                          date: formatMoment(suspendedAt),
                        })}
                      >
                        {t('admin:accounts.status.suspended')}
                      </Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    {isSuspended(account) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          moderation.ask({
                            kind: 'lift',
                            targetId: account.id,
                            label: account.email,
                          })
                        }
                      >
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        {t('admin:accounts.lift')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          moderation.ask({
                            kind: 'suspend',
                            targetId: account.id,
                            label: account.email,
                          })
                        }
                      >
                        <ShieldX className="size-4" aria-hidden="true" />
                        {t('admin:accounts.suspend')}
                      </Button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </TableShell>
        )}
      </div>

      <ModerationDialog
        target={moderation.target}
        pending={moderation.pending}
        error={moderation.error}
        onConfirm={moderation.confirm}
        onClose={moderation.close}
      />
    </div>
  );
};
