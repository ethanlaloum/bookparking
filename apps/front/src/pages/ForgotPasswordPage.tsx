import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import {
  requestPasswordResetRequested,
  resetRequestPasswordResetState,
} from '../app/account/domain/use-cases/request-password-reset/requestPasswordResetEpic';
import { AuthShell } from '../components/AuthShell';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import {
  selectPasswordResetSentTo,
  selectRequestPasswordResetError,
  selectRequestPasswordResetLoading,
} from '../selectors/account/accountSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { forgotPasswordSchema, type ForgotPasswordValues } from './forgotPasswordSchema';

export const ForgotPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const typedEmail = (location.state as { email?: unknown } | null)?.email;

  const loading = useAppSelector(selectRequestPasswordResetLoading);
  const error = useAppSelector(selectRequestPasswordResetError);
  const sentTo = useAppSelector(selectPasswordResetSentTo);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: typeof typedEmail === 'string' ? typedEmail : '' },
  });

  useEffect(() => () => void dispatch(resetRequestPasswordResetState()), [dispatch]);

  return (
    <AuthShell
      title={t('auth:forgotPassword.title')}
      subtitle={t('auth:forgotPassword.subtitle')}
      footer={
        <Link to="/connexion" className="font-medium text-accent underline underline-offset-4">
          {t('auth:forgotPassword.backToSignIn')}
        </Link>
      }
    >
      {sentTo !== null ? (
        <Notice tone="success" title={t('auth:forgotPassword.sentTitle')}>
          <p>{t('auth:forgotPassword.sent', { email: sentTo })}</p>
          <p className="mt-2">{t('auth:forgotPassword.spam')}</p>
        </Notice>
      ) : (
        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit((values) => dispatch(requestPasswordResetRequested(values.email)))(
              event,
            )
          }
          className="flex flex-col gap-4"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {error}
            </Notice>
          )}

          <Field label={t('auth:field.email')} error={form.formState.errors.email?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
            )}
          </Field>

          <Button type="submit" size="lg" block disabled={loading} className="mt-2">
            {loading && <Spinner />}
            {t('auth:forgotPassword.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};
