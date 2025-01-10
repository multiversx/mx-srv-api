import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { GatewayService } from "src/common/gateway/gateway.service";
import { SmartContractResult } from "../sc-results/entities/smart.contract.result";
import { Transaction } from "./entities/transaction";
import { TransactionDetailed } from "./entities/transaction.detailed";
import { TransactionLog } from "./entities/transaction.log";
import { TransactionOptionalFieldOption } from "./entities/transaction.optional.field.options";
import { TransactionReceipt } from "./entities/transaction.receipt";
import { TokenTransferService } from "../tokens/token.transfer.service";
import { BinaryUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { TransactionUtils } from "./transaction.utils";
import { IndexerService } from "src/common/indexer/indexer.service";
import { Transaction as IndexerTransaction } from "src/common/indexer/entities/transaction";
import { MiniBlockType } from "../miniblocks/entities/mini.block.type";
import { TransactionStatus } from "./entities/transaction.status";
import { UsernameUtils } from "../usernames/username.utils";
import { TransactionLogEvent } from "./entities/transaction.log.event";
import { TransactionOperationType } from "./entities/transaction.operation.type";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NftFilter } from "../nfts/entities/nft.filter";
import { TokenAccount } from "src/common/indexer/entities";

@Injectable()
export class TransactionGetService {
  private readonly logger = new OriginLogger(TransactionGetService.name);

