import type { RentalTerms } from '../../app/rental-terms/domain/entities/RentalTerms';
import type { AppState } from '../../store/AppState';

export const selectRentalTerms = (state: AppState): RentalTerms | null => state.core.rentalTerms.terms;

export const selectRentalTermsError = (state: AppState): string | null =>
  state.core.rentalTerms.read.state === 'failed' ? (state.core.rentalTerms.read.errorCode ?? null) : null;
