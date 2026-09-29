import { Account } from '../../domain/entities/Account';
import { OwnAccountResponseDto } from '../rest/dtos/OwnAccountResponseDto';
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

  public static toOwnAccountDto(account: Account): OwnAccountResponseDto {
    return {
      id: account.id,
      email: account.email,
      avatar: account.avatar,
    };
  }
}
