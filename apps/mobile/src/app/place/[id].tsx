import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarRange, CircleCheck, KeyRound, MapPin, PencilLine, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  cheapestNightlyRateInCents,
  dayCountOf,
  estimateRentalPriceInCents,
  isListingAvailableOn,
} from '@front/app/listing/domain/entities/Listing';
import { getListingRequested, resetGetListingState } from '@front/app/listing/domain/use-cases/get-listing/getListingEpic';
import {
  resetUnpublishListingState,
  unpublishListingRequested,
} from '@front/app/listing/domain/use-cases/unpublish-listing/unpublishListingEpic';
import { stayFromSearchParams } from '@front/app/listing/domain/entities/SearchCriteria';
import { keepOrRenewIntent, type RentalIntent } from '@front/app/rental/domain/entities/RentalIntent';
import { problemWithRequestedPeriod } from '@front/app/rental/domain/entities/RentalRequest';
import {
  requestRentalRequested,
  resetRequestRentalState,
} from '@front/app/rental/domain/use-cases/request-rental/requestRentalEpic';
import { formatCents, formatDay, todayAsCalendarDay } from '@front/lib/format';
import { selectIsAuthenticated } from '@front/selectors/auth/authSelectors';
import {
  selectListingError,
  selectListingLoading,
  selectSelectedListing,
  selectUnpublishError,
  selectUnpublishLoading,
} from '@front/selectors/listing/listingSelectors';
import {
  selectLastRequestedRental,
  selectRequestRentalError,
  selectRequestRentalLoading,
} from '@front/selectors/rental/rentalSelectors';

import { BayScene } from '../../components/art/BayScene';
import { NoParkingSign } from '../../components/art/Glyphs';
import { CalendarSheet, formatPeriodDay } from '../../components/CalendarSheet';
import { ListingPhotoStrip } from '../../components/ListingPhotoStrip';
import { PricingGrid } from '../../components/PricingGrid';
import { VehicleBadges } from '../../components/Vehicles';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Rise, Skeleton } from '../../components/ui/Layout';
import { Notice } from '../../components/ui/Notice';
import { Display, Text, Ticket } from '../../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { useTheme } from '../../theme/useTheme';

const laterDay = (first: string, second: string): string => (first > second ? first : second);

/**
 * La fiche d'une place. Le prix affiché avant l'envoi vient de
 * `estimateRentalPriceInCents` — le report ligne à ligne du barème de l'api,
 * partagé avec le site : l'app ne recalcule rien de son côté. Le bouton de
 * réservation porte un identifiant d'intention (`RentalIntent`) : deux
 * touchers, ou un toucher rejoué après une réponse perdue, rendent la même
 * demande au lieu d'en créer une seconde.
 */
