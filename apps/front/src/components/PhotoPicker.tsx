import { CircleAlert, ImageIcon, ImagePlus, X } from 'lucide-react';
import { useId, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTOS_PER_LISTING,
  photoDraftKeyOf,
  photoDraftSourceOf,
  withAddedPhotos,
  withoutPhotoAt,
  type LocalPhoto,
  type PhotoDraft,
} from '../app/listing/domain/entities/ListingPhoto';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import { cn } from '../lib/cn';
import { forgetLocalPhoto, preparePhoto } from '../lib/preparePhoto';
import { Spinner } from './ui/spinner';

interface PhotoPickerProps {
  value: PhotoDraft[];
  onChange: (drafts: PhotoDraft[]) => void;
  error?: string;
}

type Refusal = 'format' | 'size' | null;

const TILE = 'relative aspect-[4/3] overflow-hidden rounded-2xl border';

export const PhotoPicker = ({ value, onChange, error }: PhotoPickerProps) => {
  const { t } = useTranslation('listing');
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();
  const [preparing, setPreparing] = useState(false);
  const [refusal, setRefusal] = useState<Refusal>(null);

  const room = MAX_PHOTOS_PER_LISTING - value.length;

  const add = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = [...(event.target.files ?? [])].slice(0, room);
    event.target.value = '';
    if (files.length === 0) return;
    setPreparing(true);
    const prepared = await Promise.all(files.map(preparePhoto));
    setPreparing(false);
    const added: LocalPhoto[] = [];
    let lastRefusal: Refusal = null;
    for (const outcome of prepared)
      if ('photo' in outcome) added.push(outcome.photo);
      else lastRefusal = outcome.refusal;
    setRefusal(lastRefusal);
    if (added.length > 0) onChange(withAddedPhotos(value, added));
  };

  const remove = (index: number): void => {
    const removed = value[index];
    if (removed?.kind === 'local') forgetLocalPhoto(removed.photo);
    setRefusal(null);
    onChange(withoutPhotoAt(value, index));
  };

  const message = error ?? (refusal === null ? undefined : t(`listing:photos.refused.${refusal}`));

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={message === undefined ? hintId : `${hintId} ${errorId}`}
      className="flex flex-col gap-2"
    >
      <p id={labelId} className="text-sm font-medium text-fg">
        {t('listing:field.photos')}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((draft, index) => {
          const source = photoDraftSourceOf(API_BASE_URL, draft);
          const position = index + 1;
          return (
            <li key={photoDraftKeyOf(draft)} className={cn(TILE, 'border-line bg-bg-sunken')}>
              {source === null ? (
                <span className="bg-hatch flex size-full flex-col justify-between p-3">
                  <ImageIcon className="size-5 text-fg-subtle" aria-hidden="true" />
                  <span className="truncate font-mono text-[11px] text-fg-muted">
                    {draft.kind === 'stored' ? draft.id : ''}
                  </span>
                </span>
              ) : (
                <img
                  src={source}
                  alt={t('listing:photos.alt', { position })}
                  className="size-full object-cover"
                />
              )}
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-asphalt-950/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {t('listing:photos.cover')}
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={t('listing:photos.remove', { position })}
                className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full bg-asphalt-950/75 text-white transition-colors hover:bg-asphalt-950"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}

        {room > 0 && (
          <li>
            <label
              className={cn(
                TILE,
                'flex size-full cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-3 text-center text-sm font-medium transition-colors',
                'focus-within:ring-4 focus-within:ring-brand/20',
                error === undefined
                  ? 'border-line-strong bg-bg-raised text-fg-muted hover:border-brand hover:text-accent'
                  : 'border-danger bg-danger-bg text-danger',
              )}
            >
              {preparing ? (
                <Spinner className="size-5" />
              ) : (
                <ImagePlus className="size-6" aria-hidden="true" />
              )}
              <span>{preparing ? t('listing:photos.preparing') : t('listing:photos.add')}</span>
              <input
                type="file"
                accept={ACCEPTED_PHOTO_TYPES.join(',')}
                multiple
                disabled={preparing}
                aria-describedby={hintId}
                onChange={(event) => void add(event)}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>

      {message === undefined ? (
        <p id={hintId} className="text-xs text-fg-subtle">
          {t('listing:field.photosHint')}
        </p>
      ) : (
        <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
};
