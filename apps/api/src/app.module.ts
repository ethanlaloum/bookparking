import { Module } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import knex from 'knex';

import { buildKnexConfig } from './infra/knexfile';
import { environment } from './infra/config/environment';
import { KnexPlatformSettingsReader } from './shared/platform-settings/adapters/repositories/KnexPlatformSettingsReader';
import { RentalTermsController } from './shared/platform-settings/adapters/rest/controllers/rental-terms/rental-terms.controller';
import { ReadRentalTerms } from './shared/platform-settings/domain/usecases/read-rental-terms/ReadRentalTerms';
import { KnexBackOfficeRepository } from './back-office/adapters/repositories/back-office/KnexBackOfficeRepository';
import { BackOfficeController } from './back-office/adapters/rest/controllers/back-office/back-office.controller';
import { CancelRentalRequest } from './back-office/domain/usecases/cancel-rental-request/CancelRentalRequest';
import { ChangePlatformSettings } from './back-office/domain/usecases/change-platform-settings/ChangePlatformSettings';
import { ListRentalIssues } from './back-office/domain/usecases/list-rental-issues/ListRentalIssues';
import { ResolveRentalIssue } from './back-office/domain/usecases/resolve-rental-issue/ResolveRentalIssue';
import { ReadAdminJournal } from './back-office/domain/usecases/read-admin-journal/ReadAdminJournal';
import { ReadPlatformSettings } from './back-office/domain/usecases/read-platform-settings/ReadPlatformSettings';
import { LiftAccountSuspension } from './back-office/domain/usecases/lift-account-suspension/LiftAccountSuspension';
import { ListAccounts } from './back-office/domain/usecases/list-accounts/ListAccounts';
import { ListAllListings } from './back-office/domain/usecases/list-listings/ListAllListings';
import { ListAllRentalRequests } from './back-office/domain/usecases/list-rental-requests/ListAllRentalRequests';
import { ReadOverview } from './back-office/domain/usecases/read-overview/ReadOverview';
import { SuspendAccount } from './back-office/domain/usecases/suspend-account/SuspendAccount';
import { UnpublishAnyListing } from './back-office/domain/usecases/unpublish-any-listing/UnpublishAnyListing';
import { KnexListingRepository } from './listing/adapters/repositories/listing/KnexListingRepository';
import { PayoutSweepScheduler } from './payout/adapters/cron/PayoutSweepScheduler';
import { KnexPayoutRepository } from './payout/adapters/repositories/payout/KnexPayoutRepository';
import { PayoutController } from './payout/adapters/rest/controllers/payout/payout.controller';
import { StripePayoutProvider } from './payout/adapters/services/stripe-connect/StripePayoutProvider';
import { OpenPayoutDashboard } from './payout/domain/usecases/open-payout-dashboard/OpenPayoutDashboard';
import { ReadPayouts } from './payout/domain/usecases/read-payouts/ReadPayouts';
import { SendDuePayouts } from './payout/domain/usecases/send-due-payouts/SendDuePayouts';
import { StartPayoutOnboarding } from './payout/domain/usecases/start-payout-onboarding/StartPayoutOnboarding';
import { EmailSweepScheduler } from './notification/adapters/cron/EmailSweepScheduler';
import { PushSweepScheduler } from './notification/adapters/cron/PushSweepScheduler';
import { KnexPushDeviceRepository } from './notification/adapters/repositories/push-device/KnexPushDeviceRepository';
import { KnexPushQueue } from './notification/adapters/repositories/push-queue/KnexPushQueue';
import { ExpoPushSender } from './notification/adapters/services/expo-push/ExpoPushSender';
import { ForgetPushDevice } from './notification/domain/usecases/forget-push-device/ForgetPushDevice';
import { RegisterPushDevice } from './notification/domain/usecases/register-push-device/RegisterPushDevice';
import { SendPendingPushes } from './notification/domain/usecases/send-pending-pushes/SendPendingPushes';
import { KnexNotificationInbox } from './notification/adapters/repositories/notification-inbox/KnexNotificationInbox';
import { NotificationController } from './notification/adapters/rest/controllers/notification/notification.controller';
import { ListNotifications } from './notification/domain/usecases/list-notifications/ListNotifications';
import { MarkNotificationRead } from './notification/domain/usecases/mark-notification-read/MarkNotificationRead';
import { MarkNotificationsRead } from './notification/domain/usecases/mark-notifications-read/MarkNotificationsRead';
import { ResendEmailSender } from './notification/adapters/services/resend/ResendEmailSender';
import { SendQueuedEmails } from './notification/domain/usecases/send-queued-emails/SendQueuedEmails';
import { KnexPhotoStorage } from './listing/adapters/repositories/listing-photo/KnexPhotoStorage';
import { ListingPhotoController } from './listing/adapters/rest/controllers/listing-photo/listing-photo.controller';
import { ListingController } from './listing/adapters/rest/controllers/listing/listing.controller';
import { GetListing } from './listing/domain/usecases/get-listing/GetListing';
import { ListActiveListings } from './listing/domain/usecases/list-active-listings/ListActiveListings';
import { ListOwnerListings } from './listing/domain/usecases/list-owner-listings/ListOwnerListings';
import { ListFreeListings } from './listing/domain/usecases/list-free-listings/ListFreeListings';
import { KnexPlaceOccupancy } from './listing/adapters/repositories/place-occupancy/KnexPlaceOccupancy';
import { PublishListing } from './listing/domain/usecases/publish-listing/PublishListing';
import { UnpublishListing } from './listing/domain/usecases/unpublish-listing/UnpublishListing';
import { EditListing } from './listing/domain/usecases/edit-listing/EditListing';
import { GetListingPhoto } from './listing/domain/usecases/get-listing-photo/GetListingPhoto';
import { UploadListingPhoto } from './listing/domain/usecases/upload-listing-photo/UploadListingPhoto';
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
import { ConfirmArrival } from './rental/domain/usecases/confirm-arrival/ConfirmArrival';
import { AnswerRentalIssue } from './rental/domain/usecases/answer-rental-issue/AnswerRentalIssue';
import { ReportRentalIssue } from './rental/domain/usecases/report-rental-issue/ReportRentalIssue';
import { KnexRentalIssueRepository } from './rental/adapters/repositories/rental-issue/KnexRentalIssueRepository';
import { ConfirmRentalRequest } from './rental/domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { ListOwnerRentalRequests } from './rental/domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests';
import { ListRenterRentalRequests } from './rental/domain/usecases/list-renter-rental-requests/ListRenterRentalRequests';
import { RecordPaymentEvent } from './rental/domain/usecases/record-payment-event/RecordPaymentEvent';
import { RequestRental } from './rental/domain/usecases/request-rental/RequestRental';
import { SweepRentalRequests } from './rental/domain/usecases/sweep-rental-requests/SweepRentalRequests';
import { KnexEmailOutbox } from './shared/email-outbox/adapters/repositories/KnexEmailOutbox';
import { KnexNotificationOutbox } from './shared/notification-outbox/adapters/repositories/KnexNotificationOutbox';
import { KnexUnitOfWork } from './shared/unit-of-work/KnexUnitOfWork';
import { KnexAccountRepository } from './user-management/adapters/repositories/account/KnexAccountRepository';
import { KnexAccountFootprint } from './user-management/adapters/repositories/account-footprint/KnexAccountFootprint';
import { AccountController } from './user-management/adapters/rest/controllers/account/account.controller';
import { PasswordResetController } from './user-management/adapters/rest/controllers/password-reset/password-reset.controller';
import { KnexPasswordResetRepository } from './user-management/adapters/repositories/password-reset/KnexPasswordResetRepository';
import { RequestPasswordReset } from './user-management/domain/usecases/request-password-reset/RequestPasswordReset';
import { ResetPassword } from './user-management/domain/usecases/reset-password/ResetPassword';
import { SessionController } from './user-management/adapters/rest/controllers/session/session.controller';
import { SlidingAccessTokenVerifier } from './user-management/adapters/services/access-token/SlidingAccessTokenVerifier';
import { HashcashHumanProof } from './user-management/adapters/services/human-proof/HashcashHumanProof';
import { TimerDelay } from './user-management/adapters/services/delay/TimerDelay';
import { ScryptPasswordHasher } from './user-management/adapters/services/password-hasher/ScryptPasswordHasher';
import { InMemorySignInFailureLog } from './user-management/adapters/services/sign-in-failure-log/InMemorySignInFailureLog';
import { ChangePassword } from './user-management/domain/usecases/change-password/ChangePassword';
import { DeleteAccount } from './user-management/domain/usecases/delete-account/DeleteAccount';
import { IssueHumanChallenge } from './user-management/domain/usecases/issue-human-challenge/IssueHumanChallenge';
import { ChooseAvatar } from './user-management/domain/usecases/choose-avatar/ChooseAvatar';
import { ReadOwnAccount } from './user-management/domain/usecases/read-own-account/ReadOwnAccount';
import { RegisterAccount } from './user-management/domain/usecases/register-account/RegisterAccount';
import { SignIn } from './user-management/domain/usecases/sign-in/SignIn';

