import { answerRentalIssueEpic } from '../../app/rental/domain/use-cases/answer-rental-issue/answerRentalIssueEpic';
import { cancelRentalEpic } from '../../app/rental/domain/use-cases/cancel-rental/cancelRentalEpic';
import { confirmArrivalEpic } from '../../app/rental/domain/use-cases/confirm-arrival/confirmArrivalEpic';
import { abandonRentalRequestEpic } from '../../app/rental/domain/use-cases/abandon-rental-request/abandonRentalRequestEpic';
import { confirmRentalRequestEpic } from '../../app/rental/domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import { listMyRentalRequestsEpic } from '../../app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { listReceivedRentalRequestsEpic } from '../../app/rental/domain/use-cases/list-received-rental-requests/listReceivedRentalRequestsEpic';
import { reportRentalIssueEpic } from '../../app/rental/domain/use-cases/report-rental-issue/reportRentalIssueEpic';
import { requestRentalEpic } from '../../app/rental/domain/use-cases/request-rental/requestRentalEpic';

export const rentalEpics = [
  requestRentalEpic,
  confirmRentalRequestEpic,
  listMyRentalRequestsEpic,
  listReceivedRentalRequestsEpic,
  abandonRentalRequestEpic,
  cancelRentalEpic,
  confirmArrivalEpic,
  reportRentalIssueEpic,
  answerRentalIssueEpic,
];
