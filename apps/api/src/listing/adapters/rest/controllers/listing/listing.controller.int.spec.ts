import { Either } from 'effect/index';
import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { ListingBuilder } from '../../../../domain/builders/ListingBuilder';
import { VehicleType } from '../../../../domain/entities/Listing';
import { ActiveListingNotFoundError } from '../../../../domain/errors/ActiveListingNotFoundError';
import { AvailabilityPeriodExpiredError } from '../../../../domain/errors/AvailabilityPeriodExpiredError';
import { IncompletePricingError } from '../../../../domain/errors/IncompletePricingError';
import { UnknownPhotoError } from '../../../../domain/errors/UnknownPhotoError';
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
      expect(response.body.message).toEqual(
        'photos: Une annonce porte de 1 à 10 photos',
      );
      expect(sut.publishListing.calls).toEqual([]);
    });

    it('answers 400 when a photo was never uploaded by the landlord', async () => {
      sut.publishListing.willResolve(Either.left(new UnknownPhotoError()));

      const response = await http()
        .post('/listing')
        .set('Authorization', 'Bearer token-of-marc')
        .send(COMPLETE_LISTING_BODY);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        "Une photo de l'annonce n'a pas été envoyée par son propriétaire",
      );
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
  describe('GET /listing/:id @SPEC-002', () => {
    it('serves a listing to a visitor with no account @EX-002-11', async () => {
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
      expect(response.body.photos).not.toEqual(undefined);
      expect(response.body.pricing).not.toEqual(undefined);
    });
  });
  describe('GET /listing?fromDay&toDay', () => {
    it('lists only the places free on the stay, to a visitor with no account', async () => {
      sut.authState.user = null;
      sut.givenFreeListings([
        { id: LISTING_ID, address: '12 rue Barla, 06300 Nice', box: '12' },
      ]);

      const response = await http().get(
        '/listing?fromDay=2026-10-10&toDay=2026-10-12',
      );

      expect(response.status).toEqual(200);
      expect(
        response.body.map((listing: { id: string; box: string }) => ({
          id: listing.id,
          box: listing.box,
        })),
      ).toEqual([{ id: LISTING_ID, box: '12' }]);
      expect(sut.listFreeListings.calls).toEqual([
        { stay: { from: '2026-10-10', to: '2026-10-12' }, viewerId: null },
      ]);
      expect(sut.listActiveListings.calls).toEqual([]);
    });

    it('searches on behalf of the signed-in driver, so that her own unpaid request does not hide a place', async () => {
      sut.givenFreeListings([]);

      const response = await http()
        .get('/listing?fromDay=2026-10-10&toDay=2026-10-12')
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(200);
      expect(sut.listFreeListings.calls).toEqual([
        {
          stay: { from: '2026-10-10', to: '2026-10-12' },
          viewerId: MARC_ACCOUNT_ID,
        },
      ]);
    });

    it('answers 400 when only one end of the stay is given', async () => {
      const response = await http().get('/listing?fromDay=2026-10-10');

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'Une recherche par dates demande une arrivée et un départ',
      );
      expect(sut.listFreeListings.calls).toEqual([]);
      expect(sut.listActiveListings.calls).toEqual([]);
    });

    it('answers 400 when a day is given twice', async () => {
      const response = await http().get(
        '/listing?fromDay=2026-10-10&fromDay=2026-10-11&toDay=2026-10-12',
      );

      expect(response.status).toEqual(400);
      expect(sut.listFreeListings.calls).toEqual([]);
    });

    it('answers 400 with the domain refusal for an unreadable stay', async () => {
      sut.givenStayIsRefused();

      const response = await http().get(
        '/listing?fromDay=2026-10-12&toDay=2026-10-10',
      );

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'Les dates recherchées sont invalides',
      );
    });
  });

  describe('GET /listing', () => {
    it('lists the active listings to a visitor with no account', async () => {
      sut.authState.user = null;
      sut.givenActiveListings([
        { id: LISTING_ID, address: '12 rue Barla, 06300 Nice', box: '12' },
        {
          id: '9c2e4f5a-1b3d-4e6f-8a9b-0c1d2e3f4a5b',
          address: '3 avenue Malausséna, 06000 Nice',
          box: '4',
        },
      ]);

      const response = await http().get('/listing');

      expect(response.status).toEqual(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].address).toEqual('12 rue Barla, 06300 Nice');
      expect(response.body[1].box).toEqual('4');
    });

    it('never exposes the access description in the list', async () => {
      sut.authState.user = null;
      sut.givenActiveListings([
        {
          id: LISTING_ID,
          address: '12 rue Barla, 06300 Nice',
          box: '12',
          accessDescription: 'portail bleu, code 1234',
        },
      ]);

      const response = await http().get('/listing');

      expect(response.status).toEqual(200);
      expect(JSON.stringify(response.body)).not.toContain('accessDescription');
      expect(JSON.stringify(response.body)).not.toContain('1234');
    });

    it('rends an empty list when nothing is published', async () => {
      sut.authState.user = null;
      sut.givenActiveListings([]);

      const response = await http().get('/listing');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);
    });
  });
  describe('DELETE /listing/:id', () => {
    it('refuses an unpublication from a visitor with no account', async () => {
      const response = await http().delete(`/listing/${LISTING_ID}`);

      expect(response.status).toEqual(401);
      sut.thenNothingWasUnpublished();
    });

    it('unpublishes the place the identifier resolves to', async () => {
      sut.givenActiveListing({
        id: LISTING_ID,
        address: COMPLETE_LISTING_BODY.address,
        box: COMPLETE_LISTING_BODY.box,
      });
      sut.givenUnpublicationSucceeds();

      const response = await http()
        .delete(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(204);
      sut.thenListingWasUnpublishedFor({
        address: COMPLETE_LISTING_BODY.address,
        box: COMPLETE_LISTING_BODY.box,
      });
    });

    it('answers 204 for a listing that is already unpublished', async () => {
      sut.givenNoListing();

      const response = await http()
        .delete(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(204);
      sut.thenNothingWasUnpublished();
    });

    it('answers 204 for a malformed identifier, never 500', async () => {
      const response = await http()
        .delete('/listing/pas-un-identifiant')
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(204);
      sut.thenNothingWasUnpublished();
    });

    it('answers 403 for a listing owned by someone else', async () => {
      sut.givenActiveListing({
        id: LISTING_ID,
        address: COMPLETE_LISTING_BODY.address,
        box: COMPLETE_LISTING_BODY.box,
      });
      sut.givenListingBelongsToSomeoneElse();

      const response = await http()
        .delete(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(403);
    });
  });

  describe('GET /listing/mine', () => {
    it('gives the owner back the access instructions of their own listings', async () => {
      const listing = new ListingBuilder()
        .withId(LISTING_ID)
        .withOwnerId(MARC_ACCOUNT_ID)
        .withAccessDescription(COMPLETE_LISTING_BODY.accessDescription)
        .withPhotos(['photo-1.jpg'])
        .withAcceptedVehicles([VehicleType.VOITURE])
        .withPricing({
          dayInCents: 1200,
          weekInCents: null,
          monthInCents: null,
        })
        .withAvailability({
          from: new Date('2026-10-01T00:00:00.000Z'),
          to: new Date('2026-10-31T00:00:00.000Z'),
        })
        .build();
      sut.givenOwnerListings([listing]);

      const response = await http()
        .get('/listing/mine')
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([
        {
          id: LISTING_ID,
          address: '12 rue Barla, 06300 Nice',
          box: '12',
          status: 'ACTIVE',
          accessDescription: COMPLETE_LISTING_BODY.accessDescription,
          photos: ['photo-1.jpg'],
          acceptedVehicles: ['voiture'],
          pricing: { dayInCents: 1200, weekInCents: null, monthInCents: null },
          availability: {
            from: '2026-10-01T00:00:00.000Z',
            to: '2026-10-31T00:00:00.000Z',
          },
        },
      ]);
    });
  });

  describe('PATCH /listing/:id', () => {
    const EDITION = {
      accessDescription: 'badge au gardien, le box est au second sous-sol',
      photos: ['photo-2.jpg', 'photo-3.jpg'],
      acceptedVehicles: ['velo', 'electrique'],
      pricing: { weekInCents: 7000, monthInCents: 20000 },
      availability: { from: '2026-11-01', to: '2027-01-31' },
    };

    const editedListing = () =>
      new ListingBuilder()
        .withId(LISTING_ID)
        .withOwnerId(MARC_ACCOUNT_ID)
        .withAccessDescription(EDITION.accessDescription)
        .withPhotos(EDITION.photos)
        .withAcceptedVehicles([VehicleType.VELO, VehicleType.ELECTRIQUE])
        .withPricing({
          dayInCents: null,
          weekInCents: 7000,
          monthInCents: 20000,
        })
        .withAvailability({
          from: new Date('2026-11-01T00:00:00.000Z'),
          to: new Date('2027-01-31T00:00:00.000Z'),
        })
        .build();

    it('refuses an edit from a visitor with no account', async () => {
      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .send(EDITION);

      expect(response.status).toEqual(401);
      sut.thenNothingWasEdited();
    });

    it('edits the listing of the signed-in owner and answers with what the owner now sees', async () => {
      sut.givenEditSucceeds(editedListing());

      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send(EDITION);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        id: LISTING_ID,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
        status: 'ACTIVE',
        accessDescription: EDITION.accessDescription,
        photos: EDITION.photos,
        acceptedVehicles: ['velo', 'electrique'],
        pricing: { dayInCents: null, weekInCents: 7000, monthInCents: 20000 },
        availability: {
          from: '2026-11-01T00:00:00.000Z',
          to: '2027-01-31T00:00:00.000Z',
        },
      });
      sut.thenEditWasRequestedWith({
        ownerId: MARC_ACCOUNT_ID,
        listingId: LISTING_ID,
        accessDescription: EDITION.accessDescription,
        photos: EDITION.photos,
        acceptedVehicles: [VehicleType.VELO, VehicleType.ELECTRIQUE],
        pricing: { dayInCents: null, weekInCents: 7000, monthInCents: 20000 },
        availability: {
          from: new Date('2026-11-01T00:00:00.000Z'),
          to: new Date('2027-01-31T00:00:00.000Z'),
        },
      });
    });

    it('keeps every mistyped value out of the validation response', async () => {
      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send({
          accessDescription: 4242,
          photos: 'photo-secrete',
          acceptedVehicles: ['tracteur'],
          pricing: { dayInCents: 'mille-deux-cents' },
          availability: { from: 'lundi-prochain', to: 31337 },
        });

      expect(response.status).toEqual(400);
      const body = JSON.stringify(response.body);
      for (const submitted of [
        '4242',
        'photo-secrete',
        'tracteur',
        'mille-deux-cents',
        'lundi-prochain',
        '31337',
      ])
        expect(body).not.toContain(submitted);
      sut.thenNothingWasEdited();
    });

    it('refuses a listing without any photo', async () => {
      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send({ ...EDITION, photos: [] });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'photos: Une annonce porte de 1 à 10 photos',
      );
      sut.thenNothingWasEdited();
    });

    it('refuses a listing carrying more than ten photos', async () => {
      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send({
          ...EDITION,
          photos: Array.from({ length: 11 }, (_, index) => `photo-${index}`),
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'photos: Une annonce porte de 1 à 10 photos',
      );
      sut.thenNothingWasEdited();
    });

    it('answers 400 when a new photo was never uploaded by the owner', async () => {
      sut.givenEditIsRefusedWith(new UnknownPhotoError());

      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send(EDITION);

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        "Une photo de l'annonce n'a pas été envoyée par son propriétaire",
      );
    });

    it('answers 400 with the domain refusal for a pricing grid with no tier at all', async () => {
      sut.givenEditIsRefusedWith(new IncompletePricingError());

      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send({ ...EDITION, pricing: {} });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'La grille tarifaire est incomplète',
      );
    });

    it('answers 400 for dates that are already past', async () => {
      sut.givenEditIsRefusedWith(new AvailabilityPeriodExpiredError());

      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send({
          ...EDITION,
          availability: { from: '2020-01-01', to: '2020-01-31' },
        });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'La période de disponibilité est déjà passée',
      );
    });

    it('answers 404 when no active listing carries that identifier', async () => {
      sut.givenEditIsRefusedWith(new ActiveListingNotFoundError());

      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send(EDITION);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual(
        "Cette place n'a aucune annonce active",
      );
    });

    it('answers 404 for a malformed identifier without reaching the domain', async () => {
      const response = await http()
        .patch('/listing/pas-un-uuid')
        .set('Authorization', 'Bearer token-of-marc')
        .send(EDITION);

      expect(response.status).toEqual(404);
      sut.thenNothingWasEdited();
    });

    it('answers 403 for a listing owned by someone else', async () => {
      sut.givenListingBelongsToSomeoneElse();

      const response = await http()
        .patch(`/listing/${LISTING_ID}`)
        .set('Authorization', 'Bearer token-of-marc')
        .send(EDITION);

      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual(
        'Cette annonce ne vous appartient pas',
      );
    });
  });
});
