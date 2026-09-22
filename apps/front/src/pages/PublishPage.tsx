import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  publishListingRequested,
  resetPublishListingState,
} from '../app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Field } from '../components/ui/field';
import { Input, Textarea } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { centsFromInput, todayAsCalendarDay } from '../lib/format';
import {
  selectPublishError,
  selectPublishLoading,
  selectPublishSuccess,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { publishListingSchema, type PublishListingValues } from './publishListingSchema';

const STEPS = ['place', 'pricing', 'availability'] as const;

export const PublishPage = () => {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectPublishLoading);
  const error = useAppSelector(selectPublishError);
  const success = useAppSelector(selectPublishSuccess);

  const form = useForm<PublishListingValues>({
    resolver: zodResolver(publishListingSchema),
    defaultValues: {
      address: '',
      box: '',
      accessDescription: '',
      photos: '',
      dayInCents: '',
      weekInCents: '',
      monthInCents: '',
      from: '',
      to: '',
    },
  });

  useEffect(() => () => void dispatch(resetPublishListingState()), [dispatch]);

  const submit = (values: PublishListingValues): void => {
    dispatch(
      publishListingRequested({
        address: values.address,
        box: values.box,
        accessDescription: values.accessDescription,
        photos: values.photos
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== ''),
        pricing: {
          dayInCents: centsFromInput(values.dayInCents),
          weekInCents: centsFromInput(values.weekInCents),
          monthInCents: centsFromInput(values.monthInCents),
        },
        availability: {
          from: new Date(`${values.from}T00:00:00.000Z`).toISOString(),
          to: new Date(`${values.to}T00:00:00.000Z`).toISOString(),
        },
      }),
    );
  };

  if (success)
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <Notice tone="success" title={t('listing:publish.published')}>
          {t('listing:publish.subtitle')}
        </Notice>
        <Link to="/" className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-7`}>
          {t('listing:publish.seeIt')}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fg">
        {t('listing:publish.title')}
      </h1>
      <p className="mt-2.5 text-fg-muted">{t('listing:publish.subtitle')}</p>

      <ol className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2 text-sm">
            <span className="tabular flex size-6 items-center justify-center rounded-[2px] bg-accent text-xs font-semibold text-on-accent">
              {index + 1}
            </span>
            <span className="font-medium text-fg-muted">{t(`listing:publish.step.${step}`)}</span>
          </li>
        ))}
      </ol>

      <form noValidate onSubmit={(event) => void form.handleSubmit(submit)(event)} className="mt-9 flex flex-col gap-10">
        {error !== null && (
          <Notice tone="error" title={t('common:error.title')}>
            {error}
          </Notice>
        )}

        <fieldset className="flex flex-col gap-5">
          <legend className="font-display text-lg font-semibold text-fg">
            {t('listing:publish.step.place')}
          </legend>

          <Field
            label={t('listing:field.address')}
            hint={t('listing:field.addressHint')}
            error={form.formState.errors.address?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...form.register('address')} />
            )}
          </Field>

          <Field label={t('listing:field.box')} error={form.formState.errors.box?.message}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...form.register('box')} />
            )}
          </Field>

          <Field
            label={t('listing:field.accessDescription')}
            hint={t('listing:field.accessHint')}
            error={form.formState.errors.accessDescription?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...form.register('accessDescription')}
              />
            )}
          </Field>

          <Field
            label={t('listing:field.photos')}
            hint={t('listing:field.photosHint')}
            error={form.formState.errors.photos?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                placeholder={'photo-1.jpg\nphoto-2.jpg'}
                {...form.register('photos')}
              />
            )}
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="font-display text-lg font-semibold text-fg">
            {t('listing:publish.step.pricing')}
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['dayInCents', 'weekInCents', 'monthInCents'] as const).map((name) => (
              <Field
                key={name}
                label={t(`listing:pricing.${name.replace('InCents', '')}`)}
                error={form.formState.errors[name]?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    inputMode="decimal"
                    placeholder="—"
                    {...form.register(name)}
                  />
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="font-display text-lg font-semibold text-fg">
            {t('listing:publish.step.availability')}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('listing:field.from')} error={form.formState.errors.from?.message}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  type="date"
                  min={todayAsCalendarDay()}
                  {...form.register('from')}
                />
              )}
            </Field>
            <Field label={t('listing:field.to')} error={form.formState.errors.to?.message}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  type="date"
                  min={todayAsCalendarDay()}
                  {...form.register('to')}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <Button type="submit" size="lg" disabled={loading} className="self-start">
          {loading && <Spinner />}
          {t('listing:publish.submit')}
        </Button>
      </form>
    </div>
  );
};