const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
const PAYOUT_PROVIDER = 'PayoutProvider';
const STRIPE_CLIENT = 'STRIPE_CLIENT';
const PAYMENT_GATEWAY = 'PaymentGateway';
const HUMAN_PROOF = 'HumanProof';

type DatabaseConnection = ReturnType<typeof knex>;

const typedAs = <T>(connection: DatabaseConnection): T =>
  connection as unknown as T;

// Chaque moment clé d'une demande prévient dans sa propre transaction : la
// notification et son e-mail partent avec l'écriture qui les motive, ou pas.
const notificationOutboxOn = (connection: DatabaseConnection) =>
  new KnexNotificationOutbox(
    connection,
    new KnexEmailOutbox(typedAs(connection)),
  );

@Module({
  controllers: [
    AccountController,
    PasswordResetController,
    SessionController,
    ListingPhotoController,
    ListingController,
    RentalRequestController,
    PaymentWebhookController,
    BackOfficeController,
    NotificationController,
    PayoutController,
    RentalTermsController,
  ],
  providers: [
    { provide: DATABASE_CONNECTION, useFactory: () => knex(buildKnexConfig()) },
    {
      provide: 'AccessTokenVerifier',
      useFactory: (connection: DatabaseConnection) =>
        new SlidingAccessTokenVerifier(
          environment.accessTokenSecret(),
          new KnexAccountRepository(typedAs(connection)),
        ),
      inject: [DATABASE_CONNECTION],
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
      provide: RequestPasswordReset,
      useFactory: (connection: DatabaseConnection) =>
        new RequestPasswordReset(
          new KnexAccountRepository(typedAs(connection)),
          new KnexPasswordResetRepository(typedAs(connection)),
          new KnexEmailOutbox(typedAs(connection)),
          new KnexUnitOfWork(connection),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ResetPassword,
      useFactory: (connection: DatabaseConnection) =>
        new ResetPassword(
          new KnexAccountRepository(typedAs(connection)),
          new KnexPasswordResetRepository(typedAs(connection)),
          new KnexUnitOfWork(connection),
          new ScryptPasswordHasher(),
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
      provide: DeleteAccount,
      useFactory: (connection: DatabaseConnection) =>
        new DeleteAccount(
          new KnexAccountRepository(typedAs(connection)),
          new KnexAccountFootprint(connection),
          new ScryptPasswordHasher(),
          new KnexUnitOfWork(connection),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: PublishListing,
      useFactory: (connection: DatabaseConnection) =>
        new PublishListing(
          new KnexListingRepository(typedAs(connection)),
          new KnexPhotoStorage(typedAs(connection)),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: UploadListingPhoto,
      useFactory: (connection: DatabaseConnection) =>
        new UploadListingPhoto(new KnexPhotoStorage(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: GetListingPhoto,
      useFactory: (connection: DatabaseConnection) =>
        new GetListingPhoto(new KnexPhotoStorage(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ListActiveListings,
      useFactory: (connection: DatabaseConnection) =>
        new ListActiveListings(new KnexListingRepository(typedAs(connection))),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ListFreeListings,
      useFactory: (connection: DatabaseConnection) =>
        new ListFreeListings(
          new KnexListingRepository(typedAs(connection)),
          new KnexPlaceOccupancy(typedAs(connection)),
        ),
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
      provide: EditListing,
      useFactory: (connection: DatabaseConnection) =>
        new EditListing(
          new KnexListingRepository(typedAs(connection)),
          new KnexPhotoStorage(typedAs(connection)),
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
      provide: PAYOUT_PROVIDER,
      useFactory: (stripe: StripeClient) =>
        new StripePayoutProvider(stripe, environment.frontBaseUrl()),
      inject: [STRIPE_CLIENT],
    },
    {
      provide: ReadPayouts,
      useFactory: (
        connection: DatabaseConnection,
        provider: StripePayoutProvider,
      ) =>
        new ReadPayouts(
          new KnexPayoutRepository(connection),
          provider,
          new KnexPlatformSettingsReader(connection),
        ),
      inject: [DATABASE_CONNECTION, PAYOUT_PROVIDER],
    },
    {
      provide: StartPayoutOnboarding,
      useFactory: (
        connection: DatabaseConnection,
        provider: StripePayoutProvider,
      ) =>
        new StartPayoutOnboarding(
          new KnexPayoutRepository(connection),
          provider,
        ),
      inject: [DATABASE_CONNECTION, PAYOUT_PROVIDER],
    },
    {
      provide: OpenPayoutDashboard,
      useFactory: (
        connection: DatabaseConnection,
        provider: StripePayoutProvider,
      ) =>
        new OpenPayoutDashboard(new KnexPayoutRepository(connection), provider),
      inject: [DATABASE_CONNECTION, PAYOUT_PROVIDER],
    },
    {
      // D-22 : l'argent libéré part vers le loueur au plus un balayage plus tard.
      provide: PayoutSweepScheduler,
      useFactory: (
        connection: DatabaseConnection,
        provider: StripePayoutProvider,
      ) =>
        new PayoutSweepScheduler(
          new SendDuePayouts(
            new KnexPayoutRepository(connection),
            provider,
            notificationOutboxOn(connection),
            new KnexUnitOfWork(connection),
            new KnexPlatformSettingsReader(connection),
          ),
          environment.payoutSweepIntervalInSeconds() * 1000,
        ),
      inject: [DATABASE_CONNECTION, PAYOUT_PROVIDER],
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
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
          new KnexPlatformSettingsReader(connection),
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
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
          new KnexPlatformSettingsReader(connection),
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
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
        ),
      inject: [DATABASE_CONNECTION, PAYMENT_GATEWAY],
    },
    {
      provide: ConfirmArrival,
      useFactory: (connection: DatabaseConnection) =>
        new ConfirmArrival(
          new KnexRentalRequestRepository(typedAs(connection)),
          new KnexRentalIssueRepository(connection),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ReportRentalIssue,
      useFactory: (connection: DatabaseConnection) =>
        new ReportRentalIssue(
          new KnexRentalIssueRepository(connection),
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: AnswerRentalIssue,
      useFactory: (connection: DatabaseConnection) =>
        new AnswerRentalIssue(
          new KnexRentalIssueRepository(connection),
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
        ),
      inject: [DATABASE_CONNECTION],
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
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
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
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
          new KnexRentalIssueRepository(connection),
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
      useFactory: (
        backOfficeRepository: KnexBackOfficeRepository,
        connection: DatabaseConnection,
      ) =>
        new CancelRentalRequest(
          backOfficeRepository,
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
        ),
      inject: ['BackOfficeRepository', DATABASE_CONNECTION],
    },
    {
      provide: ReadPlatformSettings,
      useFactory: (
        backOfficeRepository: KnexBackOfficeRepository,
        connection: DatabaseConnection,
      ) =>
        new ReadPlatformSettings(
          backOfficeRepository,
          new KnexPlatformSettingsReader(connection),
        ),
      inject: ['BackOfficeRepository', DATABASE_CONNECTION],
    },
    {
      provide: ChangePlatformSettings,
      useFactory: (
        backOfficeRepository: KnexBackOfficeRepository,
        connection: DatabaseConnection,
      ) =>
        new ChangePlatformSettings(
          backOfficeRepository,
          new KnexPlatformSettingsReader(connection),
          new KnexUnitOfWork(connection),
        ),
      inject: ['BackOfficeRepository', DATABASE_CONNECTION],
    },
    {
      provide: ReadAdminJournal,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new ReadAdminJournal(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: ListRentalIssues,
      useFactory: (backOfficeRepository: KnexBackOfficeRepository) =>
        new ListRentalIssues(backOfficeRepository),
      inject: ['BackOfficeRepository'],
    },
    {
      provide: ResolveRentalIssue,
      useFactory: (
        backOfficeRepository: KnexBackOfficeRepository,
        connection: DatabaseConnection,
      ) =>
        new ResolveRentalIssue(
          backOfficeRepository,
          notificationOutboxOn(connection),
          new KnexUnitOfWork(connection),
        ),
      inject: ['BackOfficeRepository', DATABASE_CONNECTION],
    },
    {
      provide: ReadRentalTerms,
      useFactory: (connection: DatabaseConnection) =>
        new ReadRentalTerms(new KnexPlatformSettingsReader(connection)),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ListNotifications,
      useFactory: (connection: DatabaseConnection) =>
        new ListNotifications(new KnexNotificationInbox(connection)),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: RegisterPushDevice,
      useFactory: (connection: DatabaseConnection) =>
        new RegisterPushDevice(new KnexPushDeviceRepository(connection)),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: ForgetPushDevice,
      useFactory: (connection: DatabaseConnection) =>
        new ForgetPushDevice(new KnexPushDeviceRepository(connection)),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: PushSweepScheduler,
      useFactory: (connection: DatabaseConnection) =>
        new PushSweepScheduler(
          new SendPendingPushes(
            new KnexPushQueue(connection),
            new KnexPushDeviceRepository(connection),
            new ExpoPushSender(environment.expoAccessToken()),
          ),
          environment.pushSweepIntervalInSeconds() * 1000,
        ),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: MarkNotificationRead,
      useFactory: (connection: DatabaseConnection) =>
        new MarkNotificationRead(new KnexNotificationInbox(connection)),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: MarkNotificationsRead,
      useFactory: (connection: DatabaseConnection) =>
        new MarkNotificationsRead(new KnexNotificationInbox(connection)),
      inject: [DATABASE_CONNECTION],
    },
  ],
})
export class AppModule {}
