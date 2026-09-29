import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import {
  MAX_PHOTOS_PER_LISTING,
  photoDraftKeyOf,
  photoDraftSourceOf,
  withAddedPhotos,
  withoutPhotoAt,
  type LocalPhoto,
  type PhotoDraft,
} from '@front/app/listing/domain/entities/ListingPhoto';

import { resolveApiBaseUrl } from '../lib/apiBaseUrl';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Button } from './ui/Button';
import { Text } from './ui/Text';

const LONGEST_SIDE_IN_PIXELS = 2048;
const JPEG_QUALITY = 0.8;

type Source = 'library' | 'camera';

const jpegNameOf = (asset: ImagePicker.ImagePickerAsset, position: number): string =>
  `${(asset.fileName ?? '').replace(/\.[^.]*$/u, '') || `photo-${String(position)}`}.jpg`;

const preparedPhotoOf = async (
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): Promise<LocalPhoto> => {
  const context = ImageManipulator.manipulate(asset.uri);
  const longestSide = Math.max(asset.width, asset.height);
  if (longestSide > LONGEST_SIDE_IN_PIXELS)
    context.resize(
      asset.width >= asset.height
        ? { width: LONGEST_SIDE_IN_PIXELS }
        : { height: LONGEST_SIDE_IN_PIXELS },
    );
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return { uri: saved.uri, name: jpegNameOf(asset, index + 1), type: 'image/jpeg' };
};

interface PhotoPickerProps {
  value: PhotoDraft[];
  onChange: (drafts: PhotoDraft[]) => void;
  error?: string;
}

export const PhotoPicker = ({ value, onChange, error }: PhotoPickerProps) => {
  const { t } = useTranslation(['listing', 'mobile']);
  const { colors } = useTheme();
  const [preparing, setPreparing] = useState<Source | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const room = MAX_PHOTOS_PER_LISTING - value.length;
  const apiBaseUrl = resolveApiBaseUrl();

  const pick = async (source: Source): Promise<void> => {
    setProblem(null);
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setProblem(t('mobile:photos.cameraRefused'));
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: source === 'library',
      selectionLimit: room,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    setPreparing(source);
    try {
      const photos = await Promise.all(result.assets.slice(0, room).map(preparedPhotoOf));
      onChange(withAddedPhotos(value, photos));
      void Haptics.selectionAsync();
    } catch {
      setProblem(t('mobile:photos.failed'));
    } finally {
      setPreparing(null);
    }
  };

  const remove = (index: number): void => {
    void Haptics.selectionAsync();
    setProblem(null);
    onChange(withoutPhotoAt(value, index));
  };

  const message = error ?? problem;

  return (
    <View style={{ gap: 10 }}>
      <Text size={14} weight="medium">
        {t('listing:field.photos')}
      </Text>

      {value.length > 0 && (
        <View accessibilityRole="list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {value.map((draft, index) => {
            const source = photoDraftSourceOf(apiBaseUrl, draft);
            const position = index + 1;
            return (
              <View
                key={photoDraftKeyOf(draft)}
                style={{
                  width: '31%',
                  aspectRatio: 4 / 3,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.bgSunken,
                  overflow: 'hidden',
                }}
              >
                {source === null ? (
                  <View style={{ flex: 1, justifyContent: 'space-between', padding: 8 }}>
                    <ImageIcon size={18} color={colors.fgSubtle} />
                    <Text numberOfLines={1} style={{ fontFamily: fonts.mono.medium, fontSize: 10, color: colors.fgMuted }}>
                      {draft.kind === 'stored' ? draft.id : ''}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: source }}
                    contentFit="cover"
                    accessibilityLabel={t('listing:photos.alt', { position })}
                    style={{ flex: 1 }}
                  />
                )}
                {index === 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 6,
                      bottom: 6,
                      borderRadius: 999,
                      backgroundColor: 'rgba(11, 13, 18, 0.75)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text size={10} weight="semibold" style={{ color: '#ffffff' }}>
                      {t('listing:photos.cover')}
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('listing:photos.remove', { position })}
                  hitSlop={8}
                  onPress={() => remove(index)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(11, 13, 18, 0.75)',
                  }}
                >
                  <X size={16} color={'#ffffff'} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {room > 0 && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            variant="outline"
            size="sm"
            icon={ImagePlus}
            label={t('mobile:photos.library')}
            loading={preparing === 'library'}
            disabled={preparing !== null}
            onPress={() => void pick('library')}
            style={{ flex: 1 }}
          />
          <Button
            variant="outline"
            size="sm"
            icon={Camera}
            label={t('mobile:photos.camera')}
            loading={preparing === 'camera'}
            disabled={preparing !== null}
            onPress={() => void pick('camera')}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {message === null || message === undefined ? (
        <Text size={12} tone="subtle">
          {t('listing:field.photosHint')}
        </Text>
      ) : (
        <Text size={12} weight="medium" tone="danger">
          {message}
        </Text>
      )}
    </View>
  );
};
