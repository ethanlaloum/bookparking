import { createDeleteAccountSUT, DELETED_AT } from './DeleteAccount.sut';

const MARC_EMAIL = 'marc.d@example.com';
const LEA_EMAIL = 'lea.t@example.com';
const MARC_PASSWORD = 'Barla2026!';
const LEA_PASSWORD = 'Promenade06!';
const WRONG_PASSWORD = 'Mauvais2026!';

const WRONG_CREDENTIALS = {
  name: 'InvalidCredentialsError',
  message: 'Adresse e-mail ou mot de passe incorrect',
};
const STILL_COMMITTED = {
  name: 'AccountStillCommittedError',
  message:
    "Une demande, une réservation ou un versement est encore en cours sur votre compte : vous pourrez le supprimer une fois qu'ils seront terminés",
};

describe('DeleteAccount', () => {
  it('deletes the account and erases what it left elsewhere', async () => {
    const sut = createDeleteAccountSUT();
    const marc = await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);
    await sut.givenAccountFor(LEA_EMAIL, LEA_PASSWORD);

    const result = await sut.whenDeleting(marc.id, MARC_PASSWORD);

    sut.thenResultIsRight(result);
    sut.thenStoredAccountsAre([LEA_EMAIL]);
    sut.thenCommitmentChecksAre([{ accountId: marc.id, now: DELETED_AT }]);
    sut.thenErasedFootprintsAre([{ accountId: marc.id, email: MARC_EMAIL }]);
    await sut.thenSignInIsRefusedFor(MARC_EMAIL, MARC_PASSWORD);
  });

  it('frees the address for a new registration', async () => {
    const sut = createDeleteAccountSUT();
    const marc = await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);
    await sut.whenDeleting(marc.id, MARC_PASSWORD);

    const again = await sut.whenRegisteringAgain(MARC_EMAIL, LEA_PASSWORD);

    sut.thenRegisteredAsNewAccount(again, { email: MARC_EMAIL, not: marc.id });
    sut.thenStoredAccountsAre([MARC_EMAIL]);
  });

  it('refuses a wrong password and keeps everything', async () => {
    const sut = createDeleteAccountSUT();
    const marc = await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);

    const result = await sut.whenDeleting(marc.id, WRONG_PASSWORD);

    sut.thenResultIsLeftWith(result, WRONG_CREDENTIALS);
    sut.thenStoredAccountsAre([MARC_EMAIL]);
    sut.thenCommitmentChecksAre([]);
    sut.thenErasedFootprintsAre([]);
  });

  it('refuses an account that no longer exists', async () => {
    const sut = createDeleteAccountSUT();

    const result = await sut.whenDeleting('compte-supprime', MARC_PASSWORD);

    sut.thenResultIsLeftWith(result, WRONG_CREDENTIALS);
    sut.thenErasedFootprintsAre([]);
  });

  it('refuses while a request, a rental or a payout is still ongoing', async () => {
    const sut = createDeleteAccountSUT();
    const marc = await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);
    sut.givenOngoingCommitmentsFor(marc.id);

    const result = await sut.whenDeleting(marc.id, MARC_PASSWORD);

    sut.thenResultIsLeftWith(result, STILL_COMMITTED);
    sut.thenStoredAccountsAre([MARC_EMAIL]);
    sut.thenCommitmentChecksAre([{ accountId: marc.id, now: DELETED_AT }]);
    sut.thenErasedFootprintsAre([]);
  });

  it('reports a storage failure as unknown', async () => {
    const sut = createDeleteAccountSUT();
    const marc = await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);
    sut.givenAccountsAreUnreachable();

    const result = await sut.whenDeleting(marc.id, MARC_PASSWORD);

    sut.thenResultIsLeftWith(result, {
      name: 'UnknownError',
      message: 'Unexpected error: accounts repository is unreachable',
    });
    sut.thenErasedFootprintsAre([]);
  });
});
