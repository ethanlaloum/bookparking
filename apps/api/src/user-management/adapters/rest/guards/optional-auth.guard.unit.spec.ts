import { createOptionalAuthGuardSUT } from './optional-auth.guard.sut';

describe('OptionalAuthGuard', () => {
  it('lets a visitor without token through, as nobody', async () => {
    const sut = createOptionalAuthGuardSUT();

    expect(await sut.whenGuarding(undefined)).toEqual({
      letThrough: true,
      user: null,
    });
    sut.thenTokensVerifiedAre([]);
  });

  it('lets a signed-in account through, as itself', async () => {
    const sut = createOptionalAuthGuardSUT();
    sut.givenValidToken('token-of-lea', 'account-lea');

    expect(await sut.whenGuarding('Bearer token-of-lea')).toEqual({
      letThrough: true,
      user: { id: 'account-lea' },
    });
  });

  it('lets an expired or forged token through, as nobody, instead of refusing a public page', async () => {
    const sut = createOptionalAuthGuardSUT();

    expect(await sut.whenGuarding('Bearer token-forge')).toEqual({
      letThrough: true,
      user: null,
    });
    sut.thenTokensVerifiedAre(['token-forge']);
  });

  it('ignores a header that is not a bearer token', async () => {
    const sut = createOptionalAuthGuardSUT();
    sut.givenValidToken('token-of-lea', 'account-lea');

    expect(await sut.whenGuarding('Basic token-of-lea')).toEqual({
      letThrough: true,
      user: null,
    });
    sut.thenTokensVerifiedAre([]);
  });
});
