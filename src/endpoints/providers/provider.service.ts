import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { ProviderConfig } from "./entities/provider.config";
import { NodeService } from "../nodes/node.service";
import { NodesInfos } from "./entities/nodes.infos";
import { DelegationData } from "./entities/delegation.data";
import { CacheInfo } from "src/utils/cache.info";
import { ProviderFilter } from "./entities/provider.filter";
import { Provider } from "./entities/provider";
import { AddressUtils, BinaryUtils, Constants } from "@multiversx/sdk-nestjs-common";
import { ApiService, ApiUtils } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { IdentitiesService } from "../identities/identities.service";
import { ProviderQueryOptions } from "./entities/provider.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { ProviderAccounts } from "./entities/provider.accounts";

@Injectable()
export class ProviderService {
  private readonly logger = new OriginLogger(ProviderService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => IdentitiesService))
    private readonly identitiesService: IdentitiesService,
    private readonly elasticIndexerService: ElasticIndexerService
  ) { }

  async getProvider(address: string): Promise<Provider | undefined> {
    const query = new ProviderFilter();
    const providers = await this.getProviders(query);
    const provider: Provider | undefined = providers.find(x => x.provider === address);

    if (provider) {
      const delegationData: DelegationData | undefined = await this.getDelegationProviderByAddress(provider.provider);
      if (!delegationData) {
        return undefined;
      }

      const modifiedProvider = { ...provider };
      modifiedProvider.automaticActivation = delegationData.automaticActivation;
      modifiedProvider.initialOwnerFunds = delegationData.initialOwnerFunds;
      modifiedProvider.checkCapOnRedelegate = delegationData.checkCapOnRedelegate;
      modifiedProvider.totalUnStaked = delegationData.totalUnStaked;
      modifiedProvider.createdNonce = delegationData.createdNonce;
      modifiedProvider.ownerBelowRequiredBalanceThreshold = delegationData.ownerBelowRequiredBalanceThreshold;

      return modifiedProvider;
    }
    return provider;
  }

  async getProviderAvatar(address: string): Promise<string | undefined> {
    const providerIdentity = await this.getProviderIdentity(address);
    return providerIdentity ? this.identitiesService.getIdentityAvatar(providerIdentity) : undefined;
  }

  private getNodesInfosForProvider(providerNodes: any[]): NodesInfos {
    const results = providerNodes.reduce(
      (accumulator, current) => {
        if (current && current.stake && current.topUp && current.locked) {
          accumulator.numNodes += 1;
          accumulator.stake += BigInt(current.stake);
          accumulator.topUp += BigInt(current.topUp);
          accumulator.locked += BigInt(current.locked);
        }

        return accumulator;
      },
      {
        numNodes: 0,
        stake: BigInt('0'),
        topUp: BigInt('0'),
        locked: BigInt('0'),
      }
    );

    const nodesInfos: NodesInfos = new NodesInfos();
    nodesInfos.numNodes = results.numNodes;
    nodesInfos.stake = results.stake.toString();
    nodesInfos.topUp = results.topUp.toString();
    nodesInfos.locked = results.locked.toString();

    return nodesInfos;
  }

  async getProvidersWithStakeInformation(): Promise<Provider[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.ProvidersWithStakeInformation.key,
      async () => await this.getProvidersWithStakeInformationRaw(),
      CacheInfo.ProvidersWithStakeInformation.ttl
    );
  }

  async getProvidersWithStakeInformationRaw(): Promise<Provider[]> {
    const providers = await this.getAllProviders();
    const nodes = await this.nodeService.getAllNodes();

    const nodesGroupedByProvider: { [key: string]: any[] } = nodes.groupBy(x => x.provider);

    const providersDelegationData = await this.getDelegationProviders();
    if (!Array.isArray(providersDelegationData)) {
      return providers;
    }

    providers.forEach((element) => {
      const providerAddress = element.provider;

      // Delegation details for provider
      const delegationData = providersDelegationData.find((providerDelegationInfo: any) =>
        providerDelegationInfo !== null && providerAddress === providerDelegationInfo.contract
      );

      if (delegationData) {
        if (delegationData.aprValue) {
          element.apr = parseFloat(delegationData.aprValue.toFixed(2));
        }

        if (delegationData.featured) {
          element.featured = delegationData.featured;
        }

        if (delegationData.owner) {
          element.owner = delegationData.owner;
        }

        if (delegationData.automaticActivation) {
          element.automaticActivation = delegationData.automaticActivation;
        }

        if (delegationData.checkCapOnRedelegate) {
          element.checkCapOnRedelegate = delegationData.checkCapOnRedelegate;
        }

        if (delegationData.ownerBelowRequiredBalanceThreshold) {
          element.ownerBelowRequiredBalanceThreshold = delegationData.ownerBelowRequiredBalanceThreshold;
        }
      }

      // Add Nodes details for provider
      const providerNodes = nodesGroupedByProvider[providerAddress] ?? [];
      const nodesInfos: NodesInfos = this.getNodesInfosForProvider(providerNodes);
      element.numNodes = nodesInfos.numNodes;
      element.stake = nodesInfos.stake;
      element.topUp = nodesInfos.topUp;
      element.locked = nodesInfos.locked;
    });

    providers.sort((a, b) => {
      const aSort = a.locked && a.locked !== '0' ? parseInt(a.locked.slice(0, -18)) : 0;
      const bSort = b.locked && b.locked !== '0' ? parseInt(b.locked.slice(0, -18)) : 0;

      return bSort - aSort;
    });

    for (const provider of providers) {
      if (!provider.identity) {
        continue;
      }

      const githubProfileValidatedAt = await this.cachingService.getRemote<number>(CacheInfo.GithubProfileValidated(provider.identity).key);
      const githubKeysValidatedAt = await this.cachingService.getRemote<number>(CacheInfo.GithubKeysValidated(provider.identity).key);

      provider.githubProfileValidatedAt = githubProfileValidatedAt !== undefined && Number.isInteger(githubProfileValidatedAt) ? new Date(githubProfileValidatedAt * 1000).toISOString() : undefined;
      provider.githubKeysValidatedAt = githubKeysValidatedAt !== undefined && Number.isInteger(githubKeysValidatedAt) ? new Date(githubKeysValidatedAt * 1000).toISOString() : undefined;
      provider.githubProfileValidated = githubProfileValidatedAt !== undefined && Number.isInteger(githubProfileValidatedAt) ? true : false;
      provider.githubKeysValidated = githubKeysValidatedAt !== undefined && Number.isInteger(githubKeysValidatedAt) ? true : false;
    }

    return providers;
  }

  // @ts-ignore
  private isIdentityFormattedCorrectly(identity: string): boolean {
    return /^[\w]*$/g.test(identity ?? '');
  }

  async getProviders(filter: ProviderFilter, queryOptions?: ProviderQueryOptions): Promise<Provider[]> {
    const providers = await this.getFilteredProviders(filter);

    if (queryOptions && queryOptions.withIdentityInfo === true) {
      for (const provider of providers) {
        if (provider.identity) {
          const identityInfo = await this.identitiesService.getIdentity(provider.identity);
          provider.identityInfo = identityInfo;
        }
      }
    } else {
      for (const provider of providers) {
        delete provider.identityInfo;
      }
    }

    if (queryOptions && queryOptions.withLatestInfo) {
      for (const provider of providers) {
        const contractConfig = await this.getProviderConfig(provider.provider);
        const contractTotalActiveStake = await this.getTotalActiveStake(provider.provider);
        const contractNodesCount = await this.getNumNodes(provider.provider);

        if (contractConfig) {
          if (provider.serviceFee !== undefined) {
            provider.serviceFee = contractConfig.serviceFee;
          }

          if (provider.automaticActivation !== undefined) {
            provider.automaticActivation = contractConfig.automaticActivation;
          }

          if (provider.checkCapOnRedelegate !== undefined) {
            provider.checkCapOnRedelegate = contractConfig.checkCapOnRedelegate;
          }

          if (provider.delegationCap !== undefined) {
            provider.delegationCap = contractConfig.delegationCap;
          }

          if (provider.numNodes !== undefined) {
            provider.numNodes = contractNodesCount;
          }

          if (contractTotalActiveStake !== undefined) {
            if (provider.locked !== undefined) {
              provider.locked = contractTotalActiveStake;
            }
          }
        }
      }
    }

    return providers;
  }

  async getDelegationProviders(): Promise<DelegationData[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.DelegationProviders.key,
      async () => await this.getDelegationProvidersRaw(),
      CacheInfo.DelegationProviders.ttl
    );
  }

  async getDelegationProviderByAddress(address: string): Promise<DelegationData | undefined> {
    return await this.cachingService.getOrSet(
      CacheInfo.DelegationProvider(address).key,
      async () => await this.getDelegationProviderByAddressRaw(address),
      CacheInfo.DelegationProvider(address).ttl
    );
  }

  async getDelegationProvidersRaw(): Promise<DelegationData[]> {
    try {
      const { data } = await this.apiService.get(this.apiConfigService.getProvidersUrl());
      return data;
    } catch (error) {
      this.logger.error('Error when getting delegation providers');
      this.logger.error(error);
      return [];
    }
  }

  async getDelegationProviderByAddressRaw(address: string): Promise<DelegationData | undefined> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getProvidersUrl()}/${address}`);
      return data;
    } catch (error) {
      this.logger.error('Error when getting delegation provider');
      this.logger.error(error);
      return undefined;
    }
  }

  async getAllProviders(): Promise<Provider[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.Providers.key,
      async () => await this.getAllProvidersRaw(),
      CacheInfo.Providers.ttl
    );
  }

  async getAllProvidersRaw(): Promise<Provider[]> {
    if (this.apiConfigService.isProvidersFetchFeatureEnabled()) {
      return await this.getProviderAddressesFromApi();
    }

    const providerAddresses = await this.getProviderAddresses();

    const [configs, numUsers, cumulatedRewards] = await Promise.all([
      this.cachingService.batchProcess(
        providerAddresses,
        address => `providerConfig:${address}`,
        async address => await this.getProviderConfig(address),
        Constants.oneMinute() * 15,
      ),
      this.cachingService.batchProcess(
        providerAddresses,
        address => `providerNumUsers:${address}`,
        async address => await this.getNumUsers(address),
        Constants.oneHour(),
      ),
      this.cachingService.batchProcess(
        providerAddresses,
        address => `providerCumulatedRewards:${address}`,
        async address => await this.getCumulatedRewards(address),
        Constants.oneHour()
      ),
    ]);

    const providersRaw: Provider[] = providerAddresses.map((provider, index) => {
      return new Provider({
        provider,
        ...configs[index] ?? new ProviderConfig(),
        numUsers: numUsers[index] ?? 0,
        cumulatedRewards: cumulatedRewards[index] ?? '0',
        numNodes: 0,
        stake: '0',
        topUp: '0',
        locked: '0',
        featured: false,
      });
    });

    for (const provider of providersRaw) {
      const identity = await this.cachingService.getRemote<string>(CacheInfo.ConfirmedProvider(provider.provider).key);
      if (identity) {
        provider.identity = identity;
      }
    }

    for (const provider of providersRaw) {
      await this.cachingService.set(CacheInfo.ProviderOwner(provider.provider).key, provider.owner, CacheInfo.ProviderOwner(provider.provider).ttl);
    }

    return providersRaw;
  }

  async getProviderAddressesFromApi(): Promise<Provider[]> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getProvidersFetchServiceUrl()}/providers`, { params: { size: 10000 } });

      return data;
    } catch (error) {
      this.logger.error('An unhandled error occurred when getting tokens from API');
      this.logger.error(error);

      throw error;
    }
  }

  async getProviderAddresses() {
    let providersBase64: string[];
    try {
      providersBase64 = await this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationManagerContractAddress(),
        'getAllContractAddresses',
      );
    } catch (error) {
      this.logger.error(error);
      return [];
    }

    if (!providersBase64) {
      return [];
    }

    const value = providersBase64.map((providerBase64) =>
      AddressUtils.bech32Encode(Buffer.from(providerBase64, 'base64').toString('hex'))
    );

    return value;
  }

  async getProviderConfig(address: string): Promise<ProviderConfig | undefined> {
    if (address === this.apiConfigService.getDelegationContractAddress()) {
      return undefined;
    }

    try {
      const ownerAddressIndex = 0;
      const serviceFeeIndex = 1;
      const delegationCapIndex = 2;
      const automaticActivationIndex = 4;
      const redelegationCapIndex = 7;

      const response = await this.vmQueryService.vmQuery(
        address,
        'getContractConfig',
      );

      const ownerAddress = response[ownerAddressIndex];
      const serviceFeeBase64 = response[serviceFeeIndex];
      const delegationCapBase64 = response[delegationCapIndex];
      const automaticActivationBase64 = response[automaticActivationIndex];
      const checkCapOnRedelegateBase64 = response[redelegationCapIndex];

      const owner = AddressUtils.bech32Encode(Buffer.from(ownerAddress, 'base64').toString('hex'));

      const [serviceFee, delegationCap] = [
        serviceFeeBase64,
        delegationCapBase64,
      ].map((base64) => {
        const hex = base64 ? Buffer.from(base64, 'base64').toString('hex') : base64;
        return hex === null ? null : BigInt(hex ? '0x' + hex : hex).toString();
      });

      const [automaticActivation, checkCapOnRedelegate] = [
        automaticActivationBase64,
        checkCapOnRedelegateBase64,
      ].map((base64) => (Buffer.from(base64, 'base64').toString() === 'true' ? true : false));

      const serviceFeeString = String(parseInt(serviceFee ?? '0') / 10000);

      return {
        owner,
        serviceFee: parseFloat(serviceFeeString),
        delegationCap: delegationCap ?? '0',
        apr: 0,
        // initialOwnerFunds,
        automaticActivation,
        // changeableServiceFee,
        checkCapOnRedelegate,
        // createdNonce: parseInt(createdNonce),
      };
    } catch (error) {
      this.logger.error(`An unhandled error occurred when fetching provider config for address '${address}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getProviderMetadata(address: string): Promise<{ name: string | null, website: string | null, identity: string | null }> {
    try {
      const response = await this.vmQueryService.vmQuery(
        address,
        'getMetaData',
      );

      if (response) {
        const [name, website, identity] = response.map((base64) => {
          if (base64) {
            return Buffer.from(base64, 'base64').toString().trim().toLowerCase();
          }
          return "";
        });

        return { name, website, identity };
      }
    } catch (error) {
      this.logger.error(`Could not get provider metadata for address '${address}'`);
      this.logger.error(error);
    }

    return { name: null, website: null, identity: null };
  }

  async getNumUsers(address: string) {
    const [base64] = await this.vmQueryService.vmQuery(
      address,
      'getNumUsers',
    );

    if (base64) {
      const hex = Buffer.from(base64, 'base64').toString('hex');
      return Number(BigInt(hex ? '0x' + hex : hex));
    }

    return null;
  }

  async getCumulatedRewards(address: string): Promise<string | null> {
    const [base64] = await this.vmQueryService.vmQuery(
      address,
      'getTotalCumulatedRewards',
      'erd1qqqqqqqqqqqqqqqpqqqqqqqqlllllllllllllllllllllllllllsr9gav8',
    );

    if (base64) {
      const hex = Buffer.from(base64, 'base64').toString('hex');
      return BigInt(hex ? '0x' + hex : hex).toString();
    }

    return null;
  }

  async getProviderAccounts(address: string, queryPagination: QueryPagination): Promise<ProviderAccounts[]> {
    const elasticResults = await this.elasticIndexerService.getProviderDelegators(address, queryPagination);
    if (!elasticResults) {
      return [];
    }

    return elasticResults.map(account => ApiUtils.mergeObjects(new ProviderAccounts(), {
      address: account.address,
      stake: account.activeStake,
    }));
  }

  async getProviderAccountsCount(address: string): Promise<number> {
    return await this.elasticIndexerService.getProviderDelegatorsCount(address);
  }

  async getFilteredProviders(filter: ProviderFilter): Promise<Provider[]> {
    let providers = await this.getProvidersWithStakeInformation();

    if (filter.identity) {
      providers = providers.filter((provider) => provider.identity === filter.identity);
    }

    if (filter.providers) {
      providers = providers.filter(x => x.provider && filter.providers?.includes(x.provider));
    }

    if (filter.owner) {
      providers = providers.filter((provider) => provider.owner === filter.owner);
    }

    return providers;
  }

  async isProvider(address: string): Promise<boolean> {
    const provider = await this.getProvider(address);
    return !!provider;
  }

  private async getProviderIdentity(address: string): Promise<string | undefined> {
    const providerDetails = await this.getProvider(address);
    return providerDetails && providerDetails.identity ? providerDetails.identity : undefined;
  }

  private async getTotalActiveStake(address: string): Promise<string> {
    const [activeStake] = await this.vmQueryService.vmQuery(
      address,
      'getTotalActiveStake',
    );

    return BinaryUtils.base64ToBigInt(activeStake).toString();
  }

  private async getNumNodes(address: string): Promise<number> {
    const [numNodesBase64] = await this.vmQueryService.vmQuery(
      address,
      'getNumNodes'
    );

    return Number(BinaryUtils.base64ToBigInt(numNodesBase64));
  }
}
