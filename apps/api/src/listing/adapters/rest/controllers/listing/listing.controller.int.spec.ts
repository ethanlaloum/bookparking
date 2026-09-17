import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { createListingControllerSUT } from './listing.controller.sut';

describe('ListingController @SPEC-001', () => {
  let sut: ReturnType<typeof createListingControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createListingControllerSUT();
    testApp = await createControllerTestApp(sut.metadata);
  });

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /listing', () => {
    it('responds with a validation error when the listing has no photo @EX-001-04', async () => {
      const response = await http()
        .post('/listing')
        .send({
          ownerName: 'Marc D.',
          address: '12 rue Barla, 06300 Nice',
          box: '12',
          accessDescription:
            'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
          photos: [],
          pricing: { dayInCents: 1200, weekInCents: 6000, monthInCents: 18000 },
          availability: { from: '2026-10-01', to: '2026-10-31' },
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(expect.stringContaining('photos'));
      expect(sut.publishListing.calls).toEqual([]);
    });
  });
});
