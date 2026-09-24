import { router } from 'expo-router';
import { ArrowRight, CalendarRange, KeyRound, MapPinned, Plus, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { EMPTY_CRITERIA } from '@front/app/listing/domain/entities/SearchCriteria';
import { listListingsRequested } from '@front/app/listing/domain/use-cases/list-listings/listListingsEpic';
import { formatCents } from '@front/lib/format';
import { selectIsAuthenticated } from '@front/selectors/auth/authSelectors';
import {
  selectCheapestRateInCents,
  selectListings,
  selectListingsError,
  selectListingsLoaded,
  selectListingsLoading,
} from '@front/selectors/listing/listingSelectors';

import { AddressSheet } from '../../components/AddressSheet';
import { FranceMap } from '../../components/art/FranceMap';
import { ParkingMark } from '../../components/art/Glyphs';
import { InkSurface } from '../../components/art/InkSurface';
import { AddressField } from '../../components/SearchFilters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Rise, SectionTitle, useTabBarSpace } from '../../components/ui/Layout';
import { Display, Text, Ticket } from '../../components/ui/Text';
import { criteriaToRouteParams } from '../../lib/searchParams';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { fonts, palette } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

const STEPS: readonly { key: string; icon: LucideIcon }[] = [
  { key: 'search', icon: MapPinned },
  { key: 'dates', icon: CalendarRange },
  { key: 'park', icon: KeyRound },
];

/**
 * L'accueil du site, à la taille d'un téléphone : le hero d'encre et sa
 * recherche, « comment ça marche » en trois gestes, les trois arguments,
 * l'appel aux propriétaires. Les annonces ne sont pas listées ici — la
 * recherche s'en charge — mais elles donnent les deux seuls chiffres de la
 * page, le tarif d'appel et le nombre de places, qui doivent être vrais.
 */
export default function HomeScreen() {
  const { t } = useTranslation(['listing', 'common', 'account', 'mobile']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const [addressOpen, setAddressOpen] = useState(false);

  const listings = useAppSelector(selectListings);
  const loaded = useAppSelector(selectListingsLoaded);
  const loading = useAppSelector(selectListingsLoading);
  const failed = useAppSelector(selectListingsError) !== null;
  const cheapest = useAppSelector(selectCheapestRateInCents);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!loaded && !loading && !failed) dispatch(listListingsRequested());
  }, [dispatch, failed, loaded, loading]);

  const goToSearch = (params = criteriaToRouteParams(EMPTY_CRITERIA)): void => {
    router.navigate({ pathname: '/recherche', params });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: tabBarSpace }}
      contentInsetAdjustmentBehavior="never"
    >
      {/* Le hero : l'encre, le titre surligné au jaune des marquages, la recherche. */}
      <View style={{ paddingHorizontal: 12, paddingTop: insets.top + 8 }}>
        <InkSurface blueprint>
          <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ParkingMark size={30} />
                <Display size={19} tone="onInk" style={{ letterSpacing: -0.6 }}>
                  {t('common:brand')}
                </Display>
              </View>
              <Rise>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    paddingVertical: 6,
                    paddingLeft: 10,
                    paddingRight: 12,
                  }}
                >
                  <LiveDot />
                  <Text size={13} weight="medium" tabular tone="onInk">
                    {loaded && listings.length > 0
                      ? t('listing:home.available', { count: listings.length })
                      : t('listing:home.live')}
                  </Text>
                </View>
              </Rise>
            </View>

            <Rise order={1} style={{ marginTop: 30 }}>
              <Display size={42} weight="extrabold" tone="onInk" leading={0.98}>
                {t('listing:home.heroLead')}
              </Display>
              <View style={{ alignSelf: 'flex-start' }}>
                <Display size={42} weight="extrabold" tone="highlight" leading={1.02}>
                  {t('listing:home.heroAccent')}
                </Display>
                <Svg
                  width="100%"
                  height={12}
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  style={{ marginTop: -4 }}
                  accessibilityElementsHidden
                >
                  <Path d="M2 8 Q 75 2 150 6 T 298 5" stroke="rgba(255,210,63,0.6)" strokeWidth={3} fill="none" strokeLinecap="round" />
                </Svg>
              </View>
            </Rise>

            <Rise order={2}>
              <Text size={16} tone="onInkMuted" style={{ marginTop: 18, lineHeight: 25 }}>
                {t('listing:home.pitch')}
              </Text>
            </Rise>

            {cheapest !== null && (
              <Rise order={3} style={{ marginTop: 24 }}>
                <PriceTicket cents={cheapest} />
              </Rise>
            )}

            <Rise order={4} style={{ marginTop: 26 }}>
              <AddressField label={null} onOpen={() => setAddressOpen(true)} onInk />
            </Rise>

            <Pressable
              accessibilityRole="link"
              onPress={() => goToSearch()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, alignSelf: 'flex-start', paddingVertical: 4 }}
            >
              <Text size={14} weight="medium" tone="onInkMuted">
                {t('listing:home.seeAll')}
              </Text>
              <ArrowRight size={16} color={colors.onInkMuted} />
            </Pressable>
          </View>
        </InkSurface>
      </View>

      {/* Comment ça marche : trois gestes, reliés par l'axe de l'allée. */}
      <View style={{ paddingHorizontal: 16, paddingTop: 56, gap: 28 }}>
        <SectionTitle eyebrow={t('listing:home.how.eyebrow')} title={t('listing:home.how.title')} />
        <View style={{ gap: 14 }}>
          {STEPS.map(({ key, icon: Icon }, index) => (
            <View
              key={key}
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.bgRaised,
                padding: 22,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.brand,
                    boxShadow: '0px 10px 24px -10px rgba(31, 70, 224, 0.65)',
                  }}
                >
                  <Icon size={24} color={colors.onBrand} />
                </View>
                <OutlineNumber value={String(index + 1).padStart(2, '0')} color={colors.lineStrong} />
              </View>
              <Display size={20} weight="semibold" style={{ marginTop: 22 }}>
                {t(`listing:home.how.step.${key}.title`)}
              </Display>
              <Text tone="muted" style={{ marginTop: 6, lineHeight: 24 }}>
                {t(`listing:home.how.step.${key}.body`)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Trois promesses : le pays, le prix, la confirmation. */}
      <View style={{ paddingHorizontal: 16, paddingTop: 56, gap: 28 }}>
        <SectionTitle eyebrow={t('listing:home.why.eyebrow')} title={t('listing:home.why.title')} />
        <View style={{ gap: 14 }}>
          <InkSurface style={{ borderRadius: 24, minHeight: 380 }}>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }}>
              <FranceMap />
            </View>
            <View style={{ padding: 24 }}>
              <Ticket tone="highlight">46,60° N · 2,40° E</Ticket>
              <Display size={28} tone="onInk" style={{ marginTop: 10 }}>
                {t('listing:home.argument.local.title')}
              </Display>
              <Text tone="onInkMuted" style={{ marginTop: 10, lineHeight: 24 }}>
                {t('listing:home.argument.local.body')}
              </Text>
            </View>
          </InkSurface>

          <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgRaised, padding: 24, gap: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
              <Display size={64} weight="extrabold" tone="accent" leading={0.95} tabular>
                {formatCents(0)}
              </Display>
              <Text size={14} tone="muted" style={{ flex: 1, lineHeight: 19, marginBottom: 6 }}>
                {t('listing:home.why.noFees')}
              </Text>
            </View>
            <View>
              <Display size={22}>{t('listing:home.argument.price.title')}</Display>
              <Text tone="muted" style={{ marginTop: 8, lineHeight: 24 }}>
                {t('listing:home.argument.price.body')}
              </Text>
            </View>
          </View>

          <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgRaised, padding: 24, gap: 32 }}>
            <View accessibilityElementsHidden style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <Badge tone="warn" large label={t('account:status.PENDING')} />
              <ArrowRight size={16} color={colors.fgSubtle} />
              <Badge tone="ok" large label={t('account:status.CONFIRMED')} />
              <View style={{ width: 1, height: 20, backgroundColor: colors.line }} />
              <Badge tone="neutral" large label={t('account:status.EXPIRED')} style={{ opacity: 0.7 }} />
            </View>
            <View>
              <Display size={22}>{t('listing:home.argument.trust.title')}</Display>
              <Text tone="muted" style={{ marginTop: 8, lineHeight: 24 }}>
                {t('listing:home.argument.trust.body')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Aux propriétaires : le bleu panneau, en plein. */}
      <View style={{ paddingHorizontal: 12, paddingTop: 56 }}>
        <View style={{ borderRadius: 32, overflow: 'hidden', backgroundColor: palette.signal[600] }}>
          <View style={{ position: 'absolute', right: -90, bottom: -110, width: 340, height: 340, opacity: 0.14, transform: [{ rotate: '12deg' }] }}>
            <Svg width="100%" height="100%" viewBox="-1 -1 34 34">
              <Path d="M0 7a7 7 0 0 1 7-7h18a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H7a7 7 0 0 1-7-7z" fill="none" stroke="#ffffff" strokeWidth={0.6} />
              <Path
                d="M11 24V8h6.4c3.5 0 5.6 2 5.6 5.1s-2.1 5.2-5.6 5.2h-2.6V24H11zm3.8-8.6h2.2c1.6 0 2.6-.9 2.6-2.3s-1-2.2-2.6-2.2h-2.2v4.5z"
                fill="#ffffff"
              />
            </Svg>
          </View>
          <View style={{ paddingHorizontal: 24, paddingVertical: 44 }}>
            <Ticket style={{ color: 'rgba(255,255,255,0.85)' }}>{t('listing:home.owner.eyebrow')}</Ticket>
            <Display size={36} weight="extrabold" style={{ color: '#ffffff', marginTop: 14 }} leading={1}>
              {t('listing:home.owner.title')}
            </Display>
            <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 16, lineHeight: 25 }}>{t('listing:home.owner.body')}</Text>
            <View style={{ marginTop: 28, gap: 10, alignItems: 'flex-start' }}>
              <Button
                variant="inverse"
                size="lg"
                icon={Plus}
                label={t('common:nav.publish')}
                onPress={() => router.push(isAuthenticated ? '/publier' : '/connexion')}
              />
              <Button variant="glass" size="lg" label={t('common:footer.search')} onPress={() => goToSearch()} />
            </View>
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 8, paddingTop: 40 }}>
        <ParkingMark size={26} />
        <Text size={13} tone="subtle">
          {t('common:footer.madeIn')}
        </Text>
      </View>

      <AddressSheet
        visible={addressOpen}
        initialQuery=""
        onClose={() => setAddressOpen(false)}
        onSelect={(suggestion) => {
          setAddressOpen(false);
          goToSearch(
            criteriaToRouteParams({
              ...EMPTY_CRITERIA,
              address: { label: suggestion.label, coordinates: suggestion.coordinates },
            }),
          );
        }}
      />
    </ScrollView>
  );
}

