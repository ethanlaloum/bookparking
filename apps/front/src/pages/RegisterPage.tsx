import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import {
  registerAccountRequested,
  resetRegisterAccountState,
} from '../app/account/domain/use-cases/register-account/registerAccountEpic';
import { AuthShell } from '../components/AuthShell';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { selectRegisterError, selectRegisterLoading } from '../selectors/account/accountSelectors';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { registerSchema, type RegisterValues } from './registerSchema';

export const RegisterPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loading = useAppSelector(selectRegisterLoading);
  const error = useAppSelector(selectRegisterError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) void navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => () => void dispatch(resetRegisterAccountState()), [dispatch]);

  return (
    <AuthShell
      title={t('auth:register.title')}
      subtitle={t('auth:register.subtitle')}
      footer={
        <>
          {t('auth:register.hasAccount')}{' '}
          <Link to="/connexion" className="font-medium text-accent underline underline-offset-4">
            {t('auth:register.signIn')}
          </Link>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit((values) => dispatch(registerAccountRequested(values)))(event)}
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

        <Field
          label={t('auth:field.password')}
          hint={t('auth:field.passwordHint')}
          error={form.formState.errors.password?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
          )}
        </Field>

        <Button type="submit" size="lg" block disabled={loading} className="mt-2">
          {loading && <Spinner />}
          {t('auth:register.submit')}
        </Button>
      </form>
    </AuthShell>
  );
};
