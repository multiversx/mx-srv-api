import { Account } from "./entities/account";
import { Auction } from "./entities/auction";
import { EsdtAddressRoles } from "./entities/esdt.roles";
import { EsdtSupply } from "./entities/esdt.supply";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { HeartbeatStatus } from "./entities/heartbeat.status";
import { TrieStatistics } from "./entities/trie.statistics";
import { NetworkConfig } from "./entities/network.config";
import { NetworkEconomics } from "./entities/network.economics";
import { NetworkStatus } from "./entities/network.status";
import { NftData } from "./entities/nft.data";
import { TokenData } from "./entities/token.data";
import { Transaction } from "./entities/transaction";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { BinaryUtils, ContextTracker } from "@multiversx/sdk-nestjs-common";
import { ApiService, ApiSettings } from "@multiversx/sdk-nestjs-http";
import { GuardianResult } from "./entities/guardian.result";
import { TransactionProcessStatus } from "./entities/transaction.process.status";
import { TxPoolGatewayResponse } from "./entities/tx.pool.gateway.response";

@Injectable()
export class GatewayService {
  private readonly snapshotlessRequestsSet: Set<String> = new Set([
    GatewayComponentRequest.addressBalance,
    GatewayComponentRequest.addressDetails,
    GatewayComponentRequest.addressEsdt,
    GatewayComponentRequest.addressNftByNonce,
    GatewayComponentRequest.vmQuery,
    GatewayComponentRequest.transactionPool,
    GatewayComponentRequest.guardianData,
  ]);

