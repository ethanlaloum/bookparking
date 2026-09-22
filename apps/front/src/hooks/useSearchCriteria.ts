import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  criteriaFromSearchParams,
  criteriaToSearchParams,
  type SearchCriteria,
} from '../app/listing/domain/entities/SearchCriteria';

/**
 * L'URL est la seule mémoire de la recherche. Le hook ne décide rien : il lit
 * et écrit des paramètres, et laisse les fonctions pures du domaine traduire
 * dans les deux sens — c'est là que les règles sont prouvées, sans navigateur.
 */
export const useSearchCriteria = (): {
  criteria: SearchCriteria;
  replaceCriteria: (next: SearchCriteria) => void;
} => {
  const [searchParams, setSearchParams] = useSearchParams();

  const criteria = useMemo(() => criteriaFromSearchParams(searchParams), [searchParams]);

  const replaceCriteria = useCallback(
    (next: SearchCriteria) => {
      setSearchParams(criteriaToSearchParams(next), { replace: true });
    },
    [setSearchParams],
  );

  return { criteria, replaceCriteria };
};
