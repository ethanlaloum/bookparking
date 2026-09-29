import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { RentalTerms } from '../../entities/RentalTerms';

export const readRentalTermsRequested = createAction('rentalTerms/readRentalTermsRequested');
export const readRentalTermsSucceeded = createAction<RentalTerms>('rentalTerms/readRentalTermsSucceeded');
export const readRentalTermsFailed = createAction<{ errorCode: string }>('rentalTerms/readRentalTermsFailed');

export const readRentalTermsEpic: AppEpic = (action$, _state$, { rentalTermsGateway }) =>
  action$.pipe(
    filter(readRentalTermsRequested.match),
    exhaustMap(() =>
      rentalTermsGateway.read().pipe(
        map((terms) => readRentalTermsSucceeded(terms)),
        catchError((error: Error) => of(readRentalTermsFailed({ errorCode: error.message }))),
      ),
    ),
  );