  private readonly deepHistoryRequestsSet: Set<String> = new Set([
    GatewayComponentRequest.addressDetails,
    GatewayComponentRequest.addressEsdt,
    GatewayComponentRequest.addressEsdtBalance,
    GatewayComponentRequest.addressNftByNonce,
    GatewayComponentRequest.vmQuery,
  ]);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) { }

  async getVersion(): Promise<string | undefined> {
    const result = await this.get('about', GatewayComponentRequest.about);

    if (result && result.appVersion && result.appVersion !== "undefined") {
      return result.appVersion;
    }

    return undefined;
  }

  async getValidatorAuctions(): Promise<Auction[]> {
    const result = await this.get('validator/auction', GatewayComponentRequest.validatorAuction);
    return result.auctionList;
  }

  async getNetworkStatus(shardId: number | string): Promise<NetworkStatus> {
    const result = await this.get(`network/status/${shardId}`, GatewayComponentRequest.networkStatus);
    return result.status;
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const result = await this.get('network/config', GatewayComponentRequest.networkConfig);
    return result.config;
  }

  async getNetworkEconomics(): Promise<NetworkEconomics> {
    const result = await this.get('network/economics', GatewayComponentRequest.networkEconomics);
    return result.metrics;
  }

  async getNodeHeartbeatStatus(): Promise<HeartbeatStatus[]> {
    const result = await this.get('node/heartbeatstatus', GatewayComponentRequest.nodeHeartbeat);
    return result.heartbeats;
  }

  async getTrieStatistics(shardId: number): Promise<TrieStatistics> {
    const result = await this.get(`network/trie-statistics/${shardId}`, GatewayComponentRequest.trieStatistics);

    return new TrieStatistics({
      accounts_snapshot_num_nodes: result['accounts-snapshot-num-nodes'],
    });
  }

  async getAddressDetails(address: string): Promise<Account> {
    const result = await this.get(`address/${address}`, GatewayComponentRequest.addressDetails);
    return result;
  }

  async getAccountsBulk(addresses: string[]): Promise<Account[]> {
    const result = await this.create('address/bulk', GatewayComponentRequest.addressesBulk, addresses);
    return result.accounts;
  }

  async getEsdtSupply(identifier: string): Promise<EsdtSupply> {
    const result = await this.get(`network/esdt/supply/${identifier}`, GatewayComponentRequest.esdtSupply);
    return result;
  }

  async getEsdtFungibleTokens(): Promise<string[]> {
    const result = await this.get('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens);
    return result.tokens;
  }

  async getAddressEsdtRoles(address: string): Promise<EsdtAddressRoles> {
    const result = await this.get(`address/${address}/esdts/roles`, GatewayComponentRequest.addressEsdtAllRoles);
    return result;
  }

  async getGuardianData(address: string): Promise<GuardianResult> {
    const result = await this.get(`address/${address}/guardian-data`, GatewayComponentRequest.guardianData);
    return result;
  }

  async getNodeWaitingEpochsLeft(bls: string): Promise<number> {
    const result = await this.get(`node/waiting-epochs-left/${bls}`, GatewayComponentRequest.getNodeWaitingEpochsLeft);
    return result.epochsLeft;
  }

  async getTransactionProcessStatus(txHash: string): Promise<TransactionProcessStatus> {
    // eslint-disable-next-line require-await
    const result = await this.get(`transaction/${txHash}/process-status`, GatewayComponentRequest.transactionProcessStatus, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('transaction not found')) {
        return true;
      }

      return false;
    });

    return result;
  }

  async getAddressEsdt(address: string, identifier: string): Promise<TokenData> {
    // eslint-disable-next-line require-await
    const result = await this.get(`address/${address}/esdt/${identifier}`, GatewayComponentRequest.addressEsdtBalance, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    return new TokenData(result.tokenData);
  }

  async getAddressNft(address: string, identifier: string): Promise<NftData> {
    const esdtIdentifier = identifier.split('-').slice(0, 2).join('-');
    const nonceHex = identifier.split('-').last();
    const nonceNumeric = BinaryUtils.hexToNumber(nonceHex);

    // eslint-disable-next-line require-await
    const result = await this.get(`address/${address}/nft/${esdtIdentifier}/nonce/${nonceNumeric}`, GatewayComponentRequest.addressNftByNonce, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    return new NftData(result.tokenData);
  }

  async getTransactionPool(): Promise<TxPoolGatewayResponse> {
    return await this.get(`transaction/pool?fields=*`, GatewayComponentRequest.transactionPool);
  }

  async getTransaction(txHash: string): Promise<Transaction | undefined> {
    // eslint-disable-next-line require-await
    const result = await this.get(`transaction/${txHash}?withResults=true`, GatewayComponentRequest.transactionDetails, async (error) => {
      if (error.response.data.error === 'transaction not found') {
        return true;
      }

      return false;
    });

    return result?.transaction;
  }

  async getBlockByShardAndNonce(shard: number, nonce: number, withTxs?: boolean): Promise<any> {
    const result = await this.get(`block/${shard}/by-nonce/${nonce}?withTxs=${withTxs ?? false}`, GatewayComponentRequest.blockByNonce);

    return result.block;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async get(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.getRaw(url, component, errorHandler);

    this.applyDeepHistoryBlockInfoIfRequired(component, result);

    return result?.data?.data;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async getRaw(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const fullUrl = this.getFullUrl(component, url);

    return await this.apiService.get(fullUrl, new ApiSettings(), errorHandler);
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async create(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.createRaw(url, component, data, errorHandler);

    this.applyDeepHistoryBlockInfoIfRequired(component, result);

    return result?.data?.data;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async createRaw(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const fullUrl = this.getFullUrl(component, url);

    return await this.apiService.post(fullUrl, data, new ApiSettings(), errorHandler);
  }

  private getFullUrl(component: GatewayComponentRequest, suffix: string) {
    const url = new URL(`${this.getGatewayUrl(component)}/${suffix}`);

    const context = ContextTracker.get();
    if (context && context.deepHistoryBlockNonce && this.deepHistoryRequestsSet.has(component)) {
      url.searchParams.set('blockNonce', context.deepHistoryBlockNonce);
    }

    return url.href;
  }

  private getGatewayUrl(component: GatewayComponentRequest): string {
    const context = ContextTracker.get();
    if (context && context.deepHistoryBlockNonce && this.deepHistoryRequestsSet.has(component)) {
      return this.apiConfigService.getDeepHistoryGatewayUrl();
    }

    if (this.snapshotlessRequestsSet.has(component)) {
      return this.apiConfigService.getSnapshotlessGatewayUrl() ?? this.apiConfigService.getGatewayUrl();
    }

    return this.apiConfigService.getGatewayUrl();
  }

  private applyDeepHistoryBlockInfoIfRequired(component: GatewayComponentRequest, result: any) {
    const context = ContextTracker.get();
    if (context && context.deepHistoryBlockNonce && this.deepHistoryRequestsSet.has(component)) {
      const blockInfo = result?.data?.data?.blockInfo;
      if (blockInfo) {
        ContextTracker.assign({
          deepHistoryBlockInfo: blockInfo,
        });
      }
    }
  }
}
