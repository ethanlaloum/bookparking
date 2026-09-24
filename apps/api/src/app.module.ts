import { Module } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import knex from 'knex';

import { buildKnexConfig } from './infra/knexfile';
import { environment } from './infra/config/environment';
import { KnexBackOfficeRepository } from './back-office/adapters/repositories/back-office/KnexBackOfficeRepository';
import { BackOfficeController } from './back-office/adapters/rest/controllers/back-office/back-office.controller';
import { CancelRentalRequest } from './back-office/domain/usecases/cancel-rental-request/CancelRentalRequest';
import { LiftAccountSuspension } from './back-office/domain/usecases/lift-account-suspension/LiftAccountSuspension';
import { ListAccounts } from './back-office/domain/usecases/list-accounts/ListAccounts';
import { ListAllListings } from './back-office/domain/usecases/list-listings/ListAllListings';
import { ListAllRentalRequests } from './back-office/domain/usecases/list-rental-requests/ListAllRentalRequests';
import { ReadOverview } from './back-office/domain/usecases/read-overview/ReadOverview';
import { SuspendAccount } from './back-office/domain/usecases/suspend-account/SuspendAccount';
import { UnpublishAnyListing } from './back-office/domain/usecases/unpublish-any-listing/UnpublishAnyListing';
import { KnexListingRepository } from './listing/adapters/repositories/listing/KnexListingRepository';
import { EmailSweepScheduler } from './notification/adapters/cron/EmailSweepScheduler';
import { ResendEmailSender } from './notification/adapters/services/resend/ResendEmailSender';
import { SendQueuedEmails } from './notification/domain/usecases/send-queued-emails/SendQueuedEmails';
import { InMemoryPhotoStorage } from './listing/adapters/services/photo-storage/InMemoryPhotoStorage';
import { ListingController } from './listing/adapters/rest/controllers/listing/listing.controller';
import { GetListing } from './listing/domain/usecases/get-listing/GetListing';
import { ListActiveListings } from './listing/domain/usecases/list-active-listings/ListActiveListings';
import { ListOwnerListings } from './listing/domain/usecases/list-owner-listings/ListOwnerListings';
import { PublishListing } from './listing/domain/usecases/publish-listing/PublishListing';
import { UnpublishListing } from './listing/domain/usecases/unpublish-listing/UnpublishListing';
import { UpdateListingPricing } from './listing/domain/usecases/update-listing-pricing/UpdateListingPricing';
import { KnexPublishedListingReader } from './rental/adapters/repositories/published-listing/KnexPublishedListingReader';
import { KnexRentalRequestRepository } from './rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalSweepScheduler } from './rental/adapters/cron/RentalSweepScheduler';
import { PaymentWebhookController } from './rental/adapters/rest/controllers/payment-webhook/payment-webhook.controller';
import { RentalRequestController } from './rental/adapters/rest/controllers/rental-request/rental-request.controller';
import { StripePaymentGateway } from './rental/adapters/services/payment-gateway/StripePaymentGateway';
import {
  createStripeClient,
  StripeClient,
} from './rental/adapters/services/stripe/stripeSdk';
import { StripeWebhookReader } from './rental/adapters/services/stripe-webhook/StripeWebhookReader';
import { AbandonRentalRequest } from './rental/domain/usecases/abandon-rental-request/AbandonRentalRequest';
import { CancelRental } from './rental/domain/usecases/cancel-rental/CancelRental';
import { ConfirmRentalRequest } from './rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { ListOwnerRentalRequests } from './rental/domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests';
import { ListRenterRentalRequests } from './rental/domain/usecases/list-renter-rental-requests/ListRenterRentalRequests';
import { RecordPaymentEvent } from './rental/domain/usecases/record-payment-event/RecordPaymentEvent';
import { RequestRental } from './rental/domain/usecases/request-rental/RequestRental';
import { SweepRentalRequests } from './rental/domain/usecases/sweep-rental-requests/SweepRentalRequests';
import { KnexEmailOutbox } from './shared/email-outbox/adapters/repositories/KnexEmailOutbox';
import { KnexUnitOfWork } from './shared/unit-of-work/KnexUnitOfWork';
import { KnexAccountRepository } from './user-management/adapters/repositories/account/KnexAccountRepository';
import { AccountController } from './user-management/adapters/rest/controllers/account/account.controller';
import { SessionController } from './user-management/adapters/rest/controllers/session/session.controller';
import { SlidingAccessTokenVerifier } from './user-management/adapters/services/access-token/SlidingAccessTokenVerifier';
import { HashcashHumanProof } from './user-management/adapters/services/human-proof/HashcashHumanProof';
import { TimerDelay } from './user-management/adapters/services/delay/TimerDelay';
import { ScryptPasswordHasher } from './user-management/adapters/services/password-hasher/ScryptPasswordHasher';
import { InMemorySignInFailureLog } from './user-management/adapters/services/sign-in-failure-log/InMemorySignInFailureLog';
import { ChangePassword } from './user-management/domain/usecases/change-password/ChangePassword';
import { IssueHumanChallenge } from './user-management/domain/usecases/issue-human-challenge/IssueHumanChallenge';
import { ChooseAvatar } from './user-management/domain/usecases/choose-avatar/ChooseAvatar';
import { ReadOwnAccount } from './user-management/domain/usecases/read-own-account/ReadOwnAccount';
import { RegisterAccount } from './user-management/domain/usecases/register-account/RegisterAccount';
import { SignIn } from './user-management/domain/usecases/sign-in/SignIn';

