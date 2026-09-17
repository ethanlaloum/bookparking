import { createPublishListingSUT } from './PublishListing.sut';
import { AvailabilityPeriodExpiredError } from './errors/AvailabilityPeriodExpiredError';
import { IncompletePricingError } from '../../errors/IncompletePricingError';
import { ListingAlreadyActiveError } from './errors/ListingAlreadyActiveError';
import { PhotoStorageFailedError } from './errors/PhotoStorageFailedError';

const MARC = 'Marc D.';
const PIERRE = 'Pierre L.';
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

  it('refuses a listing when photo storage fails @EX-001-19', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);
    sut.givenPhotoStorageFailingOnEveryUpload();

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-10',
    });

    sut.thenPublicationIsRefusedWith(result, PhotoStorageFailedError);
    sut.thenNoActiveListingFor(PLACE);
  });

  it('refuses a second listing for a box that already has an active one @EX-001-02', async () => {
    const sut = createPublishListingSUT();
    sut.givenActiveListing({ owner: MARC, ...PLACE });

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-11',
    });

    sut.thenPublicationIsRefusedWith(result, ListingAlreadyActiveError);
    sut.thenRefusalMessageIs(result, 'Cette place a déjà une annonce active');
    sut.thenIsOnlyActiveListingFor(PLACE);
    sut.thenActiveListingOf(MARC, PLACE);
  });

  it("refuses another owner's listing for a box that already has an active one @EX-001-14", async () => {
    const sut = createPublishListingSUT();
    sut.givenActiveListing({ owner: MARC, ...PLACE });

    const result = await sut.whenPublishing({
      owner: PIERRE,
      ...COMPLETE_LISTING,
      publishedAt: '2026-09-11',
    });

    sut.thenPublicationIsRefusedWith(result, ListingAlreadyActiveError);
    sut.thenRefusalMessageIs(result, 'Cette place a déjà une annonce active');
    sut.thenIsOnlyActiveListingFor(PLACE);
    sut.thenActiveListingOf(MARC, PLACE);
    sut.thenNoListingOf(PIERRE, PLACE);
  });

  it('refuses a new listing for a box whose active listing is under rental @EX-001-15', async () => {
    const sut = createPublishListingSUT();
    sut.givenActiveListing({ owner: MARC, ...PLACE });

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      publishedAt: '2026-10-15',
    });

    sut.thenPublicationIsRefusedWith(result, ListingAlreadyActiveError);
    sut.thenRefusalMessageIs(result, 'Cette place a déjà une annonce active');
    sut.thenIsOnlyActiveListingFor(PLACE);
  });

  it('treats a differently spelled address with the same box as the same place @EX-001-16', async () => {
    const sut = createPublishListingSUT();
    sut.givenActiveListing({
      owner: MARC,
      address: '12 rue barla, 06300 nice',
      box: '12',
    });

    const result = await sut.whenPublishing({
      owner: PIERRE,
      ...COMPLETE_LISTING,
      address: '12 Rue Barla, 06300 NICE',
      box: '12',
      publishedAt: '2026-09-11',
    });

    sut.thenPublicationIsRefusedWith(result, ListingAlreadyActiveError);
    sut.thenRefusalMessageIs(result, 'Cette place a déjà une annonce active');
    sut.thenIsOnlyActiveListingFor({
      address: '12 Rue Barla, 06300 NICE',
      box: '12',
    });
    sut.thenIsOnlyActiveListingFor({
      address: '12 rue barla, 06300 nice',
      box: '12',
    });
  });

  it('accepts a listing for another box at the same address @EX-001-35', async () => {
    const sut = createPublishListingSUT();
    sut.givenActiveListing({ owner: MARC, ...PLACE });

    const result = await sut.whenPublishing({
      owner: PIERRE,
      ...COMPLETE_LISTING,
      box: '14',
      publishedAt: '2026-09-11',
    });

    sut.thenResultIsRight(result);
    sut.thenActiveListingOf(MARC, PLACE);
    sut.thenActiveListingOf(PIERRE, { address: PLACE.address, box: '14' });
  });

  it('refuses a listing whose box differs from an active one only by surrounding spaces @EX-001-38', async () => {
    const sut = createPublishListingSUT();
    sut.givenActiveListing({ owner: MARC, ...PLACE });

    const result = await sut.whenPublishing({
      owner: PIERRE,
      ...COMPLETE_LISTING,
      box: '12 ',
      publishedAt: '2026-09-11',
    });

    sut.thenPublicationIsRefusedWith(result, ListingAlreadyActiveError);
    sut.thenRefusalMessageIs(result, 'Cette place a déjà une annonce active');
    sut.thenNoListingOf(PIERRE, PLACE);
    sut.thenNoListingOf(PIERRE, { address: PLACE.address, box: '12 ' });
  });

  it('refuses a listing whose pricing offers no duration @EX-001-07', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      pricing: { day: null, week: null, month: null },
      publishedAt: '2026-09-10',
    });

    sut.thenPublicationIsRefusedWith(result, IncompletePricingError);
    sut.thenRefusalMessageIs(result, 'La grille tarifaire est incomplète');
    sut.thenNoActiveListingFor(PLACE);
  });

  it('publishes a listing whose pricing offers only the month @EX-001-06', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      pricing: { day: null, week: null, month: 18000 },
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
    sut.thenListingCarries(result, {
      pricing: { day: null, week: null, month: 18000 },
    });
  });

  it('publishes a listing priced at zero with no price bound @EX-001-25', async () => {
    const sut = createPublishListingSUT();
    sut.givenNoActiveListingFor(PLACE);

    const result = await sut.whenPublishing({
      owner: MARC,
      ...COMPLETE_LISTING,
      pricing: { day: null, week: null, month: 0 },
      publishedAt: '2026-09-10',
    });

    sut.thenListingIsActive(result);
    sut.thenListingCarries(result, {
      pricing: { day: null, week: null, month: 0 },
    });
  });
});
