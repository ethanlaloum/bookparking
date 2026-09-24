import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowRight, CalendarRange, Check, Send, X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VEHICLE_TYPES, type VehicleType } from '@front/app/listing/domain/entities/SearchCriteria';
import {
  publishListingRequested,
  resetPublishListingState,
} from '@front/app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { centsFromInput, todayAsCalendarDay } from '@front/lib/format';
import {
  selectPublishError,
  selectPublishLoading,
  selectPublishSuccess,
} from '@front/selectors/listing/listingSelectors';

import { BayThumbnail } from '../components/art/BayThumbnail';
import { CalendarSheet, formatPeriodDay } from '../components/CalendarSheet';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Rise } from '../components/ui/Layout';
import { Notice } from '../components/ui/Notice';
import { Display, Text, Ticket } from '../components/ui/Text';
import { VEHICLE_ICON, VehicleBadges } from '../components/Vehicles';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

interface Values {
  address: string;
  box: string;
  accessDescription: string;
  photos: string;
  acceptedVehicles: VehicleType[];
  dayInCents: string;
  weekInCents: string;
  monthInCents: string;
  from: string;
  to: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const PRICES = ['dayInCents', 'weekInCents', 'monthInCents'] as const;

const EMPTY: Values = {
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
};

const isPrice = (value: string): boolean =>
  value.trim() === '' || Number.isFinite(Number(value.trim().replace(',', '.')));

/**
 * La publication, en trois étapes comme sur le site : la place, les tarifs, la
 * période. Les règles sont celles de `publishListingSchema` ; la charge envoyée
 * est la même, palier vide compris — absent, jamais `null`, que l'api
 * refuserait en 400.
 */
export default function PublishScreen() {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const loading = useAppSelector(selectPublishLoading);
  const error = useAppSelector(selectPublishError);
  const success = useAppSelector(selectPublishSuccess);

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => () => void dispatch(resetPublishListingState()), [dispatch]);

  useEffect(() => {
    if (success) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [success]);

  const set = <K extends keyof Values>(key: K, value: Values[K]): void =>
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
    if (values.photos.trim() === '') found.photos = t('listing:validation.photos');
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
    dispatch(
      publishListingRequested({
        address: values.address.trim(),
        box: values.box.trim(),
        accessDescription: values.accessDescription.trim(),
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
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.okBg, borderWidth: 1, borderColor: colors.okLine }}>
          <Check size={42} color={colors.ok} strokeWidth={2.5} />
        </View>
        <Rise style={{ alignItems: 'center', marginTop: 28 }}>
          <Display size={30} center accessibilityLiveRegion="polite">
            {t('listing:publish.published')}
          </Display>
          <Text size={17} tone="muted" center style={{ marginTop: 10 }}>
            {t('listing:publish.subtitle')}
          </Text>
        </Rise>
        <Button
          size="lg"
          trailingIcon={ArrowRight}
          label={t('listing:publish.seeIt')}
          style={{ marginTop: 32 }}
          onPress={() => {
            router.dismissAll();
            router.navigate('/recherche');
          }}
        />
      </View>
    );

  const firstError = Object.keys(errors).length > 0;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Rise style={{ flex: 1 }}>
            <Display size={34}>{t('listing:publish.title')}</Display>
            <Text tone="muted" style={{ marginTop: 8 }}>
              {t('listing:publish.subtitle')}
            </Text>
          </Rise>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:action.close')}
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSunken }}
          >
            <X size={18} color={colors.fg} />
          </Pressable>
        </View>

        {error !== null && (
          <Notice tone="error" title={t('common:error.title')}>
            {error}
          </Notice>
        )}
        {firstError && error === null && <Notice tone="error">{t('common:form.problemTitle')}</Notice>}

        <Step index={1} title={t('listing:publish.step.place')}>
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
          <Field
            label={t('listing:field.accessDescription')}
            hint={t('listing:field.accessHint')}
            value={values.accessDescription}
            onChangeText={(value) => set('accessDescription', value)}
            error={errors.accessDescription}
            multiline
          />
          <Field
            label={t('listing:field.photos')}
            hint={t('listing:field.photosHint')}
            value={values.photos}
            onChangeText={(value) => set('photos', value)}
            error={errors.photos}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={{ fontFamily: fonts.mono.medium, fontSize: 14 }}
          />
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

        {/* L'aperçu : ce que verront les conducteurs, mis à jour à chaque frappe. */}
        <View style={{ gap: 10 }}>
          <Ticket tone="accent">{t('listing:publish.preview')}</Ticket>
          <View style={{ flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgRaised, padding: 12 }}>
            <BayThumbnail box={values.box.trim() === '' ? '—' : values.box.trim()} width={72} height={92} />
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

        <Button size="lg" block icon={Send} loading={loading} label={t('listing:publish.submit')} onPress={submit} />
      </ScrollView>

      <CalendarSheet
        visible={calendarOpen}
        title={t('listing:publish.step.availability')}
        labels={{ from: t('listing:field.from'), to: t('listing:field.to') }}
        value={{ from: values.from, to: values.to }}
        min={todayAsCalendarDay()}
        onChange={(period) => setValues((current) => ({ ...current, from: period.from, to: period.to }))}
        onClose={() => setCalendarOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

/** Une étape du formulaire : son numéro en pastille bleue, son nom, ses champs dans une carte. */
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
