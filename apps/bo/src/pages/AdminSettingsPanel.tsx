import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Notice } from '@front/components/Notice';
import { Button } from '@front/components/ui/button';
import { Field } from '@front/components/ui/field';
import { Input, Textarea } from '@front/components/ui/input';
import { Skeleton } from '@front/components/ui/skeleton';
import { Spinner } from '@front/components/ui/spinner';

import {
  changedSettings,
  PLATFORM_SETTINGS,
  type PlatformSettingsForm,
} from '../app/back-office/domain/entities/PlatformSettings';
import {
  changePlatformSettingsRequested,
  resetChangePlatformSettings,
} from '../app/back-office/domain/use-cases/change-platform-settings/changePlatformSettingsEpic';
import { readPlatformSettingsRequested } from '../app/back-office/domain/use-cases/read-platform-settings/readPlatformSettingsEpic';
import {
  selectChangeSettingsError,
  selectChangeSettingsPending,
  selectChangeSettingsSuccess,
  selectPlatformSettingsError,
  selectPlatformSettingsForm,
} from '../selectors/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { settingsSchemaFor, type SettingsValues } from './settingsSchema';

export const AdminSettingsPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const form = useAppSelector(selectPlatformSettingsForm);
  const readError = useAppSelector(selectPlatformSettingsError);
  const saved = useAppSelector(selectChangeSettingsSuccess);

  useEffect(() => {
    dispatch(readPlatformSettingsRequested());
  }, [dispatch]);

  useEffect(() => () => void dispatch(resetChangePlatformSettings()), [dispatch]);

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-fg-subtle">{t('admin:settings.subtitle')}</p>

      {readError !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-4">
          {readError}
        </Notice>
      )}
      {saved && (
        <Notice tone="success" className="mt-4">
          {t('admin:settings.saved')}
        </Notice>
      )}

      <div className="mt-6">
        {form === null && readError === null && <Skeleton className="h-96" />}
        {/* La clé remonte le formulaire sur chaque version relue : ses valeurs
            par défaut redeviennent celles en vigueur, et le motif se vide,
            sans aucun setState dans un effet. */}
        {form !== null && <SettingsForm key={JSON.stringify(form.settings)} form={form} />}
      </div>

      <Link
        to="/journal"
        className="mt-6 inline-block text-sm font-medium text-accent underline underline-offset-4"
      >
        {t('admin:settings.history')}
      </Link>
    </div>
  );
};

const SettingsForm = ({ form }: { form: PlatformSettingsForm }) => {
  const { t } = useTranslation(['admin', 'common']);
  const dispatch = useAppDispatch();
  const pending = useAppSelector(selectChangeSettingsPending);
  const error = useAppSelector(selectChangeSettingsError);

  const schema = useMemo(() => settingsSchemaFor(form), [form]);
  const values = useForm<SettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...form.settings, reason: '' },
  });
  const watched = useWatch({ control: values.control });
  const unchanged =
    changedSettings(form.settings, {
      platformFeePercent: Number(watched.platformFeePercent),
      freeCancellationHours: Number(watched.freeCancellationHours),
      requestExpiryHours: Number(watched.requestExpiryHours),
      payoutReleaseDelayHours: Number(watched.payoutReleaseDelayHours),
    }).length === 0;

  return (
    <form
      noValidate
      onSubmit={(event) =>
        void values.handleSubmit(({ reason, ...settings }) =>
          dispatch(changePlatformSettingsRequested({ settings, reason: reason.trim() })),
        )(event)
      }
      className="flex flex-col gap-6 rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow-panel)] sm:p-6"
    >
      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {PLATFORM_SETTINGS.map((setting) => {
          const bounds = form.bounds[setting];
          return (
            <Field
              key={setting}
              label={t(`admin:settings.field.${setting}.label`)}
              hint={t(`admin:settings.field.${setting}.hint`, { min: bounds.min, max: bounds.max })}
              error={values.formState.errors[setting]?.message}
            >
              {({ id, describedBy, invalid }) => (
                <div className="flex items-center gap-3">
                  <Input
                    id={id}
                    type="number"
                    inputMode={bounds.decimals === 0 ? 'numeric' : 'decimal'}
                    min={bounds.min}
                    max={bounds.max}
                    step={bounds.decimals === 0 ? 1 : 0.01}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className="tabular w-32"
                    {...values.register(setting, { valueAsNumber: true })}
                  />
                  <span className="text-sm text-fg-muted">
                    {t(`admin:settings.field.${setting}.unit`)}
                  </span>
                </div>
              )}
            </Field>
          );
        })}
      </div>

      <Field
        label={t('admin:settings.reason')}
        hint={t('admin:settings.reasonHint')}
        error={values.formState.errors.reason?.message}
      >
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            placeholder={t('admin:settings.reasonPlaceholder')}
            {...values.register('reason')}
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {unchanged && <p className="text-sm text-fg-subtle">{t('admin:settings.unchanged')}</p>}
        <Button type="submit" disabled={pending || unchanged}>
          {pending && <Spinner />}
          {t('admin:settings.submit')}
        </Button>
      </div>
    </form>
  );
};
