import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { isStripeCheckoutUrl } from '../../entities/PaymentPage';
import type { RequestedRental, RequestRentalPayload } from '../../ports/RentalGateway';

// L'identifiant d'intention part en en-tête, jamais dans le corps : le schéma
// de `POST /rental-request` ne le connaît pas.
const toPayload = (
  intent: RequestRentalPayload & { idempotencyKey: string },
): RequestRentalPayload => ({
  address: intent.address,
  box: intent.box,
  fromDay: intent.fromDay,
  toDay: intent.toDay,
});

const NO_PAYMENT_PAGE =
  'Le serveur n’a ouvert aucune page de paiement. Réessayez dans un instant.';

export const requestRentalRequested = createAction<
  RequestRentalPayload & { idempotencyKey: string }
>('rental/requestRentalRequested');
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
      rentalGateway.request(toPayload(action.payload), action.payload.idempotencyKey).pipe(
        map((requested: RequestedRental | undefined) => {
          // Une api antérieure à SPEC-004 répond 201 sans corps : lire son
          // `checkoutUrl` levait un TypeError brut, affiché tel quel.
          if (requested === undefined || typeof requested.checkoutUrl !== 'string')
            return requestRentalFailed({ errorCode: NO_PAYMENT_PAGE });
          if (!isStripeCheckoutUrl(requested.checkoutUrl))
            return requestRentalFailed({ errorCode: 'Adresse de paiement inattendue' });
          paymentPageNavigator.open(requested.checkoutUrl);
          return requestRentalSucceeded({ ...toPayload(action.payload), requestId: requested.id });
        }),
        catchError((error: Error) => of(requestRentalFailed({ errorCode: error.message }))),
      ),
    ),
  );