export default function ListingScreen() {
  const { id = '', paiement, arrivee, depart } = useLocalSearchParams<{
    id: string;
    paiement?: string;
    arrivee?: string;
    depart?: string;
  }>();
  const { t } = useTranslation(['listing', 'rental', 'common', 'mobile']);
  const dispatch = useAppDispatch();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  const listing = useAppSelector(selectSelectedListing);
  const loading = useAppSelector(selectListingLoading);
  const error = useAppSelector(selectListingError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const bookingError = useAppSelector(selectRequestRentalError);
  const booking = useAppSelector(selectRequestRentalLoading);
  const lastRequested = useAppSelector(selectLastRequestedRental);
  const unpublishing = useAppSelector(selectUnpublishLoading);
  const unpublishError = useAppSelector(selectUnpublishError);
  const unpublished = useAppSelector((state) => state.core.listing.unpublish.state === 'succeeded');

  const [period, setPeriod] = useState(() => {
    const searched = stayFromSearchParams(new URLSearchParams({ arrivee: arrivee ?? '', depart: depart ?? '' }));
    return { from: searched?.from ?? '', to: searched?.to ?? '' };
  });
  const [intent, setIntent] = useState<RentalIntent | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    dispatch(getListingRequested({ id }));
    return () => {
      dispatch(resetGetListingState());
      dispatch(resetRequestRentalState());
      dispatch(resetUnpublishListingState());
    };
  }, [dispatch, id]);

  // Revenir sur la fiche depuis l'écran de paiement commence une nouvelle
  // intention, comme un rechargement sur le site : la demande précédente a été
  // payée ou abandonnée, elle ne se rejoue pas.
  useFocusEffect(
    useCallback(() => {
      dispatch(resetRequestRentalState());
      setIntent(null);
    }, [dispatch]),
  );

  // La demande ouverte, le navigateur intégré part vers Stripe (c'est l'epic
  // qui l'ouvre) et l'écran de paiement prend le relais en dessous.
  const requestedId = lastRequested?.requestId ?? null;
  useEffect(() => {
    if (requestedId === null) return;
    router.push({ pathname: '/paiement/[requestId]', params: { requestId: requestedId, place: id } });
  }, [id, requestedId]);

  const top = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common:action.back')}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/recherche'))}
      hitSlop={8}
      style={{ position: 'absolute', top: insets.top + 8, left: 16, zIndex: 10, borderRadius: 20, overflow: 'hidden' }}
    >
      <BlurView tint={scheme === 'dark' ? 'dark' : 'light'} intensity={70} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft size={20} color={colors.fg} />
      </BlurView>
    </Pressable>
  );

  if (unpublished && listing === null)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.okBg }}>
          <CircleCheck size={40} color={colors.ok} />
        </View>
        <Display size={26} center>
          {t('listing:detail.unpublished')}
        </Display>
        <Button variant="outline" icon={ArrowLeft} label={t('common:action.back')} onPress={() => router.back()} />
      </View>
    );

  if (loading || (listing === null && error === null))
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {top}
        <Skeleton height={240} radius={0} />
        <View style={{ padding: 16, gap: 14 }}>
          <Skeleton height={28} style={{ width: 140 }} radius={999} />
          <Skeleton height={64} />
          <Skeleton height={120} />
        </View>
      </View>
    );

  if (error !== null || listing === null)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
        {top}
        <NoParkingSign size={96} />
        <Display size={26} center style={{ marginTop: 12 }}>
          {t('common:error.title')}
        </Display>
        <Text tone="muted" center>
          {error ?? t('common:error.unexpected')}
        </Text>
        <Button variant="outline" icon={ArrowLeft} label={t('common:action.back')} onPress={() => router.back()} style={{ marginTop: 10 }} />
      </View>
    );

  const { from: fromDay, to: toDay } = period;
  const today = todayAsCalendarDay();
  const periodProblem = problemWithRequestedPeriod({ fromDay, toDay }, today);
  const inWindow = periodProblem === null && isListingAvailableOn(listing, fromDay, toDay);
  const estimate = periodProblem === null && inWindow ? estimateRentalPriceInCents(listing.pricing, fromDay, toDay) : null;
  const canBook = isAuthenticated && periodProblem === null && inWindow && estimate !== null;
  const nightly = cheapestNightlyRateInCents(listing.pricing);
  const nights = estimate === null ? 0 : dayCountOf(fromDay, toDay);

  const book = (): void => {
    const clicked = keepOrRenewIntent(intent, { listingId: listing.id, fromDay, toDay }, () => Crypto.randomUUID());
    setIntent(clicked);
    dispatch(
      requestRentalRequested({
        address: listing.address,
        box: listing.box,
        fromDay,
        toDay,
        idempotencyKey: clicked.key,
      }),
    );
  };

  const confirmUnpublish = (): void => {
    Alert.alert(t('listing:detail.unpublish'), `${listing.address} · ${listing.box}`, [
      { text: t('common:action.cancel'), style: 'cancel' },
      { text: t('listing:detail.unpublish'), style: 'destructive', onPress: () => dispatch(unpublishListingRequested({ id: listing.id })) },
    ]);
  };

  const complete = fromDay !== '' && toDay !== '';
  // Les libellés de la barre sont courts : elle partage sa largeur avec le prix.
  // Le libellé complet du site (« Continuer vers le paiement ») reste le nom
  // accessible du bouton, lu par VoiceOver.
  const cta = !isAuthenticated
    ? { label: t('common:nav.signIn'), hint: t('rental:book.signInFirst'), onPress: () => router.push('/connexion') }
    : !complete
      ? { label: t('mobile:book.pickDates'), hint: undefined, onPress: () => setCalendarOpen(true) }
      : canBook
        ? { label: t('mobile:book.toPayment'), hint: t('rental:book.submit'), onPress: book }
        : { label: t('mobile:book.changeDates'), hint: undefined, onPress: () => setCalendarOpen(true) };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {top}
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} contentInsetAdjustmentBehavior="never">
        <View style={{ paddingTop: insets.top, backgroundColor: '#161a24' }}>
          <BayScene box={listing.box} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 36 }}>
          <Rise>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Badge tone="accent" large mono label={t('listing:card.box', { box: listing.box })} />
              <Badge
                tone="neutral"
                large
                icon={CalendarRange}
                label={t('listing:card.availableUntil', { date: formatDay(listing.availability.to) })}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <MapPin size={26} color={colors.accent} style={{ marginTop: 5 }} />
              <Display size={30} style={{ flex: 1 }}>
                {listing.address}
              </Display>
            </View>
          </Rise>

          {listing.photos.length > 0 && <ListingPhotoStrip photos={listing.photos} />}

          {/* Le séjour : les deux dates dans un même cadre, comme sur un billet. */}
          <View style={{ gap: 14 }}>
            <Display size={22}>{t('mobile:book.stay')}</Display>
            {paiement === 'abandonne' && <Notice tone="info">{t('rental:book.abandoned')}</Notice>}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('rental:book.from')} ${formatPeriodDay(fromDay)}, ${t('rental:book.to')} ${formatPeriodDay(toDay)}`}
              accessibilityHint={t('common:date.openCalendar')}
              onPress={() => setCalendarOpen(true)}
              style={{
                flexDirection: 'row',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.lineStrong,
                backgroundColor: colors.bgRaised,
                overflow: 'hidden',
              }}
            >
              {([
                ['from', t('rental:book.from'), fromDay],
                ['to', t('rental:book.to'), toDay],
              ] as const).map(([side, label, day], index) => (
                <View
                  key={side}
                  style={{ flex: 1, padding: 14, borderLeftWidth: index === 1 ? 1 : 0, borderLeftColor: colors.line }}
                >
                  <Ticket>{label}</Ticket>
                  <Display size={19} weight="semibold" tabular tone={day === '' ? 'subtle' : 'fg'} style={{ marginTop: 6 }}>
                    {formatPeriodDay(day)}
                  </Display>
                </View>
              ))}
            </Pressable>

            {periodProblem !== null && periodProblem !== 'incomplete' && (
              <Notice tone="error">{t(`rental:validation.${periodProblem}`)}</Notice>
            )}
            {periodProblem === null && !inWindow && <Notice tone="error">{t('rental:book.outOfRange')}</Notice>}
            {periodProblem === null && inWindow && estimate === null && <Notice tone="error">{t('rental:book.noPrice')}</Notice>}

            {estimate !== null && (
              <Rise>
                <View style={{ borderRadius: 16, backgroundColor: colors.bgSunken, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Text size={14} weight="medium" tone="muted">
                      {t('rental:book.estimate')}
                    </Text>
                    <Display size={34} weight="extrabold" tabular>
                      {formatCents(estimate)}
                    </Display>
                  </View>
                  <Text size={12} weight="medium" tone="muted" tabular style={{ textAlign: 'right' }}>
                    {t('common:unit.night', { count: nights })}
                  </Text>
                  <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 12 }} />
                  <Text size={12} tone="subtle">
                    {t('rental:book.estimateHint')}
                  </Text>
                </View>
              </Rise>
            )}

            {bookingError !== null && (
              <Notice tone="error" title={t('common:error.title')}>
                {bookingError}
              </Notice>
            )}
          </View>

          <View style={{ gap: 16 }}>
            <Display size={22}>{t('listing:detail.availability')}</Display>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.bgRaised,
                padding: 16,
              }}
            >
              <Display size={15} weight="semibold" tabular>
                {formatDay(listing.availability.from)}
              </Display>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.brand, justifyContent: 'center' }}>
                <View style={{ position: 'absolute', left: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.bgRaised, backgroundColor: colors.brand }} />
                <View style={{ position: 'absolute', right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.bgRaised, backgroundColor: '#598eff' }} />
              </View>
              <Display size={15} weight="semibold" tabular>
                {formatDay(listing.availability.to)}
              </Display>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            <Display size={22}>{t('listing:criteria.accepted')}</Display>
            <VehicleBadges acceptedVehicles={listing.acceptedVehicles} />
          </View>

          <View style={{ gap: 16 }}>
            <Display size={22}>{t('listing:detail.pricing')}</Display>
            <PricingGrid pricing={listing.pricing} />
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.lineStrong, borderStyle: 'dashed', paddingTop: 18, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <KeyRound size={14} color={colors.fgSubtle} />
              <Ticket>{t('listing:detail.access')}</Ticket>
            </View>
            <Text size={14} tone="muted" style={{ lineHeight: 22 }}>
              {t('listing:field.accessHint')}
            </Text>
          </View>

          {isAuthenticated && (
            <View style={{ borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, padding: 20, gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                  <KeyRound size={16} color={colors.accent} />
                </View>
                <Display size={19}>{t('listing:detail.ownerActions')}</Display>
              </View>
              <Text size={13} tone="subtle">
                {t('listing:detail.ownerHint')}
              </Text>

              {unpublishError !== null && (
                <Notice tone="error" title={t('common:error.title')}>
                  {unpublishError}
                </Notice>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={PencilLine}
                  label={t('listing:detail.edit')}
                  onPress={() => router.push({ pathname: '/modifier/[id]', params: { id: listing.id } })}
                />
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  loading={unpublishing}
                  label={t('listing:detail.unpublish')}
                  onPress={confirmUnpublish}
                />
              </View>

            </View>
          )}
        </View>
      </ScrollView>

      {/* La barre de réservation, collée en bas : le prix à gauche, le geste à droite. */}
      <BlurView
        tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        intensity={90}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          {estimate !== null ? (
            <>
              <Display size={24} weight="extrabold" tabular>
                {formatCents(estimate)}
              </Display>
              <Text size={12} tone="muted" tabular>
                {t('mobile:book.nightsLabel', { nights: t('common:unit.night', { count: nights }) })}
              </Text>
            </>
          ) : nightly !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
              <Text size={12} tone="subtle">
                {t('listing:card.from')}
              </Text>
              <Display size={24} weight="extrabold" tabular>
                {formatCents(nightly)}
              </Display>
              <Text size={12} tone="subtle">
                {t('common:unit.perNight')}
              </Text>
            </View>
          ) : (
            <Text size={14} tone="subtle">
              {t('listing:card.noPrice')}
            </Text>
          )}
        </View>
        <Button label={cta.label} accessibilityHint={cta.hint} onPress={cta.onPress} loading={booking} style={{ flex: 1 }} block />
      </BlurView>

      <CalendarSheet
        visible={calendarOpen}
        title={t('rental:book.title')}
        labels={{ from: t('rental:book.from'), to: t('rental:book.to') }}
        value={period}
        min={laterDay(today, listing.availability.from.slice(0, 10))}
        max={listing.availability.to.slice(0, 10)}
        onChange={setPeriod}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}
