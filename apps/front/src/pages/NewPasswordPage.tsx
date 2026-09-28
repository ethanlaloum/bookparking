import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import {
  chooseNewPasswordRequested,
  resetChooseNewPasswordState,
} from '../app/account/domain/use-cases/choose-new-password/chooseNewPasswordEpic';
import { AuthShell } from '../components/AuthShell';
import { Notice } from '../components/Notice';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import {
  selectChooseNewPasswordError,
  selectChooseNewPasswordLoading,
  selectChooseNewPasswordSuccess,
} from '../selectors/account/accountSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { newPasswordSchema, type NewPasswordValues } from './newPasswordSchema';

export const NewPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('jeton') ?? '';

  const loading = useAppSelector(selectChooseNewPasswordLoading);
  const error = useAppSelector(selectChooseNewPasswordError);
  const success = useAppSelector(selectChooseNewPasswordSuccess);

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = useWatch({ control: form.control, name: 'password' });

  useEffect(() => () => void dispatch(resetChooseNewPasswordState()), [dispatch]);

  const askAgain = (
    <Link to="/mot-de-passe-oublie" className="font-medium text-accent underline underline-offset-4">
      {t('auth:newPassword.askAgain')}
    </Link>
  );

  return (
    <AuthShell
      title={t('auth:newPassword.title')}
      subtitle={t('auth:newPassword.subtitle')}
      footer={askAgain}
    >
      {token === '' ? (
        <Notice tone="error" title={t('common:error.title')}>
          {t('auth:newPassword.missingLink')}
        </Notice>
      ) : success ? (
        <>
          <Notice tone="success" title={t('auth:newPassword.doneTitle')}>
            {t('auth:newPassword.done')}
          </Notice>
          <Link to="/connexion" className={buttonVariants({ variant: 'primary', size: 'lg', block: true })}>
            {t('auth:newPassword.signIn')}
          </Link>
        </>
      ) : (
        <form
          noValidate
          onSubmit={(event) =>
            void form.handleSubmit((values) =>
              dispatch(chooseNewPasswordRequested({ token, newPassword: values.password })),
            )(event)
          }
          className="flex flex-col gap-4"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {error}
            </Notice>
          )}

          <Field
            label={t('auth:field.newPassword')}
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

          <Button type="submit" size="lg" block disabled={loading} className="mt-2">
            {loading && <Spinner />}
            {t('auth:newPassword.submit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};
