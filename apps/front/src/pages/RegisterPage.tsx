import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { DEFAULT_AVATAR } from '../app/account/domain/entities/Avatar';
import { humanProofRequested } from '../app/account/domain/use-cases/human-proof/humanProofEpic';
import {
  registerAccountRequested,
  resetRegisterAccountState,
} from '../app/account/domain/use-cases/register-account/registerAccountEpic';
import { AuthShell } from '../components/AuthShell';
import { AvatarPicker } from '../components/AvatarPicker';
import { HumanCheck } from '../components/HumanCheck';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import {
  selectHumanProof,
  selectHumanProofFailed,
  selectRegisterError,
  selectRegisterLoading,
} from '../selectors/account/accountSelectors';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { registerSchema, type RegisterValues } from './registerSchema';

const LEGAL_LINK = 'font-medium text-accent underline underline-offset-4';

export const RegisterPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loading = useAppSelector(selectRegisterLoading);
  const error = useAppSelector(selectRegisterError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const humanProof = useAppSelector(selectHumanProof);
  const humanProofFailed = useAppSelector(selectHumanProofFailed);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptsTerms: false,
      avatar: DEFAULT_AVATAR,
    },
  });
  const password = useWatch({ control: form.control, name: 'password' });

  // La preuve se calcule dès l'ouverture, pendant que le formulaire se remplit.
  useEffect(() => {
    dispatch(humanProofRequested());
  }, [dispatch]);

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
        onSubmit={(event) =>
          void form.handleSubmit((values) => {
            if (humanProof === null) return;
            dispatch(
              registerAccountRequested({
                email: values.email,
                password: values.password,
                humanProof,
                acceptsTerms: values.acceptsTerms,
                avatar: values.avatar,
              }),
            );
          })(event)
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

        <PasswordStrengthMeter password={password} />

        <Field
          label={t('auth:field.confirmPassword')}
          error={form.formState.errors.confirmPassword?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
          )}
        </Field>

        <Controller
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <AvatarPicker name="register-avatar" value={field.value} onChange={field.onChange} />
          )}
        />

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg">
            <input
              type="checkbox"
              aria-invalid={form.formState.errors.acceptsTerms !== undefined}
              aria-describedby={form.formState.errors.acceptsTerms === undefined ? undefined : 'accepts-terms-error'}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--brand)]"
              {...form.register('acceptsTerms')}
            />
            <span>
              <Trans
                i18nKey="auth:register.acceptTerms"
                components={{ terms: <Link to="/conditions-d-utilisation" className={LEGAL_LINK} /> }}
              />
            </span>
          </label>
          {form.formState.errors.acceptsTerms?.message !== undefined && (
            <p id="accepts-terms-error" className="text-xs font-medium text-danger">
              {form.formState.errors.acceptsTerms.message}
            </p>
          )}
        </div>

        <HumanCheck ready={humanProof !== null} failed={humanProofFailed} />

        <Button type="submit" size="lg" block disabled={loading || humanProof === null} className="mt-2">
          {loading && <Spinner />}
          {t('auth:register.submit')}
        </Button>

        <p className="text-center text-sm text-fg-subtle">
          <Trans
            i18nKey="auth:register.privacy"
            components={{ privacy: <Link to="/donnees-personnelles" className={LEGAL_LINK} /> }}
          />
        </p>
      </form>
    </AuthShell>
  );
};
