import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Button } from './ui/Button';
import { Display, Text, Ticket } from './ui/Text';

export interface Period {
  from: string;
  to: string;
}

interface CalendarSheetProps {
  visible: boolean;
  title: string;
  labels: { from: string; to: string };
  value: Period;
  /** Premier et dernier jour choisissables, `aaaa-mm-jj`. */
  min?: string;
  max?: string;
  onChange: (period: Period) => void;
  onClose: () => void;
}

const DAY_MS = 86_400_000;

// Les jours sont des jours calendaires, en UTC, comme `Listing.ts` : jamais une
// heure locale qui ferait glisser une date d'un jour selon le fuseau.
const toDay = (instant: number): string => new Date(instant).toISOString().slice(0, 10);
const parse = (day: string): number => Date.parse(`${day}T00:00:00.000Z`);
const monthStart = (day: string): number => {
  const date = new Date(parse(day));
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
};
const shiftMonth = (start: number, delta: number): number => {
  const date = new Date(start);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1);
};

const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const LONG_DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const SHORT_DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Six semaines, lundi en tête : la grille ne change pas de hauteur d'un mois à l'autre. */
const gridOf = (start: number): (string | null)[] => {
  const first = new Date(start);
  const offset = (first.getUTCDay() + 6) % 7;
  const month = first.getUTCMonth();
  return Array.from({ length: 42 }, (_, index) => {
    const instant = start + (index - offset) * DAY_MS;
    return new Date(instant).getUTCMonth() === month ? toDay(instant) : null;
  });
};

export const formatPeriodDay = (day: string): string => (day === '' ? '—' : SHORT_DAY.format(new Date(parse(day))));

/**
 * Le calendrier de la fiche, en feuille : le premier toucher pose l'arrivée,
 * le second le départ ; un départ avant l'arrivée recommence la période. Seuls
 * les jours entre `min` et `max` se touchent — `isListingAvailableOn` reste le
 * juge, mais un jour qu'on ne peut pas réserver n'a pas à être actif. Aucun
 * nom accessible ne contient « aujourd'hui », même règle que le site.
 */
export const CalendarSheet = ({ visible, title, labels, value, min, max, onChange, onClose }: CalendarSheetProps) => {
  const { t } = useTranslation(['common', 'mobile']);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Period>(value);
  const [month, setMonth] = useState(() => monthStart(value.from !== '' ? value.from : (min ?? toDay(Date.now()))));

  const picking: 'from' | 'to' = draft.from === '' || draft.to !== '' ? 'from' : 'to';

  const pick = (day: string): void => {
    void Haptics.selectionAsync();
    if (picking === 'from' || day < draft.from) setDraft({ from: day, to: '' });
    else setDraft({ from: draft.from, to: day });
  };

  const earliest = min === undefined ? null : monthStart(min);
  const latest = max === undefined ? null : monthStart(max);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => {
        setDraft(value);
        setMonth(monthStart(value.from !== '' ? value.from : (min ?? toDay(Date.now()))));
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 }}>
          <Display size={24}>{title}</Display>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:action.close')}
            onPress={onClose}
            hitSlop={10}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSunken }}
          >
            <X size={18} color={colors.fg} />
          </Pressable>
        </View>

        {/* Les deux dates dans un même cadre, comme sur un billet : arrivée à
            gauche, départ à droite, la moitié attendue en surbrillance. */}
        <View
          style={{
            marginHorizontal: 20,
            flexDirection: 'row',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.lineStrong,
            backgroundColor: colors.bgRaised,
            overflow: 'hidden',
          }}
        >
          {(['from', 'to'] as const).map((side, index) => {
            const active = picking === side;
            return (
              <View
                key={side}
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderLeftWidth: index === 1 ? 1 : 0,
                  borderLeftColor: colors.line,
                  borderStyle: 'dashed',
                  backgroundColor: active ? colors.accentSoft : 'transparent',
                }}
              >
                <Ticket tone={active ? 'accent' : 'subtle'}>{labels[side]}</Ticket>
                <Display size={18} weight="semibold" tabular style={{ marginTop: 4 }}>
                  {formatPeriodDay(draft[side])}
                </Display>
              </View>
            );
          })}
        </View>
        <Text size={13} tone="muted" style={{ marginHorizontal: 20, marginTop: 10 }}>
          {picking === 'from' ? t('mobile:calendar.pickFrom') : t('mobile:calendar.pickTo')}
        </Text>

        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <MonthButton
              label={t('common:date.previousMonth')}
              disabled={earliest !== null && month <= earliest}
              onPress={() => setMonth((current) => shiftMonth(current, -1))}
              icon="previous"
            />
            <Display size={18} weight="semibold" style={{ textTransform: 'capitalize' }}>
              {MONTH.format(new Date(month))}
            </Display>
            <MonthButton
              label={t('common:date.nextMonth')}
              disabled={latest !== null && month >= latest}
              onPress={() => setMonth((current) => shiftMonth(current, 1))}
              icon="next"
            />
          </View>

          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((letter, index) => (
              <Text key={`${letter}-${String(index)}`} size={12} tone="subtle" center style={{ flex: 1, fontFamily: fonts.mono.medium }}>
                {letter}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
            {gridOf(month).map((day, index) => {
              if (day === null) return <View key={`blank-${String(index)}`} style={{ width: `${100 / 7}%`, height: 46 }} />;
              const disabled = (min !== undefined && day < min) || (max !== undefined && day > max);
              const isFrom = day === draft.from;
              const isTo = day === draft.to;
              const inside = draft.from !== '' && draft.to !== '' && day > draft.from && day < draft.to;
              const edge = isFrom || isTo;
              const label = `${LONG_DAY.format(new Date(parse(day)))}${disabled ? `, ${t('mobile:calendar.unavailable')}` : ''}`;

              return (
                <View
                  key={day}
                  style={{
                    width: `${100 / 7}%`,
                    height: 46,
                    justifyContent: 'center',
                    backgroundColor: inside ? colors.accentSoft : 'transparent',
                  }}
                >
                  {/* Le ruban de la période relie l'arrivée au départ. */}
                  {edge && draft.to !== '' && draft.from !== draft.to && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: isFrom ? '50%' : 0,
                        right: isTo ? '50%' : 0,
                        backgroundColor: colors.accentSoft,
                      }}
                    />
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ disabled, selected: edge }}
                    disabled={disabled}
                    onPress={() => pick(day)}
                    style={{
                      alignSelf: 'center',
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: edge ? colors.brand : 'transparent',
                    }}
                  >
                    <Text
                      tabular
                      style={{
                        fontFamily: edge ? fonts.sans.semibold : fonts.sans.medium,
                        fontSize: 15,
                        lineHeight: 20,
                        color: edge ? colors.onBrand : disabled ? colors.lineStrong : colors.fg,
                        textDecorationLine: disabled ? 'line-through' : 'none',
                      }}
                    >
                      {String(Number(day.slice(8)))}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: colors.line,
            backgroundColor: colors.bgRaised,
          }}
        >
          <Button label={t('common:date.clear')} variant="ghost" onPress={() => setDraft({ from: '', to: '' })} />
          <Button
            label={t('common:date.done')}
            block
            style={{ flex: 1 }}
            disabled={draft.from === '' || draft.to === ''}
            onPress={() => {
              onChange(draft);
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const MonthButton = ({ label, disabled, onPress, icon }: { label: string; disabled: boolean; onPress: () => void; icon: 'previous' | 'next' }) => {
  const { colors } = useTheme();
  const Icon = icon === 'previous' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.bgRaised,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Icon size={18} color={colors.fg} />
    </Pressable>
  );
};
