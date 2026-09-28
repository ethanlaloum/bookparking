import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { listingPhotoUrl } from '@front/app/listing/domain/entities/ListingPhoto';

import { resolveApiBaseUrl } from '../lib/apiBaseUrl';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

export const ListingPhotoStrip = ({ photos }: { photos: string[] }) => {
  const { t } = useTranslation('listing');
  const { colors } = useTheme();
  const apiBaseUrl = resolveApiBaseUrl();
  const pictures = photos.map((id) => ({ id, url: listingPhotoUrl(apiBaseUrl, id) }));
  const hasReferences = pictures.some((picture) => picture.url === null);

  return (
    <View style={{ gap: 8, marginTop: -14 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
      >
        {pictures.map(({ id, url }, index) =>
          url === null ? (
            <View
              key={id}
              style={{
                width: 132,
                aspectRatio: 4 / 3,
                justifyContent: 'space-between',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.bgSunken,
                padding: 12,
              }}
            >
              <ImageIcon size={20} color={colors.fgSubtle} />
              <Text numberOfLines={1} style={{ fontFamily: fonts.mono.medium, fontSize: 11, color: colors.fgMuted }}>
                {id}
              </Text>
            </View>
          ) : (
            <Image
              key={id}
              source={{ uri: url }}
              contentFit="cover"
              transition={150}
              accessibilityLabel={t('listing:detail.photoAlt', { position: index + 1, total: photos.length })}
              style={{ width: 240, aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: colors.bgSunken }}
            />
          ),
        )}
      </ScrollView>
      {hasReferences && (
        <Text size={12} tone="subtle">
          {t('listing:detail.photosHint')}
        </Text>
      )}
    </View>
  );
};