const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
const STRIPE_CLIENT = 'STRIPE_CLIENT';
const PAYMENT_GATEWAY = 'PaymentGateway';
const HUMAN_PROOF = 'HumanProof';

type DatabaseConnection = ReturnType<typeof knex>;

const typedAs = <T>(connection: DatabaseConnection): T =>
  connection as unknown as T;

@Module({
  controllers: [
    AccountController,
    SessionController,
    ListingController,
    RentalRequestController,
    PaymentWebhookController,
    BackOfficeController,
  ],
  providers: [
    { provide: DATABASE_CONNECTION, useFactory: () => knex(buildKnexConfig()) },
    {
      provide: 'AccessTokenVerifier',
      useFactory: () =>
        new SlidingAccessTokenVerifier(environment.accessTokenSecret()),
    },
    {
      // SPEC-007 : une seule instance, parce qu'elle garde en mémoire les
      // preuves déjà servies. Sa clé dérive du secret des jetons.
      provide: HUMAN_PROOF,
      useFactory: () =>
        new HashcashHumanProof(
          createHmac('sha256', environment.accessTokenSecret())
            .update('human-proof')
            .digest('hex'),
        ),
    },
    {
      provide: IssueHumanChallenge,
      useFactory: (humanProof: HashcashHumanProof) =>
        new IssueHumanChallenge(humanProof),
      inject: [HUMAN_PROOF],
    },
    {
      provide: RegisterAccount,
      useFactory: (
        connection: DatabaseConnection,
        humanProof: HashcashHumanProof,
      ) =>
        new RegisterAccount(
          new KnexAccountRepository(typedAs(connection)),
          new KnexEmailOutbox(typedAs(connection)),
          new KnexUnitOfWork(connection),
          humanProof,
          new ScryptPasswordHasher(),
        ),
      inject: [DATABASE_CONNECTION, HUMAN_PROOF],
    },
    {
      // SPEC-006 : le balayage de la file d'e-mails. Désactivé, il ne construit
      // ni l'adaptateur Resend ni le cas d'usage — il n'y a pas de clé.
      provide: EmailSweepScheduler,
      useFactory: (connection: DatabaseConnection) =>
        new EmailSweepScheduler(
          environment.emailSending(),
          (resend) =>
            new SendQueuedEmails(
              new KnexEmailOutbox(typedAs(connection)),
              new ResendEmailSender(resend.apiKey, resend.from),
              environment.frontBaseUrl(),
            ),
          environment.emailSweepIntervalInSeconds() * 1000,
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      // Le journal d'échecs vit en mémoire, dans ce seul fournisseur singleton :
      // le ralentissement ne couvre donc qu'un processus, pas une flotte.
      provide: SignIn,
      useFactory: (connection: DatabaseConnection) =>
        new SignIn(
          new KnexAccountRepository(typedAs(connection)),
          new ScryptPasswordHasher(),
          environment.accessTokenSecret(),
          new InMemorySignInFailureLog(),
          new TimerDelay(),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ChooseAvatar,
      useFactory: (connection: DatabaseConnection) =>
        new ChooseAvatar(new KnexAccountRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ReadOwnAccount,
      useFactory: (connection: DatabaseConnection) =>
        new ReadOwnAccount(new KnexAccountRepository(typedAs(connection))),
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
      provide: ListOwnerListings,
      useFactory: (connection: DatabaseConnection) =>
        new ListOwnerListings(new KnexListingRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: GetListing,
      useFactory: (connection: DatabaseConnection) =>
        new GetListing(new KnexListingRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: UnpublishListing,
      useFactory: (connection: DatabaseConnection) =>
        new UnpublishListing(new KnexListingRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: UpdateListingPricing,
      useFactory: (connection: DatabaseConnection) =>
        new UpdateListingPricing(
          new KnexListingRepository(typedAs(connection)),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: STRIPE_CLIENT,
      useFactory: () => createStripeClient(environment.stripeSecretKey()),
    },
    {
      provide: PAYMENT_GATEWAY,
      useFactory: (stripe: StripeClient) =>
        new StripePaymentGateway(stripe, environment.frontBaseUrl()),
      inject: [STRIPE_CLIENT],
    },
    {
      provide: StripeWebhookReader,
      useFactory: (stripe: StripeClient) =>
        new StripeWebhookReader(stripe, environment.stripeWebhookSecret()),
      inject: [STRIPE_CLIENT],
    },
    {
      provide: RequestRental,
      useFactory: (
        connection: DatabaseConnection,
        paymentGateway: StripePaymentGateway,
      ) =>
        new RequestRental(
          new KnexPublishedListingReader(typedAs(connection)),
          new KnexRentalRequestRepository(typedAs(connection)),
          paymentGateway,
          environment.rentalRequestExpiryInHours(),
          environment.freeCancellationHoursBeforeStart(),
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: CancelRental,
      useFactory: (
        connection: DatabaseConnection,
        paymentGateway: StripePaymentGateway,
      ) =>
        new CancelRental(
          new KnexRentalRequestRepository(typedAs(connection)),
          paymentGateway,
          environment.freeCancellationHoursBeforeStart(),
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: ConfirmRentalRequest,
      useFactory: (
        connection: DatabaseConnection,
        paymentGateway: StripePaymentGateway,
      ) =>
        new ConfirmRentalRequest(
          new KnexRentalRequestRepository(typedAs(connection)),
          paymentGateway,
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: AbandonRentalRequest,
      useFactory: (
        connection: DatabaseConnection,
        paymentGateway: StripePaymentGateway,
      ) =>
        new AbandonRentalRequest(
          new KnexRentalRequestRepository(typedAs(connection)),
          paymentGateway,
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: RecordPaymentEvent,
      useFactory: (
        connection: DatabaseConnection,
        paymentGateway: StripePaymentGateway,
      ) =>
        new RecordPaymentEvent(
          new KnexRentalRequestRepository(typedAs(connection)),
          paymentGateway,
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: SweepRentalRequests,
      useFactory: (
        connection: DatabaseConnection,
        paymentGateway: StripePaymentGateway,
      ) =>
        new SweepRentalRequests(
          new KnexRentalRequestRepository(typedAs(connection)),
          paymentGateway,
          environment.rentalRequestExpiryInHours(),
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: RentalSweepScheduler,
      useFactory: (sweepRentalRequests: SweepRentalRequests) =>
        new RentalSweepScheduler(
          sweepRentalRequests,
          environment.rentalSweepIntervalInSeconds() * 1000,
        ),
      inject: [SweepRentalRequests],
    },
    {
      provide: ListRenterRentalRequests,
      useFactory: (connection: DatabaseConnection) =>
        new ListRenterRentalRequests(
          new KnexRentalRequestRepository(typedAs(connection)),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ListOwnerRentalRequests,
      useFactory: (connection: DatabaseConnection) =>
        new ListOwnerRentalRequests(
          new KnexRentalRequestRepository(typedAs(connection)),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      // Un seul jeton pour le dépôt du back-office : le garde et les huit cas
      // d'usage lisent la même instance, donc la même vérité sur qui est
      // administrateur.
      provide: 'BackOfficeRepository',
      useFactory: (connection: DatabaseConnection) =>
        new KnexBackOfficeRepository(connection),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ReadOverview,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new ReadOverview(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: ListAccounts,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new ListAccounts(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: ListAllListings,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new ListAllListings(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: ListAllRentalRequests,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new ListAllRentalRequests(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: UnpublishAnyListing,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new UnpublishAnyListing(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: SuspendAccount,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new SuspendAccount(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: LiftAccountSuspension,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new LiftAccountSuspension(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: CancelRentalRequest,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new CancelRentalRequest(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
  ],
})
export class AppModule {}
