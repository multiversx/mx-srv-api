import { Address, Transaction as ErdJsTransaction, TransactionHash, TransactionOptions, TransactionPayload, TransactionVersion } from "@multiversx/sdk-core/out";
import { Signature } from "@multiversx/sdk-core/out/signature";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable, Logger } from "@nestjs/common";
import { TransactionBatch } from "./entities/transaction.batch";
import { TransactionBatchStatus } from "./entities/transaction.batch.status";
import { BatchTransactionStatus } from "./entities/batch.transaction.status";
import { TransactionBatchGroup } from "./entities/transaction.batch.group";
import { TransactionBatchItem } from "./entities/transaction.batch.item";
import { TransactionBatchSimplified } from "./entities/transaction.batch.simplified";
import { Transaction } from "./entities/transaction";
import { TransactionBatchSimplifiedResult } from "./entities/transaction.batch.simplified.result";
import { TransactionDetailsWithResult } from "./entities/transaction.details.with.result";
import { CacheInfo } from "src/utils/cache.info";
import { TransactionService } from "../transactions/transaction.service";
import { TransactionCreate } from "../transactions/entities/transaction.create";

@Injectable()
export class TransactionsBatchService {
  private readonly logger: Logger;

  constructor(
    private readonly cachingService: CacheService,
    private readonly transactionService: TransactionService,
  ) {
    this.logger = new Logger(TransactionsBatchService.name);
  }

  async startTransactionBatch(batch: TransactionBatch, sourceIp: string): Promise<TransactionBatch> {
    if (batch.groups.length === 0) {
      return batch;
    }

    for (const group of batch.groups) {
      for (const item of group.items) {
        const tx = item.transaction.tx;

        const trans = new ErdJsTransaction({
          nonce: tx.nonce,
          value: tx.value,
          receiver: new Address(tx.receiver),
          gasPrice: tx.gasPrice,
          gasLimit: tx.gasLimit,
          data: tx.data ? new TransactionPayload(BinaryUtils.base64Decode(tx.data ?? '')) : undefined,
          chainID: tx.chainID,
          version: new TransactionVersion(tx.version),
          options: tx.options ? new TransactionOptions(tx.options) : undefined,
          guardian: tx.guardian ? new Address(tx.guardian) : undefined,
          sender: new Address(tx.sender),
        });

        if (tx.guardianSignature) {
          trans.applyGuardianSignature(new Signature(tx.guardianSignature));
        }

        trans.applySignature(new Signature(tx.signature));

        item.transaction.hash = TransactionHash.compute(trans).toString();
      }
    }

    batch.status = TransactionBatchStatus.pending;
    batch.sourceIp = sourceIp;

    for (const group of batch.groups) {
      for (const item of group.items) {
        item.status = BatchTransactionStatus.pending;
      }
    }

    const group = batch.groups[0];

    this.logger.log(`Starting initial transactions for batch '${batch.id}'`);
    await this.startTransactionGroup(batch, group);

    if (group.items.filter(x => x.status === BatchTransactionStatus.invalid).length > 0) {
      batch.status = TransactionBatchStatus.invalid;
      return batch;
    }

    await this.cachingService.setRemote(
      CacheInfo.TransactionBatch(TransactionBatch.getAddress(batch), batch.id).key,
      batch,
      CacheInfo.TransactionBatch(TransactionBatch.getAddress(batch), batch.id).ttl
    );

    return batch;
  }

  async getTransactionBatches(address: string): Promise<TransactionBatch[]> {
    const keys = await this.cachingService.getKeys(CacheInfo.TransactionBatch(address, '*').key);

    const transactionBatches: TransactionBatch[] = await this.cachingService.batchGetManyRemote(keys) as TransactionBatch[];

    return transactionBatches;
  }

  async getTransactionBatch(address: string, batchId: string): Promise<TransactionBatch | undefined> {
    return await this.cachingService.getRemote(
      CacheInfo.TransactionBatch(address, batchId).key
    );
  }

