import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import {
  MAX_PHOTO_SIZE_IN_BYTES,
  PhotoFormat,
} from '../../../../domain/entities/ListingPhoto';
import { UnsupportedPhotoFormatError } from '../../../../domain/errors/UnsupportedPhotoFormatError';
import {
  createListingPhotoControllerSUT,
  MARC_ACCOUNT_ID,
} from './listing-photo.controller.sut';

const PHOTO_ID = '0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff,
]);

describe('ListingPhotoController', () => {
  let sut: ReturnType<typeof createListingPhotoControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createListingPhotoControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /listing/photo', () => {
    it('stores the uploaded bytes for the signed-in landlord and answers the new identifier', async () => {
      sut.givenUploadSucceedsAs(PHOTO_ID);

      const response = await http()
        .post('/listing/photo')
        .set('Authorization', 'Bearer token-of-marc')
        .attach('photo', JPEG, {
          filename: 'box.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toEqual(201);
      expect(response.body).toEqual({ id: PHOTO_ID });
      sut.thenUploadWasRequestedWith({
        ownerId: MARC_ACCOUNT_ID,
        bytes: [...JPEG],
      });
    });

    it('refuses an unauthenticated visitor', async () => {
      sut.authState.user = null;

      const response = await http()
        .post('/listing/photo')
        .attach('photo', JPEG, 'box.jpg');

      expect(response.status).toEqual(401);
      sut.thenNothingWasUploaded();
    });

    it('answers 400 when the request carries no photo', async () => {
      const response = await http()
        .post('/listing/photo')
        .set('Authorization', 'Bearer token-of-marc')
        .field('legende', 'mon box');

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual(
        'Aucune photo reçue dans le champ « photo »',
      );
      sut.thenNothingWasUploaded();
    });

    it('answers 415 with the domain refusal for a file that is not a photo', async () => {
      sut.givenUploadIsRefusedWith(new UnsupportedPhotoFormatError());

      const response = await http()
        .post('/listing/photo')
        .set('Authorization', 'Bearer token-of-marc')
        .attach('photo', Buffer.from('<html></html>'), {
          filename: 'box.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toEqual(415);
      expect(response.body.message).toEqual(
        'Une photo doit être au format JPEG, PNG ou WebP',
      );
    });

    it('answers 413 in French, before the use-case, for a file above 10 MB', async () => {
      const tooLarge = Buffer.alloc(MAX_PHOTO_SIZE_IN_BYTES + 1);
      JPEG.copy(tooLarge);

      const response = await http()
        .post('/listing/photo')
        .set('Authorization', 'Bearer token-of-marc')
        .attach('photo', tooLarge, {
          filename: 'box.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toEqual(413);
      expect(response.body.message).toEqual(
        'Une photo ne doit pas dépasser 10 Mo',
      );
      sut.thenNothingWasUploaded();
    });
  });

  describe('GET /listing/photo/:id', () => {
    it('serves the stored bytes under the stored format, cacheable forever and never sniffed', async () => {
      sut.authState.user = null;
      sut.givenStoredPhoto({
        id: PHOTO_ID,
        format: PhotoFormat.PNG,
        bytes: PNG,
      });

      const response = await http()
        .get(`/listing/photo/${PHOTO_ID}`)
        .responseType('blob');

      expect(response.status).toEqual(200);
      expect([...(response.body as Buffer)]).toEqual([...PNG]);
      expect({
        contentType: response.headers['content-type'],
        cacheControl: response.headers['cache-control'],
        noSniff: response.headers['x-content-type-options'],
        csp: response.headers['content-security-policy'],
      }).toEqual({
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000, immutable',
        noSniff: 'nosniff',
        csp: "default-src 'none'",
      });
      expect(sut.getListingPhoto.calls).toEqual([{ photoId: PHOTO_ID }]);
    });

    it('answers 404 for an unknown photo, without caching the refusal', async () => {
      sut.givenNoPhoto();

      const response = await http().get(`/listing/photo/${PHOTO_ID}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Cette photo est introuvable');
      expect(response.headers['cache-control']).toBeUndefined();
    });

    it('answers 404 for an identifier that is not a uuid, without reading anything', async () => {
      const response = await http().get('/listing/photo/photo-1.jpg');

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('Cette photo est introuvable');
      expect(sut.getListingPhoto.calls).toEqual([]);
    });
  });
});
