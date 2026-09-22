import { cancelRentalRequestEpic } from '../../app/back-office/domain/use-cases/cancel-rental-request/cancelRentalRequestEpic';
import { confirmAdminAccessEpic } from '../../app/back-office/domain/use-cases/confirm-admin-access/confirmAdminAccessEpic';
import { liftAccountSuspensionEpic } from '../../app/back-office/domain/use-cases/lift-account-suspension/liftAccountSuspensionEpic';
import { listAccountsEpic } from '../../app/back-office/domain/use-cases/list-accounts/listAccountsEpic';
import { listListingsEpic } from '../../app/back-office/domain/use-cases/list-listings/listListingsEpic';
import { listRentalRequestsEpic } from '../../app/back-office/domain/use-cases/list-rental-requests/listRentalRequestsEpic';
import { readOverviewEpic } from '../../app/back-office/domain/use-cases/read-overview/readOverviewEpic';
import { suspendAccountEpic } from '../../app/back-office/domain/use-cases/suspend-account/suspendAccountEpic';
import { unpublishListingEpic } from '../../app/back-office/domain/use-cases/unpublish-listing/unpublishListingEpic';

export const backOfficeEpics = [
  confirmAdminAccessEpic,
  readOverviewEpic,
  listAccountsEpic,
  listListingsEpic,
  listRentalRequestsEpic,
  unpublishListingEpic,
  suspendAccountEpic,
  liftAccountSuspensionEpic,
  cancelRentalRequestEpic,
];
