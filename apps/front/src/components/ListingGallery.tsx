import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { listingPhotoUrl } from '../app/listing/domain/entities/ListingPhoto';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import { cn } from '../lib/cn';
import { BayScene } from './art/BayScene';

export const ListingGallery = ({ photos, box }: { photos: string[]; box: string }) => {
  const { t } = useTranslation('listing');
  const [shown, setShown] = useState(0);

  const pictures = photos
    .map((id) => listingPhotoUrl(API_BASE_URL, id))
    .filter((url): url is string => url !== null);
  const references = photos.filter((id) => listingPhotoUrl(API_BASE_URL, id) === null);
  const shownIndex = Math.min(shown, pictures.length - 1);
  const cover = pictures[shownIndex];

  return (
    <>
      <div className="animate-rise grain relative aspect-[16/9] overflow-hidden rounded-3xl bg-[#161a24] ring-1 ring-line [--i:1]">
        {cover === undefined ? (
          <BayScene box={box} />
        ) : (
          <img
            src={cover}
            alt={t('listing:detail.photoAlt', { position: shownIndex + 1, total: pictures.length })}
            className="size-full object-cover"
          />
        )}
      </div>

      {pictures.length > 1 && (
        <section className="mt-4">
          <h2 className="sr-only">{t('listing:detail.photos')}</h2>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {pictures.map((url, index) => (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => setShown(index)}
                  aria-label={t('listing:detail.showPhoto', { position: index + 1 })}
                  aria-pressed={index === shownIndex}
                  className={cn(
                    'block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl ring-offset-2 ring-offset-bg transition-shadow',
                    index === shownIndex ? 'ring-2 ring-brand' : 'ring-1 ring-line hover:ring-line-strong',
                  )}
                >
                  <img src={url} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {references.length > 0 && (
        <section className="mt-4">
          <h2 className="sr-only">{t('listing:detail.references')}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {references.map((reference) => (
              <li
                key={reference}
                className="bg-hatch flex aspect-[4/3] flex-col justify-between rounded-2xl border border-line bg-bg-sunken p-3"
              >
                <ImageIcon className="size-5 text-fg-subtle" aria-hidden="true" />
                <span className="truncate font-mono text-[11px] text-fg-muted">{reference}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-fg-subtle">{t('listing:detail.photosHint')}</p>
        </section>
      )}
    </>
  );
};
