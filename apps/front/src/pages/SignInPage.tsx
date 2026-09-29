import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { signInRequested, resetSignInState } from '../app/auth/domain/use-cases/sign-in/signInEpic';
import { AuthShell } from '../components/AuthShell';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import {
  selectSignInError,
  selectSignInLoading,
  selectSignInSuccess,
} from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { signInSchema, type SignInValues } from './signInSchema';

export const SignInPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loading = useAppSelector(selectSignInLoading);
  const error = useAppSelector(selectSignInError);
  const success = useAppSelector(selectSignInSuccess);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (success) void navigate('/', { replace: true });
  }, [navigate, success]);

  useEffect(() => () => void dispatch(resetSignInState()), [dispatch]);

  return (
    <AuthShell
      title={t('auth:signIn.title')}
      subtitle={t('auth:signIn.subtitle')}
      footer={
        <>
          {t('auth:signIn.noAccount')}{' '}
          <Link to="/inscription" className="font-medium text-accent underline underline-offset-4">
            {t('auth:signIn.createOne')}
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit((values) => dispatch(signInRequested(values)))(event)}
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

        <Field label={t('auth:field.password')} error={form.formState.errors.password?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
          )}
        </Field>

        <Button type="submit" size="lg" block disabled={loading} className="mt-2">
          {loading && <Spinner />}
          {t('auth:signIn.submit')}
        </Button>
      </form>
    </AuthShell>
  );
};
