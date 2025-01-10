import { MetricsService } from '@multiversx/sdk-nestjs-monitoring';
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { OnEvent } from '@nestjs/event-emitter';
import { register, Histogram, Gauge, Counter } from 'prom-client';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";
import { MetricsEvents } from '../../utils/metrics-events.constants';
import { LogMetricsEvent } from "../entities/log.metrics.event";

@Injectable()
export class ApiMetricsService {
  private static vmQueriesHistogram: Histogram<string>;
  private static gatewayDurationHistogram: Histogram<string>;
  private static persistenceDurationHistogram: Histogram<string>;
  private static indexerDurationHistogram: Histogram<string>;
  private static graphqlDurationHistogram: Histogram<string>;
  private static currentNonceGauge: Gauge<string>;
  private static lastProcessedNonceGauge: Gauge<string>;
  private static lastProcessedBatchProcessorNonce: Gauge<string>;
  private static lastProcessedTransactionCompletedProcessorNonce: Gauge<string>;
  private static transactionsCompletedCounter: Counter<string>;
  private static transactionsPendingResultsCounter: Counter<string>;
  private static batchUpdatesCounter: Counter<string>;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => ProtocolService))
    private readonly protocolService: ProtocolService,
    private readonly metricsService: MetricsService,
  ) {

    if (!ApiMetricsService.vmQueriesHistogram) {
      ApiMetricsService.vmQueriesHistogram = new Histogram({
        name: 'vm_query',
        help: 'VM Queries',
        labelNames: ['address', 'function'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.gatewayDurationHistogram) {
      ApiMetricsService.gatewayDurationHistogram = new Histogram({
        name: 'gateway_duration',
        help: 'Gateway Duration',
        labelNames: ['endpoint'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.persistenceDurationHistogram) {
      ApiMetricsService.persistenceDurationHistogram = new Histogram({
        name: 'persistence_duration',
        help: 'Persistence Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.indexerDurationHistogram) {
      ApiMetricsService.indexerDurationHistogram = new Histogram({
        name: 'indexer_duration',
        help: 'Indexer Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.graphqlDurationHistogram) {
      ApiMetricsService.graphqlDurationHistogram = new Histogram({
        name: 'query_duration',
        help: 'The time it takes to resolve a query',
        labelNames: ['query'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.currentNonceGauge) {
      ApiMetricsService.currentNonceGauge = new Gauge({
        name: 'current_nonce',
        help: 'Current nonce of the given shard',
        labelNames: ['shardId'],
      });
    }

    if (!ApiMetricsService.lastProcessedNonceGauge) {
      ApiMetricsService.lastProcessedNonceGauge = new Gauge({
        name: 'last_processed_nonce',
        help: 'Last processed nonce of the given shard',
        labelNames: ['shardId'],
      });
    }

    if (!ApiMetricsService.lastProcessedBatchProcessorNonce) {
      ApiMetricsService.lastProcessedBatchProcessorNonce = new Gauge({
        name: 'last_processed_batch_processor_nonce',
        help: 'Last processed nonce of the given shard',
        labelNames: ['shardId'],
      });
    }

    if (!ApiMetricsService.lastProcessedTransactionCompletedProcessorNonce) {
      ApiMetricsService.lastProcessedTransactionCompletedProcessorNonce = new Gauge({
        name: 'last_processed_transaction_completed_processor_nonce',
        help: 'Last processed nonce of the given shard',
        labelNames: ['shardId'],
      });
    }

    if (!ApiMetricsService.transactionsCompletedCounter) {
      ApiMetricsService.transactionsCompletedCounter = new Counter({
        name: 'websocket_transactions_completed_total',
        help: 'Total number of completed transactions processed via websocket',
      });
    }

    if (!ApiMetricsService.transactionsPendingResultsCounter) {
      ApiMetricsService.transactionsPendingResultsCounter = new Counter({
        name: 'websocket_transactions_pending_results_total',
        help: 'Total number of transactions with pending results processed via websocket',
      });
    }

    if (!ApiMetricsService.batchUpdatesCounter) {
      ApiMetricsService.batchUpdatesCounter = new Counter({
        name: 'websocket_batch_updates_total',
        help: 'Total number of batch updates processed via websocket',
      });
    }
  }

  @OnEvent(MetricsEvents.SetVmQuery)
  setVmQuery(payload: LogMetricsEvent) {
    const [address, func, duration] = payload.args;
    ApiMetricsService.vmQueriesHistogram.labels(address, func).observe(duration);
  }

  @OnEvent(MetricsEvents.SetGatewayDuration)
  setGatewayDuration(payload: LogMetricsEvent) {
    const [name, duration] = payload.args;
    ApiMetricsService.gatewayDurationHistogram.labels(name).observe(duration);
  }

  @OnEvent(MetricsEvents.SetPersistenceDuration)
  setPersistenceDuration(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('persistence', duration);
    ApiMetricsService.persistenceDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent(MetricsEvents.SetIndexerDuration)
  setIndexerDuration(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('indexer', duration);
    ApiMetricsService.indexerDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent(MetricsEvents.SetGraphqlDuration)
  setGraphqlDuration(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('graphql', duration);
    ApiMetricsService.graphqlDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent(MetricsEvents.SetLastProcessedNonce)
  setLastProcessedNonce(payload: LogMetricsEvent) {
    const [shardId, nonce] = payload.args;
    ApiMetricsService.lastProcessedNonceGauge.set({ shardId }, nonce);
  }

  @OnEvent(MetricsEvents.SetLastProcessedBatchProcessorNonce)
  setLastProcessedBatchProcessorNonce(payload: LogMetricsEvent) {
    const [shardId, nonce] = payload.args;
    ApiMetricsService.lastProcessedBatchProcessorNonce.set({ shardId }, nonce);
  }

  @OnEvent(MetricsEvents.SetLastProcessedTransactionCompletedProcessorNonce)
  setLastProcessedTransactionCompletedProcessorNonce(payload: LogMetricsEvent) {
    const [shardId, nonce] = payload.args;
    ApiMetricsService.lastProcessedTransactionCompletedProcessorNonce.set({ shardId }, nonce);
  }

  @OnEvent(MetricsEvents.SetTransactionsCompleted)
  recordTransactionsCompleted(payload: { transactions: any[] }) {
    ApiMetricsService.transactionsCompletedCounter.inc(payload.transactions.length);
  }

  @OnEvent(MetricsEvents.SetTransactionsPendingResults)
  recordTransactionsPendingResults(payload: { transactions: any[] }) {
    ApiMetricsService.transactionsPendingResultsCounter.inc(payload.transactions.length);
  }

  @OnEvent(MetricsEvents.SetBatchUpdated)
  recordBatchUpdated() {
    ApiMetricsService.batchUpdatesCounter.inc();
  }

  async getMetrics(): Promise<string> {
    const shardIds = await this.protocolService.getShardIds();
    if (this.apiConfigService.getIsTransactionProcessorCronActive()) {
      const currentNonces = await this.getCurrentNonces();
      for (const [index, shardId] of shardIds.entries()) {
        ApiMetricsService.currentNonceGauge.set({ shardId }, currentNonces[index]);
      }
    }

    const baseMetrics = await this.metricsService.getMetrics();
    const currentMetrics = await register.metrics();

    return baseMetrics + '\n' + currentMetrics;
  }

  private async getCurrentNonces(): Promise<number[]> {
    const shardIds = await this.protocolService.getShardIds();
    return await Promise.all(
      shardIds.map(shardId => this.getCurrentNonce(shardId))
    );
  }

  async getCurrentNonce(shardId: number): Promise<number> {
    const shardInfo = await this.gatewayService.getNetworkStatus(shardId);
    return shardInfo.erd_nonce;
  }
}
