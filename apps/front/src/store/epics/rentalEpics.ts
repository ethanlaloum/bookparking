import { cancelRentalEpic } from '../../app/rental/domain/use-cases/cancel-rental/cancelRentalEpic';
import { abandonRentalRequestEpic } from '../../app/rental/domain/use-cases/abandon-rental-request/abandonRentalRequestEpic';
import { confirmRentalRequestEpic } from '../../app/rental/domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import { listMyRentalRequestsEpic } from '../../app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { listReceivedRentalRequestsEpic } from '../../app/rental/domain/use-cases/list-received-rental-requests/listReceivedRentalRequestsEpic';
import { requestRentalEpic } from '../../app/rental/domain/use-cases/request-rental/requestRentalEpic';

export const rentalEpics = [
  requestRentalEpic,
  confirmRentalRequestEpic,
  listMyRentalRequestsEpic,
  listReceivedRentalRequestsEpic,
  abandonRentalRequestEpic,
  cancelRentalEpic,
];
