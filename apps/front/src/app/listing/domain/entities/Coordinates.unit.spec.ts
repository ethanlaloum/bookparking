import { describe, expect, it } from 'vitest';

import {
  centerOf,
  NICE,
  distanceInKilometers,
  isPlaceable,
  precisionOfScore,
  spanInKilometers,
  zoomForSpan,
  type Coordinates,
} from './Coordinates';

const PARIS: Coordinates = { latitude: 48.8566, longitude: 2.3522 };
const LILLE: Coordinates = { latitude: 50.6292, longitude: 3.0573 };
const LYON: Coordinates = { latitude: 45.764, longitude: 4.8357 };

describe('the confidence a geocoder reports', () => {
  it('calls a near-perfect match exact', () => {
    expect(precisionOfScore(0.97)).toBe('exact');
  });

  it('calls a fallback onto a neighbouring street approximate', () => {
    expect(precisionOfScore(0.61)).toBe('approximate');
  });

  it('refuses to place anything below the minimum score', () => {
    expect(isPlaceable(0.42)).toBe(false);
    expect(isPlaceable(0.5)).toBe(true);
  });
});

describe('the distance between two places', () => {
  it('measures Paris to Lille at about two hundred kilometres', () => {
    expect(Math.round(distanceInKilometers(PARIS, LILLE))).toBe(204);
  });

  it('is nothing between a place and itself', () => {
    expect(distanceInKilometers(PARIS, PARIS)).toBe(0);
  });
});

describe('the map framing', () => {
  it('centres on the average of the points, not on the first one', () => {
    const center = centerOf([PARIS, LILLE]);
    expect(center.latitude).toBeCloseTo(49.7429, 3);
    expect(center.longitude).toBeCloseTo(2.70475, 3);
  });

  it('falls back on Nice when nothing could be placed, because that is the only city served', () => {
    expect(centerOf([])).toEqual(NICE);
  });

  it('centres on the single point it was given', () => {
    expect(centerOf([PARIS])).toEqual(PARIS);
  });

  it('spans the widest gap between any two points', () => {
    expect(Math.round(spanInKilometers([PARIS, LILLE, LYON]))).toBe(
      Math.round(distanceInKilometers(LILLE, LYON)),
    );
  });

  it('has no span with a single point', () => {
    expect(spanInKilometers([PARIS])).toBe(0);
  });

  it('zooms to the city on a single point and out on a city-wide spread', () => {
    expect(zoomForSpan(0)).toBe(13);
    expect(zoomForSpan(1)).toBe(14);
    expect(zoomForSpan(20)).toBe(10);
  });
});
