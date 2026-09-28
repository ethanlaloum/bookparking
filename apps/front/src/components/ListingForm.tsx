import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, Lock, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { photoDraftSourceOf } from '../app/listing/domain/entities/ListingPhoto';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import { centsFromInput, formatDay } from '../lib/format';
import { cn } from '../lib/cn';
import type { ListingFormValues } from '../lib/listingFormValues';
import { publishListingSchema } from '../pages/publishListingSchema';
import { BayScene } from './art/BayScene';
import { DateRangeField } from './DateRangeField';
import { Notice } from './Notice';
import { PhotoPicker } from './PhotoPicker';
import { PricingGrid } from './PricingGrid';
import { VehicleBadges } from './VehicleBadges';
import { VehiclePicker } from './VehiclePicker';
import { Button } from './ui/button';
import { Field } from './ui/field';
import { Input, Textarea } from './ui/input';
import { Spinner } from './ui/spinner';

interface ListingFormProps {
  defaultValues: ListingFormValues;
  placeLocked?: boolean;
  firstSelectableDay: string;
  submitLabel: string;
  submitIcon: LucideIcon;
  loading: boolean;
  error: string | null;
  notice?: ReactNode;
  onSubmit: (values: ListingFormValues) => void;
}

export const ListingForm = ({
  defaultValues,
  placeLocked = false,
  firstSelectableDay,
  submitLabel,
  submitIcon: SubmitIcon,
  loading,
  error,
  notice,
  onSubmit,
}: ListingFormProps) => {
  const { t } = useTranslation(['listing', 'common']);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(publishListingSchema),
    defaultValues,
  });

  const watched = useWatch({ control: form.control });
  const { field: fromField } = useController({ control: form.control, name: 'from' });
  const { field: toField } = useController({ control: form.control, name: 'to' });
  const { field: photosField } = useController({ control: form.control, name: 'photos' });

  const address = (watched.address ?? '').trim();
  const box = (watched.box ?? '').trim();
  const acceptedVehicles = (watched.acceptedVehicles ?? []).filter(
    (vehicle): vehicle is ListingFormValues['acceptedVehicles'][number] => vehicle !== undefined,
  );
  const previewPricing = {
    dayInCents: centsFromInput(watched.dayInCents ?? '') ?? null,
    weekInCents: centsFromInput(watched.weekInCents ?? '') ?? null,
    monthInCents: centsFromInput(watched.monthInCents ?? '') ?? null,
  };
  const cover = photosField.value
    .map((draft) => photoDraftSourceOf(API_BASE_URL, draft))
    .find((source) => source !== null);
  const from = watched.from ?? '';
  const to = watched.to ?? '';

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-12">
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-10 lg:col-span-7 xl:col-span-8"
      >
        {error !== null && (
          <Notice tone="error" title={t('common:error.title')}>
            {error}
          </Notice>
        )}
        {notice}

        <fieldset className={FIELDSET}>
          <legend className={LEGEND}>
            <StepNumber value={1} />
            {t('listing:publish.step.place')}
          </legend>

          <div className={cn(CARD, 'flex flex-col gap-5')}>
            {placeLocked ? (
              <div className="flex items-start gap-3 rounded-2xl bg-bg-sunken p-4">
                <Lock className="mt-1 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-fg">
                    {defaultValues.address} ·{' '}
                    <span className="font-mono text-[0.9em]">{defaultValues.box}</span>
                  </p>
                  <p className="mt-1 text-sm text-fg-subtle">{t('listing:edit.placeLocked')}</p>
                </div>
              </div>
            ) : (
              <>
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
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      className="font-mono sm:max-w-xs"
                      {...form.register('box')}
                    />
                  )}
                </Field>
              </>
            )}

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

            <VehiclePicker
              selected={acceptedVehicles}
              onToggle={(vehicle) => {
                const current = form.getValues('acceptedVehicles');
                form.setValue(
                  'acceptedVehicles',
                  current.includes(vehicle)
                    ? current.filter((value) => value !== vehicle)
                    : [...current, vehicle],
                  { shouldValidate: form.formState.isSubmitted },
                );
              }}
              error={form.formState.errors.acceptedVehicles?.message}
            />

            <PhotoPicker
              value={photosField.value}
              onChange={(drafts) => photosField.onChange(drafts)}
              error={form.formState.errors.photos?.message}
            />
          </div>
        </fieldset>

        <fieldset className={FIELDSET}>
          <legend className={LEGEND}>
            <StepNumber value={2} />
            {t('listing:publish.step.pricing')}
          </legend>
          <div className={cn(CARD, 'grid gap-4 sm:grid-cols-3')}>
            {(['dayInCents', 'weekInCents', 'monthInCents'] as const).map((name) => (
              <Field
                key={name}
                label={t(`listing:pricing.${name.replace('InCents', '')}`)}
                error={form.formState.errors[name]?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <div className="relative">
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      inputMode="decimal"
                      placeholder="—"
                      className="tabular pr-9 font-display text-lg font-semibold"
                      {...form.register(name)}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-fg-subtle"
                    >
                      €
                    </span>
                  </div>
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <fieldset className={FIELDSET}>
          <legend className={LEGEND}>
            <StepNumber value={3} />
            {t('listing:publish.step.availability')}
          </legend>
          <div className={CARD}>
            <DateRangeField
              variant="split"
              months={2}
              labels={{ from: t('listing:field.from'), to: t('listing:field.to') }}
              value={{ from: fromField.value, to: toField.value }}
              onChange={(period) => {
                if (period.from !== fromField.value) fromField.onChange(period.from);
                if (period.to !== toField.value) toField.onChange(period.to);
              }}
              min={firstSelectableDay}
              errors={{
                from: form.formState.errors.from?.message,
                to: form.formState.errors.to?.message,
              }}
              inputRefs={{ from: fromField.ref, to: toField.ref }}
              onBlur={{ from: fromField.onBlur, to: toField.onBlur }}
            />
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <Spinner /> : <SubmitIcon className="size-4" aria-hidden="true" />}
            {submitLabel}
          </Button>
        </div>
      </form>

      <aside className="hidden lg:col-span-5 lg:block xl:col-span-4">
        <div className="sticky top-24">
          <p className="label-ticket flex items-center gap-2 text-fg-subtle">
            <Eye className="size-3.5" aria-hidden="true" />
            {t('listing:publish.preview')}
          </p>
          <div className="mt-3 overflow-hidden rounded-3xl border border-line bg-bg-raised shadow-[var(--shadow-lift)]">
            <div className="grain relative aspect-[16/10] bg-[#161a24]">
              {cover === undefined ? (
                <BayScene box={box === '' ? '—' : box} />
              ) : (
                <img src={cover} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="p-5">
              <p className="font-mono text-xs font-medium text-accent">
                {t('listing:card.box', { box: box === '' ? '—' : box })}
              </p>
              <p
                className={cn(
                  'mt-1.5 font-display text-xl leading-snug font-semibold',
                  address === '' ? 'text-fg-subtle' : 'text-fg',
                )}
              >
                {address === '' ? t('listing:publish.previewAddress') : address}
              </p>
              {from !== '' && to !== '' && (
                <p className="tabular mt-1.5 text-xs text-fg-subtle">
                  {formatDay(`${from}T00:00:00.000Z`)} → {formatDay(`${to}T00:00:00.000Z`)}
                </p>
              )}
              <VehicleBadges acceptedVehicles={acceptedVehicles} className="mt-4" />
              <div className="mt-5">
                <PricingGrid pricing={previewPricing} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">{t('listing:publish.previewHint')}</p>
        </div>
      </aside>
    </div>
  );
};

const FIELDSET = 'm-0 min-w-0 border-0 p-0';
const LEGEND = 'mb-4 flex items-center gap-3 p-0 font-display text-xl font-bold text-fg';
const CARD = 'rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-panel)] sm:p-8';

const StepNumber = ({ value }: { value: number }) => (
  <span className="tabular grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft font-mono text-sm font-semibold text-accent">
    {value}
  </span>
);
