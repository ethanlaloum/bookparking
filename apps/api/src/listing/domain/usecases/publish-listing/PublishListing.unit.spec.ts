import { createPublishListingSUT } from './PublishListing.sut';
import { AvailabilityPeriodExpiredError } from './errors/AvailabilityPeriodExpiredError';

const MARC = 'Marc D.';
const PLACE = { address: '12 rue Barla, 06300 Nice', box: '12' };
const COMPLETE_LISTING = {
  ...PLACE,
  accessDescription:
    'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
  photos: ['photo-1'],
  pricing: { day: 1200, week: 6000, month: 18000 },
  availability: { from: '2026-10-01', to: '2026-10-31' },
};

describe('PublishListing @SPEC-001', () => {
  it('publishes a listing carrying every mandatory field @EX-001-03', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
    sut.thenListingCarries(result, COMPLETE_LISTING);
  });

  it('activates the first listing of a box that has none @EX-001-01', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
    sut.thenIsOnlyActiveListingFor(PLACE);
  });

  it('publishes a listing carrying exactly one photo @EX-001-17', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      photos: ['photo-1'],
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
    sut.thenListingCarries(result, { photos: ['photo-1'] });
  });

  it('publishes a listing without identity document or IBAN @EX-001-12', async () => {
    const sut = createPublishListingSUT();
    sut.givenOwner({
      name: MARC,
      createdAt: '2026-09-09',
      identityDocument: null,
      iban: null,
    });

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
    sut.thenNoIdentityDocumentOrIbanWasRequired();
  });

  it('publishes a listing despite an unfinished identity verification @EX-001-34', async () => {
    const sut = createPublishListingSUT();
    sut.givenOwner({
      name: MARC,
      identityVerificationStartedAt: '2026-09-09',
      identityVerificationCompleted: false,
    });

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
  });

  it('refuses a listing whose availability period is entirely in the past @EX-001-18', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      availability: { from: '2025-10-01', to: '2025-10-31' },
      publishedAt: '2026-09-10',
    });

    sut.thenPublicationIsRefusedWith(result, AvailabilityPeriodExpiredError);
    sut.thenNoActiveListingFor(PLACE);
  });
});
