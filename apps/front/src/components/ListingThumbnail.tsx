import { coverPhotoUrlOf } from '../app/listing/domain/entities/ListingPhoto';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import { cn } from '../lib/cn';
import { BayThumbnail } from './art/BayThumbnail';

export const ListingThumbnail = ({
  photos,
  box,
  className,
}: {
  photos: string[];
  box: string;
  className?: string;
}) => {
  const cover = coverPhotoUrlOf(API_BASE_URL, photos);
  if (cover === null) return <BayThumbnail box={box} className={className} />;
  return (
    <img
      src={cover}
      alt=""
      loading="lazy"
      className={cn('block rounded-xl bg-[#161a24] object-cover', className)}
    />
  );
};
