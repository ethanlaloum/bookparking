import type { PaymentPageNavigator } from '../domain/ports/PaymentPageNavigator';

export class BrowserPaymentPageNavigator implements PaymentPageNavigator {
  open(url: string): void {
    window.location.assign(url);
  }
}
