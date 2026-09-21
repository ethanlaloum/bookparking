import { Account } from '../../domain/entities/Account';
import { RegisterAccountResponseDto } from '../rest/dtos/RegisterAccountResponseDto';

export class AccountMapper {
  public static toRegisterAccountDto(
    account: Account,
  ): RegisterAccountResponseDto {
    return {
      id: account.id,
      email: account.email,
    };
  }
}
