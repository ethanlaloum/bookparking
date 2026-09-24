import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';

import { formatDistance, type Coordinates } from '../app/listing/domain/entities/Coordinates';
import { cheapestNightlyRateInCents } from '../app/listing/domain/entities/Listing';
import { cn } from '../lib/cn';
import { formatCents } from '../lib/format';
import type { MappedListingWithDistance } from '../selectors/listing/listingSelectors';
import { BayThumbnail } from './art/BayThumbnail';
import { buttonVariants } from './ui/buttonVariants';

// Le marqueur est une pastille de prix, dessinée en HTML plutôt que
// téléchargée : les icônes par défaut de Leaflet arrivent par une URL que le
// bundler réécrit, et qui casse silencieusement en production. L'icône garde
// une boîte fixe — c'est elle que Leaflet expose en `role="button"`, et une
// boîte de taille nulle ne serait jamais « visible » pour Playwright — et la
// pastille se centre dedans (voir `.bp-marker` dans index.css).
// La pastille est `aria-hidden` : un bouton tire son nom de son contenu
// AVANT son `title`, et « P 15 € » aurait remplacé « <adresse> — <box> » —
// le nom que lisent les lecteurs d'écran et que désigne le barreau e2e.
const pin = (label: string | null, approximate: boolean, focused: boolean): L.DivIcon =>
  L.divIcon({
    className: 'bp-marker',
    iconSize: [84, 34],
    iconAnchor: [42, 40],
    popupAnchor: [0, -38],
    html: `<span aria-hidden="true" class="${[
      'bp-pin',
      approximate ? 'bp-pin--approx' : '',
      focused ? 'bp-pin--focused' : '',
      label === null ? 'bp-pin--bare' : '',
    ].join(' ')}"><span class="bp-pin__mark">P</span>${label ?? ''}</span>`,
  });

// Le centre n'est pas une prop initiale : il n'est connu qu'une fois le
// géocodage revenu, donc après le premier rendu de la carte.
const Recenter = ({ center, zoom }: { center: Coordinates; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.latitude, center.longitude], zoom);
  }, [center.latitude, center.longitude, map, zoom]);
  return null;
};

const prefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches &&
  document.documentElement.dataset.theme !== 'light';

// Le point cherché se distingue par sa forme, pas seulement par sa couleur :
// un disque qui pulse, et non une pastille, pour rester lisible sans
// percevoir la teinte.
const searchDot = (): L.DivIcon =>
  L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: '<span class="bp-search-dot"></span>',
  });

export const ListingsMap = ({
  mapped,
  center,
  zoom,
  searchPoint,
  searchLabel,
  focusedListingId,
  className,
}: {
  mapped: MappedListingWithDistance[];
  center: Coordinates;
  zoom: number;
  searchPoint: Coordinates | null;
  searchLabel: string | null;
  focusedListingId: string | null;
  className?: string;
}) => {
  const { t } = useTranslation(['listing', 'common']);
  const [dark, setDark] = useState(prefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setDark(prefersDark());
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // OpenStreetMap : libre, sans clé, et la seule source raster dont on soit sûr
  // qu'elle le reste. Les fonds CARTO exigent désormais une clé d'API et
  // rendent des tuiles barrées « API KEY REQUIRED ». OSM n'ayant pas de variante
  // sombre, le thème sombre est obtenu par un filtre CSS sur la couche : moins
  // fin qu'un vrai fond sombre, mais cohérent avec le reste de l'interface et
  // sans dépendance contractuelle.

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={zoom}
      // La molette ne zoome pas : la carte occupe les deux tiers de la hauteur,
      // et un utilisateur qui fait défiler la page verrait son geste détourné
      // en zoom dès que le curseur passe dessus. Les commandes + et − et le
      // double-clic restent, eux, explicites.
      scrollWheelZoom={false}
      className={cn('h-full min-h-[24rem] w-full', className)}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className={dark ? 'bookparking-dark-tiles' : 'bookparking-light-tiles'}
      />
      <Recenter center={center} zoom={zoom} />

      {searchPoint !== null && (
        <Marker
          position={[searchPoint.latitude, searchPoint.longitude]}
          icon={searchDot()}
          title={searchLabel ?? ''}
          // Au-dessus des marqueurs de place : c'est le point que
          // l'utilisateur vient de demander, le perdre sous une goutte le
          // laisserait sans repère.
          zIndexOffset={1000}
        />
      )}

      {mapped.map(({ listing, located, distanceKm }) => {
        const rate = cheapestNightlyRateInCents(listing.pricing);
        const approximate = located.precision === 'approximate';
        return (
          <Marker
            key={listing.id}
            position={[located.coordinates.latitude, located.coordinates.longitude]}
            icon={pin(rate === null ? null : formatCents(rate), approximate, listing.id === focusedListingId)}
            zIndexOffset={listing.id === focusedListingId ? 600 : 0}
            title={`${listing.address} — ${listing.box}`}
          >
            <Popup>
              <span className="flex gap-3">
                <BayThumbnail box={listing.box} className="h-16 w-13 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block font-display text-[0.95rem] leading-snug font-semibold text-[#0b0d12]">
                    {listing.address}
                  </span>
                  <span className="mt-1 block text-xs text-[#4b5672]">
                    {t('listing:card.box', { box: listing.box })}
                    {rate !== null && ` · ${formatCents(rate)} ${t('common:unit.perNight')}`}
                  </span>
                  <span className={`mt-1 block text-[11px] ${approximate ? 'text-[#a16207]' : 'text-[#5f6d8b]'}`}>
                    {distanceKm !== null &&
                      `${t('listing:mapSearch.distance', { distance: formatDistance(distanceKm) })} · `}
                    {approximate ? t('listing:map.approx') : t('listing:map.exact')}
                  </span>
                </span>
              </span>
              <Link
                to={`/place/${listing.id}`}
                className={`${buttonVariants({ variant: 'primary', size: 'sm', block: true })} mt-3 !text-white`}
              >
                {t('listing:map.openListing')}
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};
