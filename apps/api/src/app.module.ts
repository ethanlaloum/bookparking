import { Module } from '@nestjs/common';
import knex from 'knex';

import { buildKnexConfig } from './infra/knexfile';
import { environment } from './infra/config/environment';
import { KnexListingRepository } from './listing/adapters/repositories/listing/KnexListingRepository';
import { InMemoryPhotoStorage } from './listing/adapters/services/photo-storage/InMemoryPhotoStorage';
import { ListingController } from './listing/adapters/rest/controllers/listing/listing.controller';
import { GetListing } from './listing/domain/usecases/get-listing/GetListing';
import { ListActiveListings } from './listing/domain/usecases/list-active-listings/ListActiveListings';
import { PublishListing } from './listing/domain/usecases/publish-listing/PublishListing';
import { KnexPublishedListingReader } from './rental/adapters/repositories/published-listing/KnexPublishedListingReader';
import { KnexRentalRequestRepository } from './rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequestController } from './rental/adapters/rest/controllers/rental-request/rental-request.controller';
import { RequestRental } from './rental/domain/usecases/request-rental/RequestRental';
import { KnexAccountRepository } from './user-management/adapters/repositories/account/KnexAccountRepository';
import { AccountController } from './user-management/adapters/rest/controllers/account/account.controller';
import { SessionController } from './user-management/adapters/rest/controllers/session/session.controller';
import { SlidingAccessTokenVerifier } from './user-management/adapters/services/access-token/SlidingAccessTokenVerifier';
import { ScryptPasswordHasher } from './user-management/adapters/services/password-hasher/ScryptPasswordHasher';
import { ChangePassword } from './user-management/domain/usecases/change-password/ChangePassword';
import { RegisterAccount } from './user-management/domain/usecases/register-account/RegisterAccount';
import { SignIn } from './user-management/domain/usecases/sign-in/SignIn';

const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

type DatabaseConnection = ReturnType<typeof knex>;

const typedAs = <T>(connection: DatabaseConnection): T =>
  connection as unknown as T;

@Module({
  controllers: [
    AccountController,
    SessionController,
    ListingController,
    RentalRequestController,
  ],
  providers: [
    { provide: DATABASE_CONNECTION, useFactory: () => knex(buildKnexConfig()) },
    {
      provide: 'AccessTokenVerifier',
      useFactory: () =>
        new SlidingAccessTokenVerifier(environment.accessTokenSecret()),
    },
    {
      provide: RegisterAccount,
      useFactory: (connection: DatabaseConnection) =>
        new RegisterAccount(
          new KnexAccountRepository(typedAs(connection)),
          new ScryptPasswordHasher(),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: SignIn,
      useFactory: (connection: DatabaseConnection) =>
        new SignIn(
          new KnexAccountRepository(typedAs(connection)),
          new ScryptPasswordHasher(),
          environment.accessTokenSecret(),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ChangePassword,
      useFactory: (connection: DatabaseConnection) =>
        new ChangePassword(
          new KnexAccountRepository(typedAs(connection)),
          new ScryptPasswordHasher(),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: PublishListing,
      useFactory: (connection: DatabaseConnection) =>
        new PublishListing(
          new KnexListingRepository(typedAs(connection)),
          new InMemoryPhotoStorage(),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ListActiveListings,
      useFactory: (connection: DatabaseConnection) =>
        new ListActiveListings(new KnexListingRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: GetListing,
      useFactory: (connection: DatabaseConnection) =>
        new GetListing(new KnexListingRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: RequestRental,
      useFactory: (connection: DatabaseConnection) =>
        new RequestRental(
          new KnexPublishedListingReader(typedAs(connection)),
          new KnexRentalRequestRepository(typedAs(connection)),
        ),
      inject: [DATABASE_CONNECTION],
    },
  ],
})
export class AppModule {}
