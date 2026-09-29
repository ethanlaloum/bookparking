import * as WebBrowser from 'expo-web-browser';

import type { PaymentPageNavigator } from '@front/app/rental/domain/ports/PaymentPageNavigator';
import { palette } from '../theme/tokens';

type Listener = () => void;

/**
 * Le site quitte bookparking pour Stripe par `window.location.assign` ; l'app
 * ouvre la même page dans un navigateur intégré (SFSafariViewController), posé
 * au-dessus de l'app. Le port ne demande que `open` : le reste — savoir si la
 * page est encore ouverte, la rouvrir, la refermer — sert l'écran de paiement
 * mobile, qui la surveille pendant que Stripe confirme l'empreinte.
 *
 * `openBrowserAsync` et non `openAuthSessionAsync` : l'adresse de retour de
 * Stripe est celle du site (`FRONT_BASE_URL`), pas un schéma de l'app, et une
 * session d'authentification ne sait intercepter qu'un schéma. Le retour ne
 * vaut de toute façon pas paiement : c'est la relecture de la demande qui
 * tranche, et c'est elle qui referme la page une fois l'empreinte posée.
 */
export class InAppBrowserPaymentPageNavigator implements PaymentPageNavigator {
  private lastUrl: string | null = null;
  private browserOpen = false;
  private readonly listeners = new Set<Listener>();

  open(url: string): void {
    this.lastUrl = url;
    this.present(url);
  }

  /** Rouvre la dernière page de paiement : Stripe la garde valable trente minutes. */
  reopen(): boolean {
    if (this.lastUrl === null || this.browserOpen) return false;
    this.present(this.lastUrl);
    return true;
  }

  close(): void {
    if (this.browserOpen) WebBrowser.dismissBrowser();
  }

  isOpen = (): boolean => this.browserOpen;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private present(url: string): void {
    this.setOpen(true);
    WebBrowser.openBrowserAsync(url, {
      controlsColor: palette.signal[600],
      dismissButtonStyle: 'close',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    })
      .catch(() => undefined)
      .finally(() => this.setOpen(false));
  }

  private setOpen(open: boolean): void {
    this.browserOpen = open;
    for (const listener of this.listeners) listener();
  }
}

export const paymentBrowser = new InAppBrowserPaymentPageNavigator();
