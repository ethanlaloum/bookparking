import { createUnpublishListingSUT } from './UnpublishListing.sut';

const MARC = 'Marc D.';
const PLACE = { address: '12 rue Barla, 06300 Nice', box: '12' };
const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };

describe('UnpublishListing @SPEC-001', () => {
  it('unpublishes a listing without releasing its confirmed rental @EX-001-11', async () => {
    const sut = createUnpublishListingSUT();
    sut.givenActiveListing({ owner: MARC, ...PLACE });
    sut.givenConfirmedRental({ ...PLACE, ...OCTOBER });

    const result = await sut.whenUnpublishing({
      owner: MARC,
      ...PLACE,
      on: '2026-10-10',
    });

    sut.thenResultIsRight(result);
    sut.thenListingIsNoLongerPubliclyVisible(PLACE);
    sut.thenRentalStaysConfirmed({ ...PLACE, ...OCTOBER });
    sut.thenNoRentedDateIsReleased({ ...PLACE, ...OCTOBER });
  });

  it('keeps an already unpublished listing unpublished without error @EX-001-33', async () => {
    const sut = createUnpublishListingSUT();
    sut.givenUnpublishedListing({
      owner: MARC,
      ...PLACE,
      unpublishedOn: '2026-10-10',
    });
    sut.givenConfirmedRental({ ...PLACE, ...OCTOBER });

    const result = await sut.whenUnpublishing({
      owner: MARC,
      ...PLACE,
      on: '2026-10-11',
    });

    sut.thenResultIsRight(result);
    sut.thenListingIsNoLongerPubliclyVisible(PLACE);
    sut.thenRentalStaysConfirmed({ ...PLACE, ...OCTOBER });
  });
});
