import * as request from 'supertest';

import { InMemoryPlatformSettingsReader } from '../../../repositories/InMemoryPlatformSettingsReader';
import { createControllerTestApp } from '../../../../../test/http/createControllerTestApp';
import { ReadRentalTerms } from '../../../../domain/usecases/read-rental-terms/ReadRentalTerms';
import { RentalTermsController } from './rental-terms.controller';

describe('RentalTermsController', () => {
  it('gives any visitor, signed in or not, the terms a request made now would freeze', async () => {
    const reader = new InMemoryPlatformSettingsReader().given({
      platformFeePercent: 12.5,
      requestExpiryHours: 24,
    });
    const testApp = await createControllerTestApp({
      controllers: [RentalTermsController],
      providers: [
        { provide: ReadRentalTerms, useValue: new ReadRentalTerms(reader) },
      ],
    });

    const response = await request(testApp.app.getHttpServer()).get(
      '/rental-terms',
    );
    await testApp.close();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      platformFeePercent: 12.5,
      freeCancellationHours: 24,
      requestExpiryHours: 24,
      payoutReleaseDelayHours: 24,
    });
  });
});
