import { describe, expect, it } from 'vitest';

import { anOwnerListing } from '../store/testing/InMemoryDependencies';
import { listingContentOf, listingFormValuesOf } from './listingFormValues';

describe('the listing form', () => {
  it('opens an owner listing with every field filled, an empty tier left blank', () => {
    const values = listingFormValuesOf(
      anOwnerListing({
        accessDescription: 'Badge au gardien.',
        photos: ['photo-1.jpg', 'photo-2.jpg'],
        acceptedVehicles: ['moto', 'voiture'],
        pricing: { dayInCents: 1250, weekInCents: null, monthInCents: 25000 },
        availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
      }),
    );

    expect(values).toEqual({
      address: '12 rue Barla, 06300 Nice',
      box: 'B12',
      accessDescription: 'Badge au gardien.',
      photos: [
        { kind: 'stored', id: 'photo-1.jpg' },
        { kind: 'stored', id: 'photo-2.jpg' },
      ],
      acceptedVehicles: ['moto', 'voiture'],
      dayInCents: '12.5',
      weekInCents: '',
      monthInCents: '250',
      from: '2026-10-01',
      to: '2026-12-31',
    });
  });

  it('sends a blank tier as absent, never as null, trimmed instructions and the photos in their order', () => {
    const content = listingContentOf({
      address: '12 rue Barla, 06300 Nice',
      box: 'B12',
      accessDescription: '  Badge au gardien. ',
      photos: [
        { kind: 'local', photo: { uri: 'blob:facade', name: 'facade.jpg', type: 'image/jpeg' } },
        { kind: 'stored', id: 'photo-2.jpg' },
      ],
      acceptedVehicles: ['velo'],
      dayInCents: '12,5',
      weekInCents: '',
      monthInCents: '250',
      from: '2026-11-01',
      to: '2027-01-31',
    });

    expect(JSON.parse(JSON.stringify(content))).toEqual({
      accessDescription: 'Badge au gardien.',
      photos: [
        { kind: 'local', photo: { uri: 'blob:facade', name: 'facade.jpg', type: 'image/jpeg' } },
        { kind: 'stored', id: 'photo-2.jpg' },
      ],
      acceptedVehicles: ['velo'],
      pricing: { dayInCents: 1250, monthInCents: 25000 },
      availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
    });
  });
});
