import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TestingModule, Test } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { WebSocketPublisherController } from "src/common/websockets/web-socket-publisher-controller";
import { WebSocketPublisherService } from "src/common/websockets/web-socket-publisher-service";
import { MetricsEvents } from "src/utils/metrics-events.constants";

describe('WebSocketPublisherController', () => {
  let controller: WebSocketPublisherController;
  let webSocketPublisherService: WebSocketPublisherService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebSocketPublisherController],
      providers: [
        {
          provide: WebSocketPublisherService,
          useValue: {
            onTransactionCompleted: jest.fn(),
            onTransactionPendingResults: jest.fn(),
            onBatchUpdated: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WebSocketPublisherController>(WebSocketPublisherController);
    webSocketPublisherService = module.get<WebSocketPublisherService>(WebSocketPublisherService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should handle transactionsCompleted event', async () => {
    const mockTransactions = [{}, {}] as ShardTransaction[];
    await controller.transactionsCompleted(mockTransactions);
    expect(webSocketPublisherService.onTransactionCompleted).toHaveBeenCalledTimes(mockTransactions.length);
    expect(eventEmitter.emit).toHaveBeenCalledWith(MetricsEvents.SetTransactionsCompleted, { transactions: mockTransactions });
  });

  it('should handle transactionsPendingResults event', async () => {
    const mockTransactions = [{}, {}] as ShardTransaction[];
    await controller.transactionsPendingResults(mockTransactions);
    expect(webSocketPublisherService.onTransactionPendingResults).toHaveBeenCalledTimes(mockTransactions.length);
    expect(eventEmitter.emit).toHaveBeenCalledWith(MetricsEvents.SetTransactionsPendingResults, { transactions: mockTransactions });
  });

  it('should handle onBatchUpdated event', () => {
    const mockPayload = { address: 'testAddress', batchId: 'testBatchId', txHashes: ['hash1', 'hash2'] };
    controller.onBatchUpdated(mockPayload);
    expect(webSocketPublisherService.onBatchUpdated).toHaveBeenCalledWith(mockPayload.address, mockPayload.batchId, mockPayload.txHashes);
    expect(webSocketPublisherService.onBatchUpdated).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(MetricsEvents.SetBatchUpdated);
  });
});
