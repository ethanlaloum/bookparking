import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of, tap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export type StripePage = 'onboarding' | 'dashboard';

export const stripePageRequested = createAction<{ page: StripePage }>('payout/stripePageRequested');
export const stripePageOpened = createAction('payout/stripePageOpened');
export const stripePageFailed = createAction<{ errorCode: string }>('payout/stripePageFailed');

/**
 * Les coordonnées bancaires se saisissent chez Stripe, jamais ici : l'api rend
 * l'adresse d'une page de Stripe, et le navigateur des pages de paiement
 * l'ouvre — une redirection sur le site, un navigateur intégré dans l'app.
 * `exhaustMap` : un second clic pendant l'appel n'en ouvre pas une seconde.
 */
export const openStripePageEpic: AppEpic = (
  action$,
  _state$,
  { payoutGateway, paymentPageNavigator },
) =>
  action$.pipe(
    filter(stripePageRequested.match),
    exhaustMap(({ payload }) =>
      (payload.page === 'onboarding'
        ? payoutGateway.onboardingLink()
        : payoutGateway.dashboardLink()
      ).pipe(
        tap((url) => paymentPageNavigator.open(url)),
        map(() => stripePageOpened()),
        catchError((error: Error) => of(stripePageFailed({ errorCode: error.message }))),
      ),
    ),
  );
