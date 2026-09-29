import { MessageSquareReply, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  ISSUE_TEXT_MAXIMUM_LENGTH,
  ISSUE_TEXT_MINIMUM_LENGTH,
  type RentalIssue,
  type RentalIssueReason,
} from '@front/app/rental/domain/entities/RentalRequestView';
import { answerRentalIssueRequested } from '@front/app/rental/domain/use-cases/answer-rental-issue/answerRentalIssueEpic';
import { reportRentalIssueRequested } from '@front/app/rental/domain/use-cases/report-rental-issue/reportRentalIssueEpic';
import { formatCentsPrecisely, formatMoment } from '@front/lib/format';
import {
  answerIssueStateFor,
  selectAnswerIssue,
  selectReportIssueError,
  selectReportIssueLoading,
} from '@front/selectors/rental/rentalSelectors';

import { useAppDispatch, useAppSelector } from '../store/redux';
import { useTheme } from '../theme/useTheme';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Notice } from './ui/Notice';
import { Segmented } from './ui/Segmented';
import { Text } from './ui/Text';

const REASONS: readonly RentalIssueReason[] = ['NO_ACCESS', 'PLACE_OCCUPIED', 'OTHER'];

// La règle des schémas du site (`rentalIssueSchemas`), recopiée ici : ils
// passent par l'i18n du site, que l'app ne charge pas.
const textError = (text: string, required: boolean): 'message' | 'tooLong' | null => {
  const length = text.trim().length;
  if (length > ISSUE_TEXT_MAXIMUM_LENGTH) return 'tooLong';
  if (required && length < ISSUE_TEXT_MINIMUM_LENGTH) return 'message';
  return null;
};

/**
 * Le formulaire de réclamation, déplié dans la carte comme la suppression du
 * compte : le motif, des précisions facultatives sauf pour « Autre », et
 * l'envoi. L'écran le referme une fois la réclamation enregistrée.
 */
export const ReportIssueForm = ({ requestId, onClose }: { requestId: string; onClose: () => void }) => {
  const { t } = useTranslation(['account', 'common']);
  const dispatch = useAppDispatch();
  const pending = useAppSelector(selectReportIssueLoading);
  const error = useAppSelector(selectReportIssueError);
  const [reason, setReason] = useState<RentalIssueReason>('NO_ACCESS');
  const [message, setMessage] = useState('');
  const [invalid, setInvalid] = useState<'message' | 'tooLong' | null>(null);

  const submit = () => {
    const problem = textError(message, reason === 'OTHER');
    setInvalid(problem);
    if (problem !== null) return;
    dispatch(
      reportRentalIssueRequested({
        requestId,
        report: { reason, message: message.trim() === '' ? null : message.trim() },
      }),
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <Text size={14} tone="muted">
        {t('account:issue.intro')}
      </Text>
      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}
      <Segmented
        label={t('account:issue.reasonLabel')}
        scrollable
        options={REASONS.map((value) => ({ value, label: t(`account:issue.reason.${value}`) }))}
        value={reason}
        onChange={setReason}
      />
      <Field
        label={t('account:issue.message')}
        hint={t('account:issue.messageHint')}
        placeholder={t('account:issue.messagePlaceholder')}
        value={message}
        onChangeText={setMessage}
        error={invalid === null ? undefined : t(`account:issue.validation.${invalid}`)}
        multiline
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Button variant="danger" loading={pending} label={t('account:issue.submit')} onPress={submit} />
        <Button variant="ghost" disabled={pending} label={t('account:issue.close')} onPress={onClose} />
      </View>
    </View>
  );
};

/**
 * Ce que chaque partie voit d'une réclamation — le panneau du site. Le loueur
 * qui n'a pas encore répondu y trouve le champ de sa réponse.
 */
export const RentalIssuePanel = ({
  requestId,
  issue,
  perspective,
  answerable = false,
}: {
  requestId: string;
  issue: RentalIssue;
  perspective: 'renter' | 'owner';
  answerable?: boolean;
}) => {
  const { t } = useTranslation(['account', 'common']);
  const { colors } = useTheme();
  const open = issue.status === 'OPEN';

  return (
    <View
      style={{
        gap: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: open ? colors.warnLine : colors.line,
        backgroundColor: open ? colors.warnBg : colors.bgSunken,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TriangleAlert size={15} color={open ? colors.warn : colors.fg} />
        <Text size={13} weight="medium" tone={open ? 'warn' : undefined} style={{ flex: 1 }}>
          {t('account:issue.heading', {
            date: formatMoment(issue.reportedAt),
            reason: t(`account:issue.reason.${issue.reason}`),
          })}
        </Text>
      </View>
      {issue.message !== null && (
        <Text size={13} tone="muted" style={{ borderLeftWidth: 2, borderLeftColor: colors.line, paddingLeft: 10 }}>
          {issue.message}
        </Text>
      )}
      <Text size={13}>
        {t(`account:issue.status.${perspective}.${issue.status}`, {
          amount: issue.refundInCents === null ? '' : formatCentsPrecisely(issue.refundInCents),
        })}
      </Text>
      {issue.ownerReply !== null && (
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MessageSquareReply size={13} color={colors.fgSubtle} />
            <Text size={12} weight="medium" tone="subtle">
              {t('account:issue.ownerReply')}
            </Text>
          </View>
          <Text size={13}>{issue.ownerReply}</Text>
        </View>
      )}
      {answerable && <AnswerForm requestId={requestId} />}
    </View>
  );
};

const AnswerForm = ({ requestId }: { requestId: string }) => {
  const { t } = useTranslation(['account', 'common']);
  const dispatch = useAppDispatch();
  const { pending, error } = answerIssueStateFor(useAppSelector(selectAnswerIssue), requestId);
  const [reply, setReply] = useState('');
  const [invalid, setInvalid] = useState<'message' | 'tooLong' | null>(null);

  const submit = () => {
    const problem = textError(reply, true);
    setInvalid(problem);
    if (problem === null) dispatch(answerRentalIssueRequested({ requestId, reply: reply.trim() }));
  };

  return (
    <View style={{ gap: 10 }}>
      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}
      <Field
        label={t('account:issue.replyLabel')}
        hint={t('account:issue.replyHint')}
        placeholder={t('account:issue.replyPlaceholder')}
        value={reply}
        onChangeText={setReply}
        error={invalid === null ? undefined : t(`account:issue.validation.${invalid}`)}
        multiline
      />
      <Button size="sm" loading={pending} label={t('account:issue.replySubmit')} onPress={submit} style={{ alignSelf: 'flex-start' }} />
    </View>
  );
};