/** Le ticket d'horodateur : le tarif d'appel, imprimé sur papier crème. */
const PriceTicket = ({ cents }: { cents: number }) => {
  const { t } = useTranslation(['listing', 'common']);
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${t('listing:home.ticket.title')} : ${t('listing:card.from')} ${formatCents(cents)} ${t('common:unit.perNight')}`}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        borderRadius: 16,
        backgroundColor: palette.ticketPaper,
        transform: [{ rotate: '-2deg' }],
        boxShadow: '0px 24px 40px -20px rgba(0, 0, 0, 0.8)',
      }}
    >
      <View style={{ paddingHorizontal: 18, paddingVertical: 14 }}>
        <Ticket style={{ color: palette.asphalt[500] }}>{t('listing:home.ticket.title')}</Ticket>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 6 }}>
          <Text size={13} style={{ color: palette.asphalt[600] }}>
            {t('listing:card.from')}
          </Text>
          <Display size={36} weight="extrabold" tabular style={{ color: palette.asphalt[950] }}>
            {formatCents(cents)}
          </Display>
          <Text size={13} style={{ color: palette.asphalt[600] }}>
            {t('common:unit.perNight')}
          </Text>
        </View>
        <Text size={12} style={{ color: palette.asphalt[500], marginTop: 6, maxWidth: 190, lineHeight: 16 }}>
          {t('listing:home.ticket.caption')}
        </Text>
      </View>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 14,
          borderLeftWidth: 2,
          borderLeftColor: palette.asphalt[300],
          borderStyle: 'dashed',
        }}
      >
        {/* Les deux encoches du ticket, découpées dans l'encre. */}
        <View style={{ position: 'absolute', top: -8, left: -9, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.ink }} />
        <View style={{ position: 'absolute', bottom: -8, left: -9, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.ink }} />
        <ParkingMark size={30} />
        <Text style={{ fontFamily: fonts.mono.medium, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: palette.asphalt[500] }}>
          France
        </Text>
      </View>
    </View>
  );
};

/** La pastille « en direct » : un point vert et son anneau qui s'élargit. */
const LiveDot = () => (
  <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
        animationName: {
          '0%': { transform: [{ scale: 0.8 }], opacity: 0.75 },
          '80%': { transform: [{ scale: 2.2 }], opacity: 0 },
          '100%': { transform: [{ scale: 2.2 }], opacity: 0 },
        },
        animationDuration: 2200,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-out',
      }}
    />
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
  </View>
);

/** Le numéro d'étape en contour (`text-outline` sur le site), dessiné en SVG. */
const OutlineNumber = ({ value, color }: { value: string; color: string }) => (
  <Svg width={84} height={56} accessibilityElementsHidden>
    <SvgText
      x={84}
      y={50}
      textAnchor="end"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      fontFamily={fonts.display.extrabold}
      fontSize={56}
    >
      {value}
    </SvgText>
  </Svg>
);
