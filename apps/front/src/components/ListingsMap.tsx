import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';

import { formatDistance, type Coordinates } from '../app/listing/domain/entities/Coordinates';
import { cheapestNightlyRateInCents } from '../app/listing/domain/entities/Listing';
import { formatCents } from '../lib/format';
import type { MappedListingWithDistance } from '../selectors/listing/listingSelectors';
import { buttonVariants } from './ui/buttonVariants';

const ACCENT = '#1f46e0';
const MARKING = '#e09b14';
const SEARCH = '#15803d';

// Le marqueur est le panneau de stationnement, dessiné plutôt que téléchargé :
// les icônes par défaut de Leaflet arrivent par une URL que le bundler réécrit,
// et qui casse silencieusement en production.
const pin = (approximate: boolean, focused: boolean): L.DivIcon =>
  L.divIcon({
    className: '',
    iconSize: focused ? [38, 48] : [30, 38],
    iconAnchor: focused ? [19, 48] : [15, 38],
    popupAnchor: [0, focused ? -44 : -34],
    html: `<svg width="${focused ? 38 : 30}" height="${focused ? 48 : 38}" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 37C15 37 28 23.5 28 14A13 13 0 1 0 2 14C2 23.5 15 37 15 37Z"
        fill="${approximate ? MARKING : ACCENT}" stroke="#fff" stroke-width="${focused ? 2.6 : 2}"/>
      <path d="M11 21V8h5.2c2.9 0 4.6 1.7 4.6 4.2s-1.7 4.3-4.6 4.3h-2.1V21H11zm3.1-7h1.8c1.3 0 2.1-.7 2.1-1.9s-.8-1.8-2.1-1.8h-1.8V14z"
        fill="#fff"/>
    </svg>`,
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
// un disque et non une goutte, pour rester lisible sans percevoir la teinte.
const searchDot = (): L.DivIcon =>
  L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="13" r="12" fill="${SEARCH}" fill-opacity="0.25"/>
      <circle cx="13" cy="13" r="7" fill="${SEARCH}" stroke="#fff" stroke-width="3"/>
    </svg>`,
  });

export const ListingsMap = ({
  mapped,
  center,
  zoom,
  searchPoint,
  searchLabel,
  focusedListingId,
}: {
  mapped: MappedListingWithDistance[];
  center: Coordinates;
  zoom: number;
  searchPoint: Coordinates | null;
  searchLabel: string | null;
  focusedListingId: string | null;
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
      className="h-[clamp(24rem,68vh,44rem)] w-full rounded-[2px] border border-line"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className={dark ? 'bookparking-dark-tiles' : undefined}
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
            icon={pin(approximate, listing.id === focusedListingId)}
            zIndexOffset={listing.id === focusedListingId ? 600 : 0}
            title={`${listing.address} — ${listing.box}`}
          >
            <Popup>
              <span className="block font-display text-sm font-semibold text-[#14161d]">
                {listing.address}
              </span>
              <span className="mt-0.5 block text-xs text-[#4b5672]">
                {t('listing:card.box', { box: listing.box })}
                {rate !== null && ` · ${formatCents(rate)} ${t('common:unit.perNight')}`}
              </span>
              <span className="mt-1 block text-[11px] text-[#5f6d8b]">
                {distanceKm !== null && `${t('listing:mapSearch.distance', { distance: formatDistance(distanceKm) })} · `}
                {approximate ? t('listing:map.approx') : t('listing:map.exact')}
              </span>
              <Link
                to={`/place/${listing.id}`}
                className={`${buttonVariants({ variant: 'primary', size: 'sm' })} mt-2 !text-white`}
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
