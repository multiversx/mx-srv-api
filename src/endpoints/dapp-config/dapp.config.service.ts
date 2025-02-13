import { FileUtils } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DappConfig } from "./entities/dapp-config";

@Injectable()
export class DappConfigService {
  private readonly dappConfig: DappConfig | undefined;

  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.dappConfig = this.getDappConfigurationRaw();
  }

  getDappConfiguration(): DappConfig | undefined {
    return this.dappConfig;
  }

  getDappConfigurationRaw(): DappConfig | undefined {
    const network = this.apiConfigService.getDappNetwork();
    const configuration = FileUtils.parseJSONFile(`./config/dapp.config.${network}.json`);

    return configuration;
  }
}
