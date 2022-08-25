import { Injectable } from "@nestjs/common";
import DataLoader from "dataloader";
import { Account } from "src/endpoints/accounts/entities/account";
import { AccountService } from "src/endpoints/accounts/account.service";

@Injectable()
export class NftCollectionLoader {
  constructor(private readonly accountService: AccountService) { }

  public async getAccount(address: string): Promise<Array<Account>> {
    return await this.accountDataLoader.load(address);
  }

  private readonly accountDataLoader: any = new DataLoader(async addresses => {
    // @ts-ignore
    const accounts = await this.accountService.getAccountsForAddresses(addresses);

    // @ts-ignore
    return addresses.mapIndexed<Account>(addresses, address => address);
  }, { cache: false });
}