  async startTransactionGroup(batch: TransactionBatch, group: TransactionBatchGroup): Promise<any> {
    const results = [];
    for (const item of group.items) {
      const result = await this.executeTransaction(batch.id, item, batch.sourceIp);

      results.push(result);

      if (result.status === BatchTransactionStatus.invalid) {
        break;
      }
    }

    const txHashes = results.filter(result => result.status === BatchTransactionStatus.pending).map(result => result.transaction.hash);
    this.logger.log(`For batch with id '${batch.id}', starting transactions with hashes ${txHashes}`);

    const value = batch.id + ';' + TransactionBatch.getAddress(batch) + ';' + new Date().toISOString();
    return await Promise.all(txHashes.map(hash => this.cachingService.setRemote(CacheInfo.PendingTransaction(hash).key, value, CacheInfo.PendingTransaction(hash).ttl)));
  }

  private async executeTransaction(batchId: string, transactionBatchItem: TransactionBatchItem, sourceIp: string): Promise<TransactionBatchItem> {
    const transaction = transactionBatchItem.transaction;

    this.logger.log(`For batch with id '${batchId}', sending transaction with payload '${JSON.stringify(transaction.tx)}' from source ip '${sourceIp}'`);

    let result: any;
    try {
      result = await this.transactionService.createTransaction(new TransactionCreate({ ...transaction.tx }));
    } catch (error: any) {
      this.logger.error(error);

      transactionBatchItem.status = BatchTransactionStatus.invalid;

      // we try to decode the error message. if it fails, it fails
      try {
        transactionBatchItem.error = error.response.data.message;
      } catch (error: any) {
        this.logger.error(error);
      }

      this.logger.error(`For batch with id '${batchId}', error when executing transaction with payload '${JSON.stringify(transaction.tx)}'. Error message: ${transactionBatchItem.error}`);

      return transactionBatchItem;
    }

    if (result.txHash) {
      transaction.hash = result.txHash;
    } else {
      transactionBatchItem.status = BatchTransactionStatus.invalid;
    }

    return transactionBatchItem;
  }

  convertToTransactionBatch(batch: TransactionBatchSimplified): TransactionBatch {
    const transactionBatch = new TransactionBatch();
    transactionBatch.id = batch.id;

    for (const batchGroup of batch.transactions) {
      const transactionGroup = new TransactionBatchGroup();

      for (const groupTransaction of batchGroup) {
        const transactionItem = new TransactionBatchItem();

        const transaction = new Transaction();
        transaction.tx = groupTransaction;

        transactionItem.transaction = transaction;

        transactionGroup.items.push(transactionItem);
      }

      transactionBatch.groups.push(transactionGroup);
    }

    return transactionBatch;
  }

  convertFromTransactionBatch(batch: TransactionBatch): TransactionBatchSimplifiedResult {
    const transactionBatch = new TransactionBatchSimplifiedResult();
    transactionBatch.id = batch.id;
    transactionBatch.status = batch.status;
    transactionBatch.transactions = [];

    for (const transactionBatchGroup of batch.groups) {
      const transactionBatchItems: TransactionDetailsWithResult[] = [];
      for (const transactionItem of transactionBatchGroup.items) {
        const transaction = transactionItem.transaction.tx;

        const transactionBatchItem: TransactionDetailsWithResult = { ...transaction };

        // if batch failed all transactions within that batch should be marked as failed
        if (batch.status === TransactionBatchStatus.invalid && transactionItem.status === BatchTransactionStatus.pending) {
          transactionBatchItem.status = BatchTransactionStatus.invalid;
        } else {
          transactionBatchItem.status = transactionItem.status;
        }

        transactionBatchItem.error = transactionItem.error;
        transactionBatchItem.hash = transactionItem.transaction.hash;

        transactionBatchItems.push(transactionBatchItem);
      }

      transactionBatch.transactions.push(transactionBatchItems);
    }

    return transactionBatch;
  }
}
