import { Either } from 'effect/index';
import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import {
  createListingControllerSUT,
  MARC_ACCOUNT_ID,
} from './listing.controller.sut';

const LISTING_ID = '8f1d3b3e-9f1a-4a0e-8f1a-2b7c5d9e0a11';

const COMPLETE_LISTING_BODY = {
  address: '12 rue Barla, 06300 Nice',
  box: '12',
  accessDescription:
    'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
  photos: ['photo-1.jpg'],
  pricing: { dayInCents: 1200, weekInCents: 6000, monthInCents: 18000 },
  availability: { from: '2026-10-01', to: '2026-10-31' },
};

describe('ListingController @SPEC-001', () => {
  let sut: ReturnType<typeof createListingControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createListingControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /listing', () => {
    it('responds with a validation error when the listing has no photo @EX-001-04', async () => {
      const response = await http()
        .post('/listing')
        .set('Authorization', 'Bearer token-of-marc')
        .send({ ...COMPLETE_LISTING_BODY, photos: [] });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(expect.stringContaining('photos'));
      expect(sut.publishListing.calls).toEqual([]);
    });

    it('refuses to publish a listing for an unauthenticated visitor @EX-001-36', async () => {
      sut.authState.user = null;

      const response = await http()
        .post('/listing')
        .send(COMPLETE_LISTING_BODY);

      expect(response.status).toEqual(401);
      expect(sut.publishListing.calls).toEqual([]);
    });

    it('publishes the listing for the authenticated landlord whatever owner the body names @EX-001-37', async () => {
      sut.publishListing.willResolve(Either.right(undefined));

      const response = await http()
        .post('/listing')
        .set('Authorization', 'Bearer token-of-marc')
        .send({ ...COMPLETE_LISTING_BODY, ownerName: 'Pierre L.' });

      expect(response.status).toEqual(201);
      expect(sut.publishListing.calls).toEqual([
        expect.objectContaining({ ownerId: MARC_ACCOUNT_ID }),
      ]);
      expect(JSON.stringify(sut.publishListing.calls)).not.toContain(
        'Pierre L.',
      );
    });
  });

  describe('GET /listing/:id', () => {
    it('exposes the exact address and box to a signed-in driver without any booking @EX-001-08', async () => {
      sut.givenActiveListing({
        id: LISTING_ID,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
      });

      const response = await http()
        .get(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-lea');

      expect(response.status).toEqual(200);
      expect(response.body.address).toEqual('12 rue Barla, 06300 Nice');
      expect(response.body.box).toEqual('12');
      expect(sut.getListing.calls).toEqual([
        expect.objectContaining({ listingId: LISTING_ID }),
      ]);
    });

    it('exposes the exact address and box to an unauthenticated visitor @EX-001-26', async () => {
      sut.authState.user = null;
      sut.givenActiveListing({
        id: LISTING_ID,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
      });

      const response = await http().get(`/listing/${LISTING_ID}`);

      expect(response.status).toEqual(200);
      expect(response.body.address).toEqual('12 rue Barla, 06300 Nice');
      expect(response.body.box).toEqual('12');
      expect(sut.getListing.calls).toEqual([
        expect.objectContaining({ listingId: LISTING_ID }),
      ]);
    });

    it('does not serve an unpublished listing nor its address @EX-001-27', async () => {
      sut.givenUnpublishedListing({
        id: LISTING_ID,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
      });

      const response = await http()
        .get(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-lea');

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Annonce introuvable');
      expect(response.body.address).toBeUndefined();
      expect(response.body.box).toBeUndefined();
      expect(sut.getListing.calls).toEqual([
        expect.objectContaining({ listingId: LISTING_ID }),
      ]);
    });

    it('serves a listing without its access description @EX-001-44', async () => {
      sut.authState.user = null;
      sut.givenActiveListing({
        id: LISTING_ID,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
        accessDescription: 'portail bleu à gauche du 12',
      });

      const response = await http().get(`/listing/${LISTING_ID}`);

      expect(response.status).toEqual(200);
      expect(response.body.address).toEqual('12 rue Barla, 06300 Nice');
      expect(response.body.box).toEqual('12');
      expect(response.body.accessDescription).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('portail bleu');
    });

    it('answers the same not-found response for a malformed listing id @EX-001-45', async () => {
      sut.authState.user = null;
      sut.givenNoListing();

      const malformed = await http().get('/listing/pas-un-identifiant');
      const unknown = await http().get(`/listing/${LISTING_ID}`);

      expect(malformed.status).toEqual(unknown.status);
      expect(malformed.body).toEqual(unknown.body);
      expect(malformed.status).toEqual(404);
      expect(malformed.body.message).toEqual('Annonce introuvable');
      expect(sut.getListing.calls).toEqual([
        expect.objectContaining({ listingId: LISTING_ID }),
      ]);
    });
  });
});
