import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';

import {
  criteriaFromSearchParams,
  criteriaToSearchParams,
  type SearchCriteria,
} from '@front/app/listing/domain/entities/SearchCriteria';

const KEYS = ['adresse', 'lat', 'lon', 'vehicule', 'duree'] as const;
type CriteriaParams = Partial<Record<(typeof KEYS)[number], string>>;

/**
 * Les paramètres de route sont la mémoire de la recherche, comme l'URL sur le
 * site — et ce sont les mêmes clés (`adresse`, `lat`, `lon`, `vehicule`,
 * `duree`), lues et écrites par les mêmes fonctions pures du domaine. Un
 * critère illisible est ignoré, jamais rejeté.
 */
export const criteriaToRouteParams = (criteria: SearchCriteria): CriteriaParams => {
  const params = criteriaToSearchParams(criteria);
  return Object.fromEntries(KEYS.map((key) => [key, params.get(key) ?? undefined])) as CriteriaParams;
};

export const useSearchCriteria = (): {
  criteria: SearchCriteria;
  replaceCriteria: (next: SearchCriteria) => void;
} => {
  const params = useLocalSearchParams<CriteriaParams>();
  const { adresse, lat, lon, vehicule, duree } = params;

  const criteria = useMemo(() => {
    const search = new URLSearchParams();
    const entries: [string, string | undefined][] = [
      ['adresse', adresse],
      ['lat', lat],
      ['lon', lon],
      ['vehicule', vehicule],
      ['duree', duree],
    ];
    for (const [key, value] of entries) if (typeof value === 'string') search.set(key, value);
    return criteriaFromSearchParams(search);
  }, [adresse, lat, lon, vehicule, duree]);

  const replaceCriteria = useCallback((next: SearchCriteria) => {
    router.setParams(criteriaToRouteParams(next));
  }, []);

  return { criteria, replaceCriteria };
};
