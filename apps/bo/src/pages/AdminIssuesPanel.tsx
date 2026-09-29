import { MessageSquareReply, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@front/components/EmptyState';
import { Notice } from '@front/components/Notice';
import { Badge } from '@front/components/ui/badge';
import type { BadgeVariantProps } from '@front/components/ui/badgeVariants';
import { Button } from '@front/components/ui/button';
import { Card } from '@front/components/ui/card';
import { Skeleton } from '@front/components/ui/skeleton';
import { formatCentsPrecisely, formatDay, formatMoment } from '@front/lib/format';

import {
  isOpen,
  type AdminRentalIssue,
  type IssueDecision,
} from '../app/back-office/domain/entities/AdminRentalIssue';
import { listRentalIssuesRequested } from '../app/back-office/domain/use-cases/list-rental-issues/listRentalIssuesEpic';
import {
  resetResolveRentalIssue,
  resolveRentalIssueRequested,
} from '../app/back-office/domain/use-cases/resolve-rental-issue/resolveRentalIssueEpic';
import { ResolutionDialog, type ResolutionTarget } from '../components/ResolutionDialog';
import {
  selectOpenRentalIssueCount,
  selectRentalIssues,
  selectRentalIssuesError,
  selectRentalIssuesLoading,
  selectResolvedIssueId,
  selectResolveIssueError,
  selectResolveIssuePending,
} from '../selectors/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const TONE: Record<AdminRentalIssue['status'], NonNullable<BadgeVariantProps['tone']>> = {
  OPEN: 'warn',
  REFUNDED: 'danger',
  PARTIALLY_REFUNDED: 'danger',
  DISMISSED: 'neutral',
};

const DECISIONS: readonly IssueDecision[] = ['REFUND', 'PARTIAL_REFUND', 'DISMISS'];

export const AdminIssuesPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const issues = useAppSelector(selectRentalIssues);
  const open = useAppSelector(selectOpenRentalIssueCount);
  const loading = useAppSelector(selectRentalIssuesLoading);
  const error = useAppSelector(selectRentalIssuesError);
  const pending = useAppSelector(selectResolveIssuePending);
  const resolveError = useAppSelector(selectResolveIssueError);
  const resolvedId = useAppSelector(selectResolvedIssueId);
  const [asked, setAsked] = useState<ResolutionTarget | null>(null);
  // La fenêtre se ferme par dérivation une fois la décision écrite, comme la
  // modale de modération.
  const target = asked !== null && asked.issue.id !== resolvedId ? asked : null;

  useEffect(() => {
    dispatch(listRentalIssuesRequested());
  }, [dispatch]);

  const ask = (issue: AdminRentalIssue, decision: IssueDecision) => {
    dispatch(resetResolveRentalIssue());
    setAsked({ issue, decision });
  };

  return (
    <div>
      <p className="tabular text-sm text-fg-subtle">
        {t('admin:issues.subtitle', { open, total: issues.length })}
      </p>

      {error !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {loading && issues.length === 0 && <Skeleton className="h-64" />}
        {!loading && issues.length === 0 && <EmptyState title={t('admin:issues.empty')} />}
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onDecide={(decision) => ask(issue, decision)} />
        ))}
      </div>

      {target !== null && (
        <ResolutionDialog
          key={`${target.issue.id}-${target.decision}`}
          target={target}
          pending={pending}
          error={resolveError}
          onConfirm={(resolution) =>
            dispatch(resolveRentalIssueRequested({ issueId: target.issue.id, resolution }))
          }
          onClose={() => setAsked(null)}
        />
      )}
    </div>
  );
};

const IssueCard = ({
  issue,
  onDecide,
}: {
  issue: AdminRentalIssue;
  onDecide: (decision: IssueDecision) => void;
}) => {
  const { t } = useTranslation('admin');
  const unknown = t('issues.unknownAccount');

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-fg">
            {issue.address} · <span className="font-mono text-[0.9em]">{issue.box}</span>
          </p>
          <p className="tabular mt-1 text-xs text-fg-subtle">
            {t('issues.period', {
              from: formatDay(`${issue.fromDay}T12:00:00.000Z`),
              to: formatDay(`${issue.toDay}T12:00:00.000Z`),
            })}{' '}
            · {t('issues.reportedAt', { date: formatMoment(issue.reportedAt) })}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {t('issues.parties', {
              renter: issue.renterEmail ?? unknown,
              owner: issue.ownerEmail ?? unknown,
            })}
          </p>
          <p className="tabular mt-1 text-xs text-fg-muted">
            {t('issues.money', {
              price: formatCentsPrecisely(issue.priceInCents),
              share: formatCentsPrecisely(issue.ownerShareInCents),
            })}
          </p>
        </div>
        <Badge tone={TONE[issue.status]}>{t(`issues.status.${issue.status}`)}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-bg-sunken/70 px-4 py-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-warn">
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            {t(`issues.reason.${issue.reason}`)}
          </p>
          <p className="mt-2 text-xs text-fg-subtle">{t('issues.driverSays')}</p>
          <p className="mt-0.5 text-fg">{issue.message ?? t('issues.noMessage')}</p>
        </div>
        <div className="rounded-xl bg-bg-sunken/70 px-4 py-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <MessageSquareReply className="size-3.5" aria-hidden="true" />
            {t('issues.ownerSays')}
          </p>
          <p className="mt-0.5 text-fg">{issue.ownerReply ?? t('issues.noReply')}</p>
        </div>
      </div>

      {isOpen(issue) ? (
        <div className="flex flex-wrap justify-end gap-2">
          {DECISIONS.map((decision) => (
            <Button
              key={decision}
              size="sm"
              variant={decision === 'DISMISS' ? 'outline' : 'danger'}
              onClick={() => onDecide(decision)}
            >
              {t(`issues.action.${decision}`)}
            </Button>
          ))}
        </div>
      ) : (
        <div className="text-sm text-fg-muted">
          {issue.resolvedAt !== null && (
            <p>
              {t('issues.decided', {
                date: formatMoment(issue.resolvedAt),
                reason: issue.resolutionReason ?? '',
              })}
            </p>
          )}
          {issue.refundInCents !== null && (
            <p className="tabular mt-1">
              {t('issues.refunded', { amount: formatCentsPrecisely(issue.refundInCents) })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
