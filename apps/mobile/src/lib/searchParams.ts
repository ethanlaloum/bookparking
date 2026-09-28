import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';

import {
  criteriaFromSearchParams,
  criteriaToSearchParams,
  type SearchCriteria,
} from '@front/app/listing/domain/entities/SearchCriteria';

const KEYS = ['adresse', 'lat', 'lon', 'vehicule', 'duree', 'arrivee', 'depart'] as const;
type CriteriaParams = Partial<Record<(typeof KEYS)[number], string>>;

/**
 * Les paramètres de route sont la mémoire de la recherche, comme l'URL sur le
 * site — et ce sont les mêmes clés (`adresse`, `lat`, `lon`, `vehicule`,
 * `duree`, `arrivee`, `depart`), lues et écrites par les mêmes fonctions pures du domaine. Un
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
  const { adresse, lat, lon, vehicule, duree, arrivee, depart } = params;

  const criteria = useMemo(() => {
    const search = new URLSearchParams();
    const entries: [string, string | undefined][] = [
      ['adresse', adresse],
      ['lat', lat],
      ['lon', lon],
      ['vehicule', vehicule],
      ['duree', duree],
      ['arrivee', arrivee],
      ['depart', depart],
    ];
    for (const [key, value] of entries) if (typeof value === 'string') search.set(key, value);
    return criteriaFromSearchParams(search);
  }, [adresse, lat, lon, vehicule, duree, arrivee, depart]);

  const replaceCriteria = useCallback((next: SearchCriteria) => {
    router.setParams(criteriaToRouteParams(next));
  }, []);

  return { criteria, replaceCriteria };
};
