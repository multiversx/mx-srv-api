import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { KeyUnbondPeriod } from "./entities/key.unbond.period";

@Injectable()
export class KeysService {
  private readonly logger = new OriginLogger(KeysService.name);

  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService
  ) { }

  async getKeyUnbondPeriod(key: string): Promise<KeyUnbondPeriod | undefined> {
    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    if (!stakingContractAddress) {
      return undefined;
    }

    try {
      const encoded = await this.vmQueryService.vmQuery(
        stakingContractAddress,
        'getRemainingUnBondPeriod',
        undefined,
        [key]
      );

      if (!encoded || !encoded[0]) {
        return { remainingUnBondPeriod: 0 };
      }

      let remainingUnBondPeriod = parseInt(Buffer.from(encoded[0], 'base64').toString('ascii'));

      if (isNaN(remainingUnBondPeriod)) {
        remainingUnBondPeriod = encoded[0].length
          ? parseInt(Buffer.from(encoded[0], 'base64').toString('hex'), 16)
          : 0;
      }

      return { remainingUnBondPeriod };
    } catch (error) {
      this.logger.error(`Error when getting key unbond period for key '${key}'`);
      this.logger.error(error);
      return undefined;
    }
  }
}
