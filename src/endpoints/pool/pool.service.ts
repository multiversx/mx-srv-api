import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { TxPoolGatewayResponse } from "src/common/gateway/entities/tx.pool.gateway.response";
import { TransactionType } from "../transactions/entities/transaction.type";
import { TransactionInPool } from "./entities/transaction.in.pool.dto";
import { PoolFilter } from "./entities/pool.filter";
import { TxInPoolFields } from "src/common/gateway/entities/tx.in.pool.fields";
import { AddressUtils } from "@multiversx/sdk-nestjs-common";
import { ProtocolService } from "../../common/protocol/protocol.service";
import { TransactionActionService } from "../transactions/transaction-action/transaction.action.service";
import { Transaction } from "../transactions/entities/transaction";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";

@Injectable()
export class PoolService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
    private readonly protocolService: ProtocolService,
    private readonly transactionActionService: TransactionActionService,
  ) { }

  async getTransactionFromPool(txHash: string): Promise<TransactionInPool | undefined> {
    const pool = await this.getEntirePool();
    return pool.find(tx => tx.txHash === txHash);
  }

  async getPoolCount(filter: PoolFilter): Promise<number> {
    const pool = await this.getEntirePool();
    return this.applyFilters(pool, filter).length;
  }

  async getPool(
    queryPagination: QueryPagination,
    filter: PoolFilter,
  ): Promise<TransactionInPool[]> {
    if (!this.apiConfigService.isTransactionPoolEnabled()) {
      return [];
    }

    const { from, size } = queryPagination;
    const entirePool = await this.getEntirePool();
    const pool = this.applyFilters(entirePool, filter);
    return pool.slice(from, from + size);
  }

  async getEntirePool(): Promise<TransactionInPool[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.TransactionPool.key,
      async () => await this.getTxPoolRaw(),
      CacheInfo.TransactionPool.ttl,
    );
  }

  async getTxPoolRaw(): Promise<TransactionInPool[]> {
    const pool = await this.gatewayService.getTransactionPool();
    return this.parseTransactions(pool);
  }

  private async parseTransactions(rawPool: TxPoolGatewayResponse): Promise<TransactionInPool[]> {
    const transactionPool: TransactionInPool[] = [];

    if (rawPool?.txPool) {
      const regularTransactions = this.processTransactionsWithType(rawPool.txPool.regularTransactions ?? [], TransactionType.Transaction);
      const smartContractResults = this.processTransactionsWithType(rawPool.txPool.smartContractResults ?? [], TransactionType.SmartContractResult);
      const rewards = this.processTransactionsWithType(rawPool.txPool.rewards ?? [], TransactionType.Reward);

      const allTransactions = await Promise.all([regularTransactions, smartContractResults, rewards]);

      allTransactions.forEach(transactions => transactionPool.push(...transactions));
    }

    return transactionPool;
  }

  // eslint-disable-next-line require-await
  private async processTransactionsWithType(transactions: any[], transactionType: TransactionType): Promise<TransactionInPool[]> {
    return Promise.all(transactions.map(tx => this.parseTransaction(tx.txFields, transactionType)));
  }

  private async parseTransaction(tx: TxInPoolFields, type: TransactionType): Promise<TransactionInPool> {
    const transaction: TransactionInPool = new TransactionInPool({
      txHash: tx.hash ?? '',
      sender: tx.sender ?? '',
      receiver: tx.receiver ?? '',
      receiverUsername: tx.receiverusername ?? '',
      nonce: tx.nonce ?? 0,
      value: tx.value ?? '',
      gasPrice: tx.gasprice ?? 0,
      gasLimit: tx.gaslimit ?? 0,
      data: tx.data ?? '',
      guardian: tx.guardian ?? '',
      guardianSignature: tx.guardiansignature ?? '',
      signature: tx.signature ?? '',
      type: type ?? TransactionType.Transaction,
    });

    // TODO: after gateway's /transaction/pool returns the sendershard and receivershard correctly, remove this computation
    const shardCount = await this.protocolService.getShardCount();
    if (transaction.sender) {
      transaction.senderShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.sender), shardCount);
    }
    if (transaction.receiver) {
      transaction.receiverShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.receiver), shardCount);
    }

    const metadata = await this.transactionActionService.getTransactionMetadata(this.poolTransactionToTransaction(transaction), false);
    if (metadata && metadata.functionName) {
      transaction.function = metadata.functionName;
    }

    return transaction;
  }

  private applyFilters(pool: TransactionInPool[], filters: PoolFilter): TransactionInPool[] {
    return pool.filter((transaction) => {
      return (
        (!filters.sender || transaction.sender === filters.sender) &&
        (!filters.receiver || transaction.receiver === filters.receiver) &&
        (!filters.type || transaction.type === filters.type) &&
        (filters.senderShard === undefined || transaction.senderShard === filters.senderShard) &&
        (filters.receiverShard === undefined || transaction.receiverShard === filters.receiverShard) &&
        (filters.functions === undefined || transaction.function === undefined || filters.functions.indexOf(transaction.function) > -1)
      );
    });
  }

  private poolTransactionToTransaction(transaction: TransactionInPool): Transaction {
    return ApiUtils.mergeObjects(new Transaction(), transaction);
  }
}
