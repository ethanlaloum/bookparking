import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CircleCheck, Eye, Send } from 'lucide-react';
import { useEffect } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  publishListingRequested,
  resetPublishListingState,
} from '../app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { BayScene } from '../components/art/BayScene';
import { DateRangeField } from '../components/DateRangeField';
import { Notice } from '../components/Notice';
import { PricingGrid } from '../components/PricingGrid';
import { VehicleBadges } from '../components/VehicleBadges';
import { VehiclePicker } from '../components/VehiclePicker';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Field } from '../components/ui/field';
import { Input, Textarea } from '../components/ui/input';
import { Spinner } from '../components/ui/spinner';
import { cn } from '../lib/cn';
import { centsFromInput, formatDay, todayAsCalendarDay } from '../lib/format';
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
      acceptedVehicles: [],
      dayInCents: '',
      weekInCents: '',
      monthInCents: '',
      from: '',
      to: '',
    },
  });

  // `useWatch` et non `form.watch` : l'abonnement est un hook, ce que le
  // compilateur React sait mémoïser, et l'aperçu se redessine à chaque frappe.
  const watched = useWatch({ control: form.control });
  // La période passe par un composant piloté, pas par `register` : les deux
  // champs partagent un calendrier, et RHF garde la main sur leur valeur,
  // leur validation et le focus d'erreur par `field.ref`.
  const { field: fromField } = useController({ control: form.control, name: 'from' });
  const { field: toField } = useController({ control: form.control, name: 'to' });

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
        acceptedVehicles: values.acceptedVehicles,
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
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="relative grid place-items-center">
          <span aria-hidden="true" className="animate-pulse-ring absolute inset-0 rounded-full bg-ok/40" />
          <span className="relative grid size-20 place-items-center rounded-full bg-ok-bg text-ok ring-1 ring-ok/30">
            <CircleCheck className="size-10" aria-hidden="true" />
          </span>
        </span>
        <div role="status" className="animate-rise mt-8">
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight font-bold text-fg">
            {t('listing:publish.published')}
          </h1>
          <p className="mt-3 text-lg text-fg-muted">{t('listing:publish.subtitle')}</p>
        </div>
        <Link to="/recherche" className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-9`}>
          {t('listing:publish.seeIt')}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    );

  const address = (watched.address ?? '').trim();
  const box = (watched.box ?? '').trim();
  const acceptedVehicles = (watched.acceptedVehicles ?? []).filter(
    (vehicle): vehicle is PublishListingValues['acceptedVehicles'][number] => vehicle !== undefined,
  );
  const previewPricing = {
    dayInCents: centsFromInput(watched.dayInCents ?? '') ?? null,
    weekInCents: centsFromInput(watched.weekInCents ?? '') ?? null,
    monthInCents: centsFromInput(watched.monthInCents ?? '') ?? null,
  };
  const from = watched.from ?? '';
  const to = watched.to ?? '';

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-8 pb-4 sm:px-6">
      <div className="animate-rise max-w-2xl">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-none font-bold tracking-[-0.035em] text-fg">
          {t('listing:publish.title')}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t('listing:publish.subtitle')}</p>
      </div>

      <ol className="mt-8 flex flex-wrap gap-2">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-bg-raised py-1.5 pr-4 pl-1.5 text-sm"
          >
            <span className="tabular grid size-7 place-items-center rounded-full bg-brand font-mono text-xs font-semibold text-on-brand">
              {index + 1}
            </span>
            <span className="font-medium text-fg-muted">{t(`listing:publish.step.${step}`)}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <form
          noValidate
          onSubmit={(event) => void form.handleSubmit(submit)(event)}
          className="flex flex-col gap-10 lg:col-span-7 xl:col-span-8"
        >
          {error !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {error}
            </Notice>
          )}

          <fieldset className={FIELDSET}>
            <legend className={LEGEND}>
              <StepNumber value={1} />
              {t('listing:publish.step.place')}
            </legend>

            <div className={cn(CARD, 'flex flex-col gap-5')}>
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
                    className="font-mono text-sm"
                    placeholder={'photo-1.jpg\nphoto-2.jpg'}
                    {...form.register('photos')}
                  />
                )}
              </Field>
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
                min={todayAsCalendarDay()}
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
              {loading ? <Spinner /> : <Send className="size-4" aria-hidden="true" />}
              {t('listing:publish.submit')}
            </Button>
          </div>
        </form>

        {/* L'aperçu relit le formulaire à chaque frappe : ce que le
            propriétaire écrit, il le voit tel qu'un conducteur le verra. */}
        <aside className="hidden lg:col-span-5 lg:block xl:col-span-4">
          <div className="sticky top-24">
            <p className="label-ticket flex items-center gap-2 text-fg-subtle">
              <Eye className="size-3.5" aria-hidden="true" />
              {t('listing:publish.preview')}
            </p>
            <div className="mt-3 overflow-hidden rounded-3xl border border-line bg-bg-raised shadow-[var(--shadow-lift)]">
              <div className="grain relative aspect-[16/10] bg-[#161a24]">
                <BayScene box={box === '' ? '—' : box} />
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
    </div>
  );
};

// Un `<legend>` se pose sur la bordure de son `<fieldset>`, et aucun `float`
// ne l'en délivre de façon fiable : le fieldset reste donc sans cadre, et c'est
// un bloc intérieur qui porte la carte. La légende garde son rôle — nommer le
// groupe — et se lit comme un titre d'étape au-dessus de la carte.
const FIELDSET = 'm-0 min-w-0 border-0 p-0';
const LEGEND = 'mb-4 flex items-center gap-3 p-0 font-display text-xl font-bold text-fg';
const CARD = 'rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-panel)] sm:p-8';

const StepNumber = ({ value }: { value: number }) => (
  <span className="tabular grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft font-mono text-sm font-semibold text-accent">
    {value}
  </span>
);
