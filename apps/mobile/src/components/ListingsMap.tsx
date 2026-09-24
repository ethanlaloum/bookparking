import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { Coordinates, MapFrame } from '@front/app/listing/domain/entities/Coordinates';
import { cheapestNightlyRateInCents } from '@front/app/listing/domain/entities/Listing';
import type { MappedListingWithDistance } from '@front/selectors/listing/listingSelectors';
import { formatCents } from '@front/lib/format';

import { fonts, palette } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

interface ListingsMapProps {
  mapped: MappedListingWithDistance[];
  frame: MapFrame;
  searchPoint: Coordinates | null;
  searchLabel: string | null;
  focusedListingId: string | null;
  onFocus: (listingId: string | null) => void;
}

/**
 * Le domaine rend un cadrage en niveau de zoom (`frameOf`, pensé pour
 * Leaflet) ; Plans veut une région. Un niveau de zoom couvre 360 / 2^z degrés
 * sur une tuile de 256 points, et l'écran d'un téléphone en montre environ une
 * et demie.
 */
const regionOf = ({ center, zoom }: MapFrame): Region => {
  const longitudeDelta = (360 / 2 ** zoom) * 1.5;
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    longitudeDelta,
    latitudeDelta: longitudeDelta * Math.cos((center.latitude * Math.PI) / 180),
  };
};

/**
 * La carte de la recherche, sur Plans (le fond du système : ni clé, ni tiers à
 * consentir). Les marqueurs sont les pastilles de prix du site — carré bleu
 * P, prix en chasse fixe — et virent à l'orange quand la position est
 * approximative : on ne pose jamais un point sans porter cette nuance.
 */
export const ListingsMap = ({ mapped, frame, searchPoint, searchLabel, focusedListingId, onFocus }: ListingsMapProps) => {
  const { scheme } = useTheme();
  const map = useRef<MapView>(null);
  const { center, zoom } = frame;

  useEffect(() => {
    map.current?.animateToRegion(regionOf({ center, zoom }), 450);
  }, [center, zoom]);

  return (
    <MapView
      ref={map}
      style={{ flex: 1 }}
      initialRegion={regionOf(frame)}
      userInterfaceStyle={scheme}
      showsPointsOfInterests={false}
      showsBuildings={false}
      pitchEnabled={false}
      onPress={(event) => {
        if (event.nativeEvent.action !== 'marker-press') onFocus(null);
      }}
    >
      {searchPoint !== null && (
        <Marker coordinate={searchPoint} anchor={{ x: 0.5, y: 0.5 }} accessibilityLabel={searchLabel ?? undefined} tracksViewChanges={false}>
          <SearchDot />
        </Marker>
      )}
      {mapped.map(({ listing, located }) => {
        const focused = listing.id === focusedListingId;
        const rate = cheapestNightlyRateInCents(listing.pricing);
        return (
          <Marker
            key={`${listing.id}-${focused ? 'on' : 'off'}`}
            coordinate={located.coordinates}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={focused ? 10 : 1}
            onPress={() => onFocus(listing.id)}
            accessibilityLabel={`${listing.address} — ${listing.box}`}
          >
            <PricePin price={rate === null ? null : formatCents(rate)} focused={focused} approximate={located.precision === 'approximate'} />
          </Marker>
        );
      })}
    </MapView>
  );
};

const PricePin = ({ price, focused, approximate }: { price: string | null; focused: boolean; approximate: boolean }) => {
  const markColor = approximate ? palette.marking[600] : palette.signal[600];
  const fill = focused ? (approximate ? palette.marking[600] : palette.signal[600]) : '#ffffff';
  const ink = focused && !approximate ? '#ffffff' : palette.asphalt[950];

  return (
    <View style={{ alignItems: 'center', paddingBottom: 2, transform: [{ scale: focused ? 1.14 : 1 }] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingLeft: 4,
          paddingRight: price === null ? 4 : 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: fill,
          boxShadow: '0px 8px 18px -6px rgba(11, 13, 18, 0.45), 0px 0px 0px 1px rgba(11, 13, 18, 0.08)',
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? '#ffffff' : markColor,
          }}
        >
          <Text style={{ fontFamily: fonts.display.extrabold, fontSize: 12, lineHeight: 14, color: focused ? markColor : '#ffffff' }}>P</Text>
        </View>
        {price !== null && (
          <Text tabular style={{ fontFamily: fonts.sans.semibold, fontSize: 13, lineHeight: 16, color: ink }}>
            {price}
          </Text>
        )}
      </View>
      <View style={{ width: 10, height: 10, marginTop: -6, backgroundColor: fill, transform: [{ rotate: '45deg' }], borderRadius: 2 }} />
    </View>
  );
};

const SearchDot = () => (
  <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(21, 128, 61, 0.3)' }} />
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#15803d',
        borderWidth: 3,
        borderColor: '#ffffff',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.35)',
      }}
    />
  </View>
);