  constructor(
    private readonly indexerService: IndexerService,
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => TokenTransferService))
    private readonly tokenTransferService: TokenTransferService,
  ) { }

  private async tryGetTransactionFromElasticBySenderAndNonce(sender: string, nonce: number): Promise<TransactionDetailed | undefined> {
    const transactions = await this.indexerService.getTransactionBySenderAndNonce(sender, nonce);
    return transactions.firstOrUndefined() as TransactionDetailed | undefined;
  }

  async getTransactionLogsFromElastic(hashes: string[]): Promise<TransactionLog[]> {
    let currentHashes = hashes.slice(0, 1000);
    const result = [];
    while (currentHashes.length > 0) {
      const items = await this.getTransactionLogsFromElasticInternal(currentHashes);
      result.push(...items);

      hashes = hashes.slice(1000);
      currentHashes = hashes.slice(0, 1000);
    }

    return result.map(x => ApiUtils.mergeObjects(new TransactionLog(), x));
  }

  private async getTransactionLogsFromElasticInternal(hashes: string[]): Promise<any[]> {
    return await this.indexerService.getTransactionLogs(hashes);
  }

  async getTransactionScResultsFromElastic(txHash: string): Promise<SmartContractResult[]> {
    const scResults = await this.indexerService.getTransactionScResults(txHash);
    return scResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
  }

  async tryGetTransactionFromElastic(txHash: string, fields?: string[]): Promise<TransactionDetailed | null> {
    let transaction: any;
    try {
      transaction = await this.indexerService.getTransaction(txHash);

      if (!transaction) {
        return null;
      }
    } catch (error: any) {
      this.logger.error(`Unexpected error when getting transaction from elastic, hash '${txHash}'`);
      this.logger.error(error);

      throw error;
    }

    try {
      if (transaction.scResults) {
        transaction.results = transaction.scResults;
      }

      if (transaction.relayerAddr) {
        transaction.relayer = transaction.relayerAddr;
      }

      const transactionDetailed: TransactionDetailed = ApiUtils.mergeObjects(new TransactionDetailed(), transaction);

      const hashes: string[] = [];
      hashes.push(txHash);
      const previousHashes: Record<string, string> = {};

      if (transaction.hasScResults === true || transaction.hasOperations === true &&
        (!fields || fields.length === 0 || fields.includes(TransactionOptionalFieldOption.results))) {
        transactionDetailed.results = await this.getTransactionScResultsFromElastic(transactionDetailed.txHash);

        for (const scResult of transactionDetailed.results) {
          hashes.push(scResult.hash);
          previousHashes[scResult.hash] = scResult.prevTxHash;
        }
      }

      if (!fields || fields.length === 0 || fields.includes(TransactionOptionalFieldOption.receipt)) {
        const receipts = await this.indexerService.getTransactionReceipts(txHash);
        if (receipts.length > 0) {
          const receipt = receipts[0];
          transactionDetailed.receipt = ApiUtils.mergeObjects(new TransactionReceipt(), receipt);
        }
      }

      if (!fields || fields.length === 0 || fields.includesSome([TransactionOptionalFieldOption.logs, TransactionOptionalFieldOption.operations])) {
        const logs = await this.getTransactionLogsFromElastic(hashes);
        for (const log of logs) {
          this.alterDuplicatedTransferValueOnlyEvents(log.events);
        }

        if (!fields || fields.length === 0 || fields.includes(TransactionOptionalFieldOption.operations)) {
          transactionDetailed.operations = await this.tokenTransferService.getOperationsForTransaction(transactionDetailed, logs);
          transactionDetailed.operations = TransactionUtils.trimOperations(transactionDetailed.sender, transactionDetailed.operations, previousHashes);
        }

        for (const log of logs) {
          if (log.id === txHash) {
            transactionDetailed.logs = log;
          } else if (transactionDetailed.results) {
            const foundScResult = transactionDetailed.results.find(({ hash }) => log.id === hash);
            if (foundScResult) {
              foundScResult.logs = log;
            }
          }
        }
      }

      this.applyUsernamesToDetailedTransaction(transaction, transactionDetailed);
      await this.applyNftNameOnTransactionOperations([transactionDetailed]);

      return ApiUtils.mergeObjects(new TransactionDetailed(), transactionDetailed);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  private alterDuplicatedTransferValueOnlyEvents(events: TransactionLogEvent[]) {
    const backTransferEncoded = BinaryUtils.base64Encode('BackTransfer');
    const asyncCallbackEncoded = BinaryUtils.base64Encode('AsyncCallback');

    const transferValueOnlyEvents = events.filter(x => x.identifier === 'transferValueOnly');
    const backTransferEvents = transferValueOnlyEvents.filter(x => x.data === backTransferEncoded);
    const asyncCallbackEvents = transferValueOnlyEvents.filter(x => x.data == asyncCallbackEncoded);

    if (backTransferEvents.length === 1 && asyncCallbackEvents.length === 1 &&
      asyncCallbackEvents[0].topics.length > 1 &&
      JSON.stringify(backTransferEvents[0].topics) === JSON.stringify(asyncCallbackEvents[0].topics)
    ) {
      asyncCallbackEvents[0].topics[0] = BinaryUtils.hexToBase64(BinaryUtils.numberToHex(0));
    }
  }

  private applyUsernamesToDetailedTransaction(transaction: IndexerTransaction, transactionDetailed: TransactionDetailed) {
    if (transaction.senderUserName) {
      transactionDetailed.senderUsername = UsernameUtils.extractUsernameFromRawBase64(transaction.senderUserName);
    }

    if (transaction.senderUsername) {
      transactionDetailed.senderUsername = UsernameUtils.extractUsernameFromRawBase64(transaction.senderUsername);
    }

    if (transaction.receiverUserName) {
      transactionDetailed.receiverUsername = UsernameUtils.extractUsernameFromRawBase64(transaction.receiverUserName);
    }

    if (transaction.receiverUsername) {
      transactionDetailed.receiverUsername = UsernameUtils.extractUsernameFromRawBase64(transaction.receiverUsername);
    }
  }

  async tryGetTransactionFromGatewayForList(txHash: string) {
    const gatewayTransaction = await this.tryGetTransactionFromGateway(txHash, false);
    if (gatewayTransaction) {
      return ApiUtils.mergeObjects(new Transaction(), gatewayTransaction);
    }
    return undefined; //invalid hash
  }

  async tryGetTransactionFromGateway(txHash: string, queryInElastic: boolean = true): Promise<TransactionDetailed | null> {
    try {
      // eslint-disable-next-line require-await
      const transactionResult = await this.gatewayService.getTransaction(txHash);

      if (!transactionResult) {
        return null;
      }

      const transaction = transactionResult;

      if (!transaction) {
        return null;
      }

      if (transaction.miniblockType === MiniBlockType.SmartContractResultBlock) {
        return null;
      }

      if (transaction.status === 'pending' && queryInElastic) {
        const existingTransaction = await this.tryGetTransactionFromElasticBySenderAndNonce(transaction.sender, transaction.nonce);
        if (existingTransaction && existingTransaction.txHash !== txHash) {
          return null;
        }
      }

      if (transaction.receipt) {
        transaction.receipt.value = transaction.receipt.value.toString();
      }

      if (transaction.smartContractResults) {
        for (const smartContractResult of transaction.smartContractResults) {
          smartContractResult.callType = smartContractResult.callType.toString();
          smartContractResult.value = smartContractResult.value.toString();

          if (smartContractResult.data) {
            smartContractResult.data = BinaryUtils.base64Encode(smartContractResult.data);
          }
        }
      }

      const result = {
        txHash: txHash,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        gasUsed: transaction.gasUsed,
        miniBlockHash: transaction.miniblockHash,
        senderShard: transaction.sourceShard,
        receiverShard: transaction.destinationShard,
        nonce: transaction.nonce,
        receiver: transaction.receiver,
        receiverUsername: UsernameUtils.extractUsernameFromRawBase64(transaction.receiverUsername),
        sender: transaction.sender,
        senderUsername: UsernameUtils.extractUsernameFromRawBase64(transaction.senderUsername),
        signature: transaction.signature,
        status: transaction.status,
        value: transaction.value,
        round: transaction.round,
        fee: transaction.fee,
        timestamp: transaction.timestamp,
        scResults: transaction.smartContractResults ? transaction.smartContractResults.map((scResult: any) => ApiUtils.mergeObjects(new SmartContractResult(), scResult)) : [],
        receipt: transaction.receipt ? ApiUtils.mergeObjects(new TransactionReceipt(), transaction.receipt) : undefined,
        logs: transaction.logs,
        guardianAddress: transaction.guardian,
        guardianSignature: transaction.guardianSignature,
        inTransit: transaction.miniblockHash !== undefined && transaction.status === TransactionStatus.pending,
        relayer: transaction.relayerAddress,
        relayerSignature: transaction.relayerSignature,
      };

      return ApiUtils.mergeObjects(new TransactionDetailed(), result);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async applyNftNameOnTransactionOperations(transactions: TransactionDetailed[]): Promise<void> {
    const operations = transactions.selectMany(x => x.operations ?? []);

    const distinctNftIdentifiers = operations.filter(x => x.type === TransactionOperationType.nft).map(x => x.identifier).distinct();
    if (distinctNftIdentifiers.length > 0) {
      const elasticNfts = await this.indexerService.getNfts(new QueryPagination({ from: 0, size: distinctNftIdentifiers.length }), new NftFilter({ identifiers: distinctNftIdentifiers }));
      const elasticNftsDict = elasticNfts.toRecord<TokenAccount>(x => x.identifier);

      for (const operation of operations) {
        if (elasticNftsDict[operation.identifier]) {
          operation.name = elasticNftsDict[operation.identifier].data?.name ?? operation.name;
        }
      }
    }
  }
}
