import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowRight, Check, Send, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  publishListingRequested,
  resetPublishListingState,
} from '@front/app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { todayAsCalendarDay } from '@front/lib/format';
import { EMPTY_LISTING_FORM, listingContentOf, type ListingFormValues } from '@front/lib/listingFormValues';
import {
  selectPublishError,
  selectPublishLoading,
  selectPublishSuccess,
} from '@front/selectors/listing/listingSelectors';

import { ListingForm } from '../components/ListingForm';
import { Button } from '../components/ui/Button';
import { Rise } from '../components/ui/Layout';
import { Display, Text } from '../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { useTheme } from '../theme/useTheme';

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

  useEffect(() => () => void dispatch(resetPublishListingState()), [dispatch]);

  useEffect(() => {
    if (success) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [success]);

  const submit = (values: ListingFormValues): void => {
    dispatch(
      publishListingRequested({ address: values.address.trim(), box: values.box.trim(), ...listingContentOf(values) }),
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

        <ListingForm
          initialValues={EMPTY_LISTING_FORM}
          firstSelectableDay={todayAsCalendarDay()}
          submitLabel={t('listing:publish.submit')}
          submitIcon={Send}
          loading={loading}
          error={error}
          onSubmit={submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
