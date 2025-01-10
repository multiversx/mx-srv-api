import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { WebSocketPublisherService } from "src/common/websockets/web-socket-publisher-service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MetricsEvents } from "src/utils/metrics-events.constants";

@Controller()
export class WebSocketPublisherController {
  private logger = new OriginLogger(WebSocketPublisherController.name);

  constructor(
    private readonly webSocketPublisherService: WebSocketPublisherService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  @EventPattern('transactionsCompleted')
  async transactionsCompleted(transactions: ShardTransaction[]) {
    for (const transaction of transactions) {
      await this.webSocketPublisherService.onTransactionCompleted(transaction);
    }

    this.eventEmitter.emit(MetricsEvents.SetTransactionsCompleted, {
      transactions,
    });
  }

  @EventPattern('transactionsPendingResults')
  async transactionsPendingResults(transactions: ShardTransaction[]) {
    for (const transaction of transactions) {
      await this.webSocketPublisherService.onTransactionPendingResults(transaction);
    }

    this.eventEmitter.emit(MetricsEvents.SetTransactionsPendingResults, {
      transactions,
    });
  }

  @EventPattern('onBatchUpdated')
  onBatchUpdated(payload: { address: string, batchId: string, txHashes: string[] }) {
    this.logger.log(`Notifying batch updated for address ${payload.address}, batch id '${payload.batchId}', hashes ${payload.txHashes} `);
    this.webSocketPublisherService.onBatchUpdated(payload.address, payload.batchId, payload.txHashes);

    this.eventEmitter.emit(MetricsEvents.SetBatchUpdated);
  }
}
