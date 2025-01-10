import { SortOrder } from "src/common/entities/sort.order";
import { AccountSort } from "./account.sort";
import { BadRequestException } from "@nestjs/common";

export class AccountQueryOptions {
  constructor(init?: Partial<AccountQueryOptions>) {
    Object.assign(this, init);
  }

  addresses?: string[];
  ownerAddress?: string;

  sort?: AccountSort;
  order?: SortOrder;
  isSmartContract?: boolean;
  withOwnerAssets?: boolean;
  withDeployInfo?: boolean;
  withTxCount?: boolean;
  withScrCount?: boolean;
  name?: string;
  tags?: string[];
  excludeTags?: string[];
  hasAssets?: boolean;
  search?: string;

  validate(size: number) {
    if (this.withDeployInfo && size > 25) {
      throw new BadRequestException('Size must be less than or equal to 25 when withDeployInfo is set');
    }

    if (this.withTxCount && size > 25) {
      throw new BadRequestException('Size must be less than or equal to 25 when withTxCount is set');
    }

    if (this.withScrCount && size > 25) {
      throw new BadRequestException('Size must be less than or equal to 25 when withScrCount is set');
    }

    if (this.addresses && this.addresses.length > 25) {
      throw new BadRequestException('Addresses array must contain 25 or fewer elements');
    }
  }

  isSet(): boolean {
    return this.ownerAddress !== undefined ||
      this.sort !== undefined ||
      this.order !== undefined ||
      this.isSmartContract !== undefined ||
      this.withOwnerAssets !== undefined ||
      this.withDeployInfo !== undefined ||
      this.name !== undefined ||
      this.tags !== undefined ||
      this.excludeTags !== undefined ||
      this.hasAssets !== undefined ||
      this.search !== undefined ||
      this.addresses !== undefined;
  }
}
