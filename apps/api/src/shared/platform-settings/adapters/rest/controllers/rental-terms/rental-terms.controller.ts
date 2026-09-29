import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Either } from 'effect/index';

import { ReadRentalTerms } from '../../../../domain/usecases/read-rental-terms/ReadRentalTerms';

export interface RentalTermsResponseDto {
  platformFeePercent: number;
  freeCancellationHours: number;
  requestExpiryHours: number;
  payoutReleaseDelayHours: number;
}

// Sans garde : ce sont les conditions publiques de la location, celles que la
// FAQ et les conditions d'utilisation énoncent à n'importe quel visiteur.
@Controller('rental-terms')
export class RentalTermsController {
  constructor(private readonly readRentalTermsUseCase: ReadRentalTerms) {}

  @Get()
  public async read(): Promise<RentalTermsResponseDto> {
    const result = await this.readRentalTermsUseCase.execute();
    if (Either.isLeft(result))
      throw new HttpException(
        'Les conditions de location sont momentanément illisibles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return result.right;
  }
}
