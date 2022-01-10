import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { AddressUtils } from "src/utils/address.utils";
import { ApiUtils } from "src/utils/api.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/token.utils";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { CachingService } from "../../common/caching/caching.service";
import { GatewayService } from "../../common/gateway/gateway.service";
import { TokenAddressRoles } from "../tokens/entities/token.address.roles";
import { TokenAssets } from "../tokens/entities/token.assets";
import { TokenDetailed } from "../tokens/entities/token.detailed";
import { TokenAssetService } from "../tokens/token.asset.service";

@Injectable()
export class EsdtService {
  private readonly logger: Logger;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly metricsService: MetricsService,
    private readonly protocolService: ProtocolService,
    private readonly elasticService: ElasticService,
    @Inject(forwardRef(() => TokenAssetService))
    private readonly tokenAssetService: TokenAssetService,
  ) {
    this.logger = new Logger(EsdtService.name);
  }

  private async getAllEsdtsForAddressRaw(address: string): Promise<{ [key: string]: any }> {
    if (AddressUtils.isSmartContractAddress(address)) {
      return this.getAllEsdtsForAddressFromElastic(address);
    }

    return this.getAllEsdtsForAddressFromGateway(address);
  }

  private async getAllEsdtsForAddressFromElastic(address: string): Promise<{ [key: string]: any }> {
    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match('address', address)])
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')])
      .withPagination({ from: 0, size: 10000 });

    const esdts = await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);

    const result: { [key: string]: any } = {};

    for (const esdt of esdts) {
      const isToken = esdt.tokenNonce === undefined;
      if (isToken) {
        result[esdt.token] = {
          balance: esdt.balance,
          tokenIdentifier: esdt.token,
        };
      } else {
        result[esdt.identifier] = {
          attributes: esdt.data?.attributes,
          balance: esdt.balance,
          creator: esdt.data?.creator,
          name: esdt.data?.name,
          nonce: esdt.tokenNonce,
          royalties: esdt.data?.royalties,
          tokenIdentifier: esdt.identifier,
          uris: esdt.data?.uris,
        };
      }
    }

    return result;
  }

  // @ts-ignore
  private async getAllEsdtsForAddressFromGateway(address: string): Promise<{ [key: string]: any }> {
    const esdtResult = await this.gatewayService.get(`address/${address}/esdt`, GatewayComponentRequest.addressEsdt, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    if (!esdtResult) {
      return {};
    }

    return esdtResult.esdts;
  }

  private pendingRequestsDictionary: { [key: string]: any; } = {};

  async getAllEsdtsForAddress(address: string): Promise<{ [key: string]: any }> {
    let pendingRequest = this.pendingRequestsDictionary[address];
    if (pendingRequest) {
      const result = await pendingRequest;
      this.metricsService.incrementPendingApiHit('Gateway.AccountEsdts');
      return result;
    }

    const cachedValue = await this.cachingService.getCacheLocal<{ [key: string]: any }>(`address:${address}:esdts`);
    if (cachedValue) {
      this.metricsService.incrementCachedApiHit('Gateway.AccountEsdts');
      return cachedValue;
    }

    pendingRequest = this.getAllEsdtsForAddressRaw(address);
    this.pendingRequestsDictionary[address] = pendingRequest;

    let esdts: { [key: string]: any };
    try {
      esdts = await pendingRequest;
    } finally {
      delete this.pendingRequestsDictionary[address];
    }

    const ttl = await this.protocolService.getSecondsRemainingUntilNextRound();

    await this.cachingService.setCacheLocal(`address:${address}:esdts`, esdts, ttl);
    return esdts;
  }

  async getAllEsdtTokens(): Promise<TokenDetailed[]> {
    return this.cachingService.getOrSetCache(
      CacheInfo.AllEsdtTokens.key,
      async () => await this.getAllEsdtTokensRaw(),
      CacheInfo.AllEsdtTokens.ttl
    );
  }

  async getAllEsdtTokensRaw(): Promise<TokenDetailed[]> {
    let tokensIdentifiers: string[];
    try {
      const getFungibleTokensResult = await this.gatewayService.get('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens);

      tokensIdentifiers = getFungibleTokensResult.tokens;
    } catch (error) {
      this.logger.error('Error when getting fungible tokens from gateway');
      this.logger.error(error);
      return [];
    }

    const tokensProperties = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => CacheInfo.EsdtProperties(token).key,
      async (identifier: string) => await this.getEsdtTokenPropertiesRaw(identifier),
      Constants.oneDay(),
      true
    );

    const tokensAssets = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => CacheInfo.EsdtAssets(token).key,
      async (identifier: string) => await this.getEsdtTokenAssetsRaw(identifier),
      Constants.oneDay(),
      true
    );

    return tokensProperties.zip(tokensAssets, (first, second) => ApiUtils.mergeObjects(new TokenDetailed, { ...first, assets: second }));
  }

  async getEsdtTokenAssetsRaw(identifier: string): Promise<TokenAssets | undefined> {
    return await this.tokenAssetService.getAssets(identifier);
  }

  async getEsdtTokenProperties(identifier: string): Promise<TokenProperties | undefined> {
    const properties = await this.cachingService.getOrSetCache(
      CacheInfo.EsdtProperties(identifier).key,
      async () => await this.getEsdtTokenPropertiesRaw(identifier),
      Constants.oneWeek(),
      CacheInfo.EsdtProperties(identifier).ttl
    );

    if (!properties) {
      return undefined;
    }

    return properties;
  }

  async getEsdtTokenPropertiesRaw(identifier: string): Promise<TokenProperties | null> {
    const arg = Buffer.from(identifier, 'utf8').toString('hex');

    const tokenPropertiesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getTokenProperties',
      undefined,
      [arg],
      true
    );

    if (!tokenPropertiesEncoded) {
      this.logger.error(`Could not fetch token properties for token with identifier '${identifier}'`);
      return null;
    }

    const tokenProperties = tokenPropertiesEncoded.map((encoded, index) =>
      Buffer.from(encoded, 'base64').toString(index === 2 ? 'hex' : undefined)
    );

    const [
      name,
      type,
      owner,
      minted,
      burnt,
      decimals,
      isPaused,
      canUpgrade,
      canMint,
      canBurn,
      canChangeOwner,
      canPause,
      canFreeze,
      canWipe,
      canAddSpecialRoles,
      canTransferNFTCreateRole,
      NFTCreateStopped,
      wiped,
    ] = tokenProperties;

    const tokenProps: TokenProperties = {
      identifier,
      name,
      // @ts-ignore
      type,
      owner: AddressUtils.bech32Encode(owner),
      minted,
      burnt,
      decimals: parseInt(decimals.split('-').pop() ?? '0'),
      isPaused: TokenUtils.canBool(isPaused),
      canUpgrade: TokenUtils.canBool(canUpgrade),
      canMint: TokenUtils.canBool(canMint),
      canBurn: TokenUtils.canBool(canBurn),
      canChangeOwner: TokenUtils.canBool(canChangeOwner),
      canPause: TokenUtils.canBool(canPause),
      canFreeze: TokenUtils.canBool(canFreeze),
      canWipe: TokenUtils.canBool(canWipe),
      canAddSpecialRoles: TokenUtils.canBool(canAddSpecialRoles),
      canTransferNFTCreateRole: TokenUtils.canBool(canTransferNFTCreateRole),
      NFTCreateStopped: TokenUtils.canBool(NFTCreateStopped),
      wiped: wiped.split('-').pop() ?? '',
    };

    if (type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canAddSpecialRoles;
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
      // @ts-ignore
      delete tokenProps.wiped;
    }

    return tokenProps;
  }

  async getEsdtAddressesRoles(identifier: string): Promise<TokenAddressRoles[] | undefined> {
    const addressesRoles = await this.cachingService.getOrSetCache(
      CacheInfo.EsdtAddressesRoles(identifier).key,
      async () => await this.getEsdtAddressesRolesRaw(identifier),
      Constants.oneWeek(),
      CacheInfo.EsdtAddressesRoles(identifier).ttl
    );

    if (!addressesRoles) {
      return undefined;
    }

    return addressesRoles;
  }

  async getEsdtAddressesRolesRaw(identifier: string): Promise<TokenAddressRoles[] | null> {
    const arg = Buffer.from(identifier, 'utf8').toString('hex');

    const tokenAddressesAndRolesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getAllAddressesAndRoles',
      undefined,
      [arg],
      true
    );

    if (!tokenAddressesAndRolesEncoded) {
      this.logger.error(`Could not fetch token addresses roles for token with identifier '${identifier}'`);
      return null;
    }

    const tokenAddressesAndRoles: TokenAddressRoles[] = [];
    let currentAddressRoles = new TokenAddressRoles();
    for (const valueEncoded of tokenAddressesAndRolesEncoded) {
      const value = Buffer.from(valueEncoded, 'base64');
      if (AddressUtils.isAddressValid(value)) {
        //store roles for current address
        if (currentAddressRoles.address) {
          tokenAddressesAndRoles.push(currentAddressRoles);
        }

        const address = AddressUtils.bech32Encode(value.toString('hex'));
        currentAddressRoles = new TokenAddressRoles();
        currentAddressRoles.address = address;
        currentAddressRoles.roles = [];
      }
      else {
        const role = value.toString();
        currentAddressRoles.roles?.push(role);
      }
    }
    if (currentAddressRoles.address) {
      tokenAddressesAndRoles.push(currentAddressRoles);
    }

    return tokenAddressesAndRoles;
  }

  async getTokenSupply(identifier: string): Promise<string> {
    const { supply } = await this.gatewayService.get(`network/esdt/supply/${identifier}`, GatewayComponentRequest.esdtSupply);

    return supply;
  }
}