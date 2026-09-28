import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { CalendarRange, Lock, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { photoDraftSourceOf } from '@front/app/listing/domain/entities/ListingPhoto';
import { VEHICLE_TYPES, type VehicleType } from '@front/app/listing/domain/entities/SearchCriteria';
import type { ListingFormValues } from '@front/lib/listingFormValues';

import { BayThumbnail } from './art/BayThumbnail';
import { CalendarSheet, formatPeriodDay } from './CalendarSheet';
import { PhotoPicker } from './PhotoPicker';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Notice } from './ui/Notice';
import { Display, Text, Ticket } from './ui/Text';
import { VEHICLE_ICON, VehicleBadges } from './Vehicles';
import { resolveApiBaseUrl } from '../lib/apiBaseUrl';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Errors = Partial<Record<keyof ListingFormValues, string>>;

const PRICES = ['dayInCents', 'weekInCents', 'monthInCents'] as const;

const isPrice = (value: string): boolean =>
  value.trim() === '' || Number.isFinite(Number(value.trim().replace(',', '.')));

interface ListingFormProps {
  initialValues: ListingFormValues;
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
  initialValues,
  placeLocked = false,
  firstSelectableDay,
  submitLabel,
  submitIcon,
  loading,
  error,
  notice,
  onSubmit,
}: ListingFormProps) => {
  const { t } = useTranslation(['listing', 'common']);
  const { colors } = useTheme();

  const [values, setValues] = useState<ListingFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]): void =>
    setValues((current) => ({ ...current, [key]: value }));

  const toggleVehicle = (vehicle: VehicleType): void => {
    void Haptics.selectionAsync();
    set(
      'acceptedVehicles',
      values.acceptedVehicles.includes(vehicle)
        ? values.acceptedVehicles.filter((candidate) => candidate !== vehicle)
        : [...values.acceptedVehicles, vehicle],
    );
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (values.address.trim() === '') found.address = t('listing:validation.address');
    if (values.box.trim() === '') found.box = t('listing:validation.box');
    if (values.accessDescription.trim() === '') found.accessDescription = t('listing:validation.access');
    if (values.photos.length === 0) found.photos = t('listing:validation.photos');
    if (values.acceptedVehicles.length === 0) found.acceptedVehicles = t('listing:criteria.acceptedRequired');
    for (const price of PRICES) if (!isPrice(values[price])) found[price] = t('listing:pricing.integer');
    if (PRICES.every((price) => values[price].trim() === '') && found.dayInCents === undefined)
      found.dayInCents = t('listing:validation.pricing');
    if (values.from === '') found.from = t('listing:validation.from');
    if (values.to === '') found.to = t('listing:validation.to');
    else if (values.from !== '' && values.to < values.from) found.to = t('listing:validation.reversed');
    return found;
  };

  const submit = (): void => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    onSubmit(values);
  };

  const firstError = Object.keys(errors).length > 0;
  const firstPhoto = values.photos[0];
  const cover = firstPhoto === undefined ? null : photoDraftSourceOf(resolveApiBaseUrl(), firstPhoto);

  return (
    <>
      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}
      {firstError && error === null && <Notice tone="error">{t('common:form.problemTitle')}</Notice>}
      {notice}

      <Step index={1} title={t('listing:publish.step.place')}>
        {placeLocked ? (
          <View style={{ flexDirection: 'row', gap: 10, borderRadius: 12, backgroundColor: colors.bgSunken, padding: 14 }}>
            <Lock size={16} color={colors.fgSubtle} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text size={15} weight="medium">
                {values.address} · <Text size={14} style={{ fontFamily: fonts.mono.medium }}>{values.box}</Text>
              </Text>
              <Text size={13} tone="subtle">
                {t('listing:edit.placeLocked')}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Field
              label={t('listing:field.address')}
              hint={t('listing:field.addressHint')}
              value={values.address}
              onChangeText={(value) => set('address', value)}
              error={errors.address}
              autoComplete="street-address"
              textContentType="fullStreetAddress"
            />
            <Field
              label={t('listing:field.box')}
              value={values.box}
              onChangeText={(value) => set('box', value)}
              error={errors.box}
              autoCapitalize="characters"
              style={{ fontFamily: fonts.mono.medium }}
            />
          </>
        )}
        <Field
          label={t('listing:field.accessDescription')}
          hint={t('listing:field.accessHint')}
          value={values.accessDescription}
          onChangeText={(value) => set('accessDescription', value)}
          error={errors.accessDescription}
          multiline
        />
        <PhotoPicker value={values.photos} onChange={(drafts) => set('photos', drafts)} error={errors.photos} />
        <View style={{ gap: 10 }}>
          <Text size={14} weight="medium">
            {t('listing:criteria.accepted')}
          </Text>
          <View accessibilityRole="list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VEHICLE_TYPES.map((vehicle) => {
              const checked = values.acceptedVehicles.includes(vehicle);
              const Icon = VEHICLE_ICON[vehicle];
              return (
                <Pressable
                  key={vehicle}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={t(`listing:criteria.vehicleType.${vehicle}`)}
                  onPress={() => toggleVehicle(vehicle)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    minHeight: 42,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: checked ? colors.brand : colors.lineStrong,
                    backgroundColor: checked ? colors.accentSoft : colors.bgRaised,
                  }}
                >
                  <Icon size={16} color={checked ? colors.accent : colors.fgMuted} />
                  <Text size={14} weight={checked ? 'semibold' : 'medium'} style={{ color: checked ? colors.accent : colors.fg }}>
                    {t(`listing:criteria.vehicleType.${vehicle}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text size={12} tone={errors.acceptedVehicles === undefined ? 'subtle' : 'danger'}>
            {errors.acceptedVehicles ?? t('listing:criteria.acceptedHint')}
          </Text>
        </View>
      </Step>

      <Step index={2} title={t('listing:publish.step.pricing')}>
        {PRICES.map((price) => (
          <Field
            key={price}
            label={t(`listing:pricing.${price.replace('InCents', '')}`)}
            value={values[price]}
            onChangeText={(value) => set(price, value)}
            error={errors[price]}
            keyboardType="decimal-pad"
            placeholder="—"
          />
        ))}
      </Step>

      <Step index={3} title={t('listing:publish.step.availability')}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('listing:field.from')} ${formatPeriodDay(values.from)}, ${t('listing:field.to')} ${formatPeriodDay(values.to)}`}
          accessibilityHint={t('common:date.openCalendar')}
          onPress={() => setCalendarOpen(true)}
          style={{
            flexDirection: 'row',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: errors.from !== undefined || errors.to !== undefined ? colors.danger : colors.lineStrong,
            backgroundColor: colors.bgRaised,
            overflow: 'hidden',
          }}
        >
          {(['from', 'to'] as const).map((side, index) => (
            <View key={side} style={{ flex: 1, padding: 14, borderLeftWidth: index === 1 ? 1 : 0, borderLeftColor: colors.line }}>
              <Ticket>{t(`listing:field.${side}`)}</Ticket>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <CalendarRange size={15} color={colors.fgSubtle} />
                <Display size={17} weight="semibold" tabular tone={values[side] === '' ? 'subtle' : 'fg'}>
                  {formatPeriodDay(values[side])}
                </Display>
              </View>
            </View>
          ))}
        </Pressable>
        {(errors.from ?? errors.to) !== undefined && (
          <Text size={12} weight="medium" tone="danger">
            {errors.from ?? errors.to}
          </Text>
        )}
      </Step>

      <View style={{ gap: 10 }}>
        <Ticket tone="accent">{t('listing:publish.preview')}</Ticket>
        <View style={{ flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgRaised, padding: 12 }}>
          {cover === null ? (
            <BayThumbnail box={values.box.trim() === '' ? '—' : values.box.trim()} width={72} height={92} />
          ) : (
            <Image source={{ uri: cover }} contentFit="cover" style={{ width: 72, height: 92, borderRadius: 12 }} />
          )}
          <View style={{ flex: 1, gap: 8 }}>
            <Display size={16} weight="semibold" leading={1.25} tone={values.address.trim() === '' ? 'subtle' : 'fg'}>
              {values.address.trim() === '' ? t('listing:publish.previewAddress') : values.address.trim()}
            </Display>
            <VehicleBadges acceptedVehicles={values.acceptedVehicles} />
          </View>
        </View>
        <Text size={12} tone="subtle">
          {t('listing:publish.previewHint')}
        </Text>
      </View>

      <Button size="lg" block icon={submitIcon} loading={loading} label={submitLabel} onPress={submit} />

      <CalendarSheet
        visible={calendarOpen}
        title={t('listing:publish.step.availability')}
        labels={{ from: t('listing:field.from'), to: t('listing:field.to') }}
        value={{ from: values.from, to: values.to }}
        min={firstSelectableDay}
        onChange={(period) => setValues((current) => ({ ...current, from: period.from, to: period.to }))}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  );
};

const Step = ({ index, title, children }: { index: number; title: string; children: ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand }}>
          <Text size={13} weight="bold" style={{ color: colors.onBrand, lineHeight: 16 }}>
            {String(index)}
          </Text>
        </View>
        <Display size={21}>{title}</Display>
      </View>
      <View style={{ gap: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgRaised, padding: 16 }}>
        {children}
      </View>
    </View>
  );
};
