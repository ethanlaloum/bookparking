import { describe, expect, it } from 'vitest';

import { accountHrefOf, accountTabOfSlug } from './accountTabs';

// Les e-mails de l'api écrivent ces adresses en dur (`composeEmail.ts`) : ce
// test fige les deux côtés du même contrat.
describe('the account tab an address opens', () => {
  it('writes the addresses the notification emails link to', () => {
    expect(accountHrefOf('received')).toEqual('/compte?onglet=demandes-recues');
    expect(accountHrefOf('mine')).toEqual('/compte?onglet=reservations');
    expect(accountHrefOf('payouts')).toEqual('/compte?onglet=versements');
  });

  it('reads them back into a tab, and nothing else', () => {
    expect(accountTabOfSlug('demandes-recues')).toEqual('received');
    expect(accountTabOfSlug('reservations')).toEqual('mine');
    expect(accountTabOfSlug('reglages')).toBeNull();
    expect(accountTabOfSlug(null)).toBeNull();
  });
});
