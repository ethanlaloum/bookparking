import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { Notice } from '@front/components/Notice';
import { ParkingMark } from '@front/components/ParkingMark';
import { Button } from '@front/components/ui/button';
import { Field } from '@front/components/ui/field';
import { Input } from '@front/components/ui/input';
import { Spinner } from '@front/components/ui/spinner';

import {
  resetSignInState,
  signInRequested,
} from '../app/auth/domain/use-cases/sign-in/signInEpic';
import {
  selectIsAuthenticated,
  selectSignInError,
  selectSignInLoading,
  selectSignInRefusedAsNotAdmin,
} from '../selectors/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { signInSchema, type SignInValues } from './signInSchema';

export const SignInPage = () => {
  const { t } = useTranslation(['auth', 'admin', 'common']);
  const dispatch = useAppDispatch();
  const location = useLocation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectSignInLoading);
  const error = useAppSelector(selectSignInError);
  const notAdmin = useAppSelector(selectSignInRefusedAsNotAdmin);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    document.title = `${t('auth:signIn.title')} — ${t('admin:console.name')} Bookparking`;
  }, [t]);

  useEffect(() => () => void dispatch(resetSignInState()), [dispatch]);

  if (isAuthenticated) {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={typeof from === 'string' ? from : '/'} replace />;
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="animate-rise w-full max-w-md">
        <div className="flex items-center gap-3">
          <ParkingMark className="size-11" />
          <span className="label-ticket inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-2.5 py-1 text-warn ring-1 ring-warn/25 ring-inset">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {t('admin:console.name')}
          </span>
        </div>
        <h1 className="mt-8 font-display text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.02] font-bold text-fg">
          {t('auth:signIn.title')}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t('auth:signIn.subtitle')}</p>

        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit((values) => dispatch(signInRequested(values)))(event)
          }
          className="mt-10 flex flex-col gap-4"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {notAdmin ? t('auth:signIn.notAdmin') : error}
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
      </div>
    </main>
  );
};
