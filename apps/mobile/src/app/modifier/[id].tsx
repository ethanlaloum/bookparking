import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Save, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  editListingRequested,
  resetEditListingState,
} from '@front/app/listing/domain/use-cases/edit-listing/editListingEpic';
import { listOwnerListingsRequested } from '@front/app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { todayAsCalendarDay } from '@front/lib/format';
import { listingContentOf, listingFormValuesOf, type ListingFormValues } from '@front/lib/listingFormValues';
import {
  selectEditableOwnerListing,
  selectEditListingError,
  selectEditListingLoading,
  selectEditListingSuccess,
  selectOwnerListingsError,
  selectOwnerListingsLoaded,
} from '@front/selectors/listing/listingSelectors';

import { NoParkingSign } from '../../components/art/Glyphs';
import { ListingForm } from '../../components/ListingForm';
import { Button } from '../../components/ui/Button';
import { Rise, Skeleton } from '../../components/ui/Layout';
import { Notice } from '../../components/ui/Notice';
import { Display, Text } from '../../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { useTheme } from '../../theme/useTheme';

const earlierDay = (first: string, second: string): string => (first < second ? first : second);

export default function EditListingScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const listing = useAppSelector((state) => selectEditableOwnerListing(state, id));
  const loaded = useAppSelector(selectOwnerListingsLoaded);
  const loadError = useAppSelector(selectOwnerListingsError);
  const saving = useAppSelector(selectEditListingLoading);
  const error = useAppSelector(selectEditListingError);
  const saved = useAppSelector(selectEditListingSuccess);

  useEffect(() => {
    dispatch(listOwnerListingsRequested());
    return () => void dispatch(resetEditListingState());
  }, [dispatch]);

  useEffect(() => {
    if (saved) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [saved]);

  if (saved)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.okBg, borderWidth: 1, borderColor: colors.okLine }}>
          <Check size={42} color={colors.ok} strokeWidth={2.5} />
        </View>
        <Rise style={{ alignItems: 'center', marginTop: 28 }}>
          <Display size={30} center accessibilityLiveRegion="polite">
            {t('listing:edit.saved')}
          </Display>
          <Text size={17} tone="muted" center style={{ marginTop: 10 }}>
            {t('listing:edit.savedBody')}
          </Text>
        </Rise>
        <Button size="lg" label={t('listing:edit.seeIt')} style={{ marginTop: 32 }} onPress={() => router.back()} />
      </View>
    );

  if (loadError !== null || (loaded && listing === null))
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
        <NoParkingSign size={96} />
        <Display size={26} center style={{ marginTop: 12 }}>
          {t('listing:edit.notEditable')}
        </Display>
        <Text tone="muted" center>
          {loadError ?? t('listing:edit.notEditableBody')}
        </Text>
        <Button variant="outline" icon={ArrowLeft} label={t('common:action.back')} onPress={() => router.back()} style={{ marginTop: 10 }} />
      </View>
    );

  const submit = (values: ListingFormValues): void => {
    if (listing === null) return;
    dispatch(editListingRequested({ id: listing.id, listing: listingContentOf(values) }));
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Rise style={{ flex: 1 }}>
            <Display size={34}>{t('listing:edit.title')}</Display>
            <Text tone="muted" style={{ marginTop: 8 }}>
              {t('listing:edit.subtitle')}
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

        {!loaded || listing === null ? (
          <View style={{ gap: 14 }}>
            <Skeleton height={220} />
            <Skeleton height={160} />
          </View>
        ) : (
          <ListingForm
            key={listing.id}
            initialValues={listingFormValuesOf(listing)}
            placeLocked
            firstSelectableDay={earlierDay(todayAsCalendarDay(), listing.availability.from.slice(0, 10))}
            submitLabel={t('listing:edit.submit')}
            submitIcon={Save}
            loading={saving}
            error={error}
            notice={<Notice tone="info">{t('listing:edit.bookingsKept')}</Notice>}
            onSubmit={submit}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
