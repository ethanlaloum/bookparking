import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { isStripeCheckoutUrl } from '../../entities/PaymentPage';
import type { RequestRentalPayload } from '../../ports/RentalGateway';

export const requestRentalRequested = createAction<RequestRentalPayload>(
  'rental/requestRentalRequested',
);
export const requestRentalSucceeded = createAction<RequestRentalPayload & { requestId: string }>(
  'rental/requestRentalSucceeded',
);
export const requestRentalFailed = createAction<{ errorCode: string }>(
  'rental/requestRentalFailed',
);
export const resetRequestRentalState = createAction('rental/resetRequestRentalState');

/**
 * La demande ouverte, le navigateur part vers la page de paiement de Stripe :
 * c'est l'empreinte, constatée par l'api, qui la fera passer au propriétaire.
 * Une adresse de paiement qui ne serait pas celle de Stripe n'est jamais
 * suivie, même si l'api la rendait.
 */
export const requestRentalEpic: AppEpic = (
  action$,
  _state$,
  { rentalGateway, paymentPageNavigator },
) =>
  action$.pipe(
    filter(requestRentalRequested.match),
    exhaustMap((action) =>
      rentalGateway.request(action.payload).pipe(
        map((requested) => {
          if (!isStripeCheckoutUrl(requested.checkoutUrl))
            return requestRentalFailed({ errorCode: 'Adresse de paiement inattendue' });
          paymentPageNavigator.open(requested.checkoutUrl);
          return requestRentalSucceeded({ ...action.payload, requestId: requested.id });
        }),
        catchError((error: Error) => of(requestRentalFailed({ errorCode: error.message }))),
      ),
    ),
  );
