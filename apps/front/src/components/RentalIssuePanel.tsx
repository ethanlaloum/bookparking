import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquareReply, TriangleAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { RentalIssue } from '../app/rental/domain/entities/RentalRequestView';
import { cn } from '../lib/cn';
import { formatCentsPrecisely, formatMoment } from '../lib/format';
import { answerIssueSchema, type AnswerIssueValues } from '../pages/rentalIssueSchemas';
import { Notice } from './Notice';
import { Button } from './ui/button';
import { Field } from './ui/field';
import { Textarea } from './ui/input';
import { Spinner } from './ui/spinner';

export interface IssueAnswer {
  pending: boolean;
  error: string | null;
  onAnswer: (reply: string) => void;
}

/**
 * Ce que chaque partie voit d'une réclamation : le motif, ce qu'en dit
 * Bookparking selon qu'elle est ouverte ou tranchée, la réponse du loueur —
 * et, pour le loueur tant qu'il n'a pas répondu, le formulaire de réponse.
 */
export const RentalIssuePanel = ({
  issue,
  perspective,
  answer,
}: {
  issue: RentalIssue;
  perspective: 'renter' | 'owner';
  answer?: IssueAnswer;
}) => {
  const { t } = useTranslation('account');
  const open = issue.status === 'OPEN';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border px-4 py-3.5 text-sm sm:basis-full',
        open ? 'border-warn/30 bg-warn-bg/50' : 'border-line bg-bg-sunken/60',
      )}
    >
      <p className={cn('flex items-center gap-2 font-medium', open ? 'text-warn' : 'text-fg')}>
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
        {t('issue.heading', {
          date: formatMoment(issue.reportedAt),
          reason: t(`issue.reason.${issue.reason}`),
        })}
      </p>
      {issue.message !== null && (
        <blockquote className="border-l-2 border-line-strong pl-3 text-fg-muted">
          {issue.message}
        </blockquote>
      )}
      <p className="text-fg">
        {t(`issue.status.${perspective}.${issue.status}`, {
          amount: issue.refundInCents === null ? '' : formatCentsPrecisely(issue.refundInCents),
        })}
      </p>
      {issue.ownerReply !== null && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
            <MessageSquareReply className="size-3.5" aria-hidden="true" />
            {t('issue.ownerReply')}
          </p>
          <p className="mt-1 text-fg">{issue.ownerReply}</p>
        </div>
      )}
      {answer !== undefined && <AnswerForm answer={answer} />}
    </div>
  );
};

const AnswerForm = ({ answer }: { answer: IssueAnswer }) => {
  const { t } = useTranslation(['account', 'common']);
  const form = useForm<AnswerIssueValues>({
    resolver: zodResolver(answerIssueSchema),
    defaultValues: { reply: '' },
  });

  return (
    <form
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit(({ reply }) => answer.onAnswer(reply.trim()))(event)
      }
      className="flex flex-col gap-3"
    >
      {answer.error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {answer.error}
        </Notice>
      )}
      <Field
        label={t('account:issue.replyLabel')}
        hint={t('account:issue.replyHint')}
        error={form.formState.errors.reply?.message}
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            placeholder={t('account:issue.replyPlaceholder')}
            className="min-h-20"
            {...form.register('reply')}
          />
        )}
      </Field>
      <Button type="submit" size="sm" disabled={answer.pending} className="self-end">
        {answer.pending && <Spinner />}
        {t('account:issue.replySubmit')}
      </Button>
    </form>
  );
};
