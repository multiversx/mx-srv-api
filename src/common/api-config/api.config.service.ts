import { Constants } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConnectionOptions } from '../persistence/entities/connection.options';
import { LogTopic } from '@elrondnetwork/transaction-processor';
import { StatusCheckerThresholds } from './entities/status-checker-thresholds';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) { }

  getConfig<T>(configKey: string): T | undefined {
    return this.configService.get<T>(configKey);
  }

  getSelfUrl(): string {
    const selfUrl = this.configService.get<string>('urls.self');
    if (!selfUrl) {
      throw new Error('No self url present');
    }

    return selfUrl;
  }

  isGuestCacheFeatureActive(): boolean {
    return this.configService.get<boolean>('features.guestCaching.enabled') ?? false;
  }

  getGuestCacheHitsThreshold(): number {
    return this.configService.get<number>('features.guestCaching.hitsThreshold') ?? 100;
  }

  getGuestCacheTtl(): number {
    return this.configService.get<number>('features.guestCaching.ttl') ?? 12;
  }

  getVerifierUrl(): string {
    const verifierUrl = this.configService.get<string>('urls.verifier');
    if (!verifierUrl) {
      throw new Error('No verifier url present');
    }

    return verifierUrl;
  }

  getGatewayUrl(): string {
    const gatewayUrls = this.configService.get<string[]>('urls.gateway');
    if (!gatewayUrls) {
      throw new Error('No gateway urls present');
    }

    return gatewayUrls[Math.floor(Math.random() * gatewayUrls.length)];
  }

  getSnapshotlessGatewayUrl(): string | undefined {
    const gatewayUrls = this.configService.get<string[]>('urls.snapshotlessGateway') ?? this.configService.get<string[]>('urls.lightGateway');
    if (!gatewayUrls) {
      return undefined;
    }

    return gatewayUrls[Math.floor(Math.random() * gatewayUrls.length)];
  }

  getElasticUrl(): string {
    const elasticUrls = this.configService.get<string[]>('urls.elastic');
    if (!elasticUrls) {
      throw new Error('No elastic urls present');
    }

    return elasticUrls[Math.floor(Math.random() * elasticUrls.length)];
  }

  getIpfsUrl(): string {
    return this.configService.get<string>('urls.ipfs') ?? 'https://ipfs.io/ipfs';
  }

  getSocketUrl(): string {
    const url = this.configService.get<string>('urls.socket');
    if (!url) {
      throw new Error('No socket url present');
    }

    return url;
  }

  getMaiarIdUrl(): string | undefined {
    return this.configService.get<string>('urls.maiarId');
  }

  getEsdtContractAddress(): string {
    const address = this.configService.get<string>('contracts.esdt');
    if (!address) {
      throw new Error('No ESDT contract present');
    }

    return address;
  }

  getAuctionContractAddress(): string | undefined {
    return this.configService.get<string>('contracts.auction');
  }

  getStakingContractAddress(): string | undefined {
    return this.configService.get<string>('contracts.staking');
  }

  getStakingV4ActivationEpoch(): number {
    const activationEpoch = this.configService.get<number>('features.stakingV4.activationEpoch');
    if (activationEpoch === undefined) {
      throw new Error('No stakingV4 activation epoch present');
    }

    return activationEpoch;
  }

  getDelegationContractAddress(): string | undefined {
    return this.configService.get<string>('contracts.delegation');
  }

  getMetabondingContractAddress(): string | undefined {
    return this.configService.get<string>('contracts.metabonding');
  }

  getDelegationManagerContractAddress(): string {
    const address = this.configService.get<string>(
      'contracts.delegationManager',
    );
    if (!address) {
      throw new Error('No delegation manager contract present');
    }

    return address;
  }

  getVmQueryUrl(): string {
    return this.getGatewayUrl();
  }

  getRedisUrl(): string {
    const redisUrl = this.configService.get<string>('urls.redis');
    if (!redisUrl) {
      throw new Error('No redis url present');
    }

    return redisUrl;
  }

  getRabbitmqUrl(): string {
    const rabbitmqUrl = this.configService.get<string>('urls.rabbitmq');
    if (!rabbitmqUrl) {
      throw new Error('No rabbitmq url present');
    }

    return rabbitmqUrl;
  }

  getNftQueueName(): string {
    return this.configService.get<string>('features.processNfts.nftQueueName', 'api-process-nfts');
  }

  getNftQueueDlqName(): string {
    return this.configService.get<string>('features.processNfts.deadLetterQueueName', 'api-process-nfts-dlq');
  }

  getCacheTtl(): number {
    return this.configService.get<number>('caching.cacheTtl') ?? 6;
  }

  getNetwork(): string {
    const network = this.configService.get<string>('network');
    if (!network) {
      throw new Error('No network present');
    }

    return network;
  }

  getDappNetwork(): string {
    const network = this.configService.get<string>('dappNetwork');
    if (!network) {
      return this.getNetwork();
    }

    return network;
  }

  getCluster(): string | undefined {
    return this.configService.get<string>('cluster');
  }

  getPoolLimit(): number {
    return this.configService.get<number>('caching.poolLimit') ?? 100;
  }

  getProcessTtl(): number {
    return this.configService.get<number>('caching.processTtl') ?? 60;
  }

  getAxiosTimeout(): number {
    return this.configService.get<number>('keepAliveTimeout.downstream') ?? 61000;
  }

  getServerTimeout(): number {
    return this.configService.get<number>('keepAliveTimeout.upstream') ?? 60000;
  }

  getHeadersTimeout(): number {
    return this.getServerTimeout() + 1000;
  }

  getUseRequestCachingFlag(): boolean {
    return this.configService.get<boolean>('flags.useRequestCaching') ?? true;
  }

  getUseRequestLoggingFlag(): boolean {
    return this.configService.get<boolean>('flags.useRequestLogging') ?? false;
  }

  getUseKeepAliveAgentFlag(): boolean {
    return this.configService.get<boolean>('flags.useKeepAliveAgent') ?? true;
  }

  getUseTracingFlag(): boolean {
    return this.configService.get<boolean>('flags.useTracing') ?? false;
  }

  getUseVmQueryTracingFlag(): boolean {
    return this.configService.get<boolean>('flags.useVmQueryTracing') ?? false;
  }

  getCollectionPropertiesFromGateway(): boolean {
    return this.configService.get<boolean>('flags.collectionPropertiesFromGateway') ?? false;
  }

  getProvidersUrl(): string {
    const providerUrl = this.configService.get<string>('urls.providers');
    if (providerUrl) {
      return providerUrl;
    }

    const delegationUrl = this.configService.get<string>('urls.delegation');
    if (delegationUrl) {
      return delegationUrl + '/providers';
    }

    throw new Error('No providers url present');
  }

  getDelegationUrl(): string {
    const delegationUrl = this.configService.get<string>('urls.delegation');
    if (!delegationUrl) {
      throw new Error('No delegation url present');
    }

    return delegationUrl;
  }

  getTempUrl(): string {
    const tmpUrl = this.configService.get<string>('urls.tmp');
    if (!tmpUrl) {
      throw new Error("No tmp url present");
    }

    return tmpUrl;
  }

  getIsTransactionProcessorCronActive(): boolean {
    return this.configService.get<boolean>('features.transactionProcessor.enabled') ?? this.configService.get<boolean>('cron.transactionProcessor') ?? false;
  }

  getTransactionProcessorMaxLookBehind(): number {
    return this.configService.get<number>('features.transactionProcessor.maxLookBehind') ?? this.configService.get<number>('cron.transactionProcessorMaxLookBehind') ?? 100;
  }

  getIsTransactionCompletedCronActive(): boolean {
    return this.configService.get<boolean>('features.transactionCompleted.enabled') ?? this.configService.get<boolean>('cron.transactionCompleted') ?? false;
  }

  getTransactionCompletedMaxLookBehind(): number {
    return this.configService.get<number>('features.transactionCompleted.maxLookBehind') ?? this.configService.get<number>('cron.transactionCompletedMaxLookBehind') ?? 100;
  }

  getTransactionCompletedLogLevel(): LogTopic {
    return this.configService.get<LogTopic>('features.transactionCompleted.logLevel') ?? LogTopic.CrossShardSmartContractResult;
  }

  getIsTransactionBatchCronActive(): boolean {
    return this.configService.get<boolean>('features.transactionBatch.enabled') ?? this.configService.get<boolean>('cron.transactionBatch') ?? false;
  }

  getTransactionBatchMaxLookBehind(): number {
    return this.configService.get<number>('features.transactionBatch.maxLookBehind') ?? this.configService.get<number>('cron.transactionBatchMaxLookBehind') ?? 100;
  }

  getIsCacheWarmerCronActive(): boolean {
    const isCronActive = this.configService.get<boolean>('cron.cacheWarmer');
    if (isCronActive === undefined) {
      throw new Error('No cron.cacheWarmer flag present');
    }

    return isCronActive;
  }

  getIsApiStatusCheckerActive(): boolean {
    return this.configService.get<boolean>('features.statusChecker.enabled') ?? this.configService.get<boolean>('cron.statusChecker') ?? false;
  }

  getStatusCheckerThresholds(): StatusCheckerThresholds {
    const thresholds = this.configService.get<StatusCheckerThresholds>('features.statusChecker.thresholds');
    return new StatusCheckerThresholds(thresholds);
  }

  getIsElasticUpdaterCronActive(): boolean {
    return this.configService.get<boolean>('cron.elasticUpdater') ?? false;
  }

  getIsNftScamInfoEnabled(): boolean {
    return this.configService.get<boolean>('features.nftScamInfo.enabled') ?? false;
  }

  getIsQueueWorkerCronActive(): boolean {
    const isQueueWorkerActive = this.configService.get<boolean>('cron.queueWorker');
    if (isQueueWorkerActive === undefined) {
      throw new Error('No queue worker cron flag present');
    }

    return isQueueWorkerActive;
  }

  getIsFastWarmerCronActive(): boolean {
    const isCronActive = this.configService.get<boolean>('cron.fastWarm');
    if (isCronActive === undefined) {
      return false;
    }

    return isCronActive;
  }

  isEventsNotifierFeatureActive(): boolean {
    const isEventsNotifierActive = this.configService.get<boolean>('features.eventsNotifier.enabled');
    if (isEventsNotifierActive === undefined) {
      return false;
    }

    return isEventsNotifierActive;
  }

  getEventsNotifierFeaturePort(): number {
    const eventsNotifierPort = this.configService.get<number>('features.eventsNotifier.port');
    if (eventsNotifierPort === undefined) {
      throw new Error('No events notifier port present');
    }

    return eventsNotifierPort;
  }

  getEventsNotifierUrl(): string {
    const url = this.configService.get<string>('features.eventsNotifier.url');
    if (!url) {
      throw new Error('No events notifier url present');
    }

    return url;
  }

  getEventsNotifierExchange(): string {
    const exchange = this.configService.get<string>('features.eventsNotifier.exchange');
    if (!exchange) {
      throw new Error('No events notifier exchange present');
    }

    return exchange;
  }

  getIsProcessNftsFlagActive(): boolean {
    return this.configService.get<boolean>('features.processNfts.enabled') ?? this.configService.get<boolean>('flags.processNfts') ?? false;
  }

  getIsPublicApiActive(): boolean {
    const isApiActive = this.configService.get<boolean>('api.public');
    if (isApiActive === undefined) {
      throw new Error('No api.public flag present');
    }

    return isApiActive;
  }

  getPublicApiPort(): number {
    return this.configService.get<number>('api.publicPort') ?? 3001;
  }

  getIsPrivateApiActive(): boolean {
    const isApiActive = this.configService.get<boolean>('api.private');
    if (isApiActive === undefined) {
      throw new Error('No api.private flag present');
    }

    return isApiActive;
  }

  getIsWebsocketApiActive(): boolean {
    return this.configService.get<boolean>('api.websocket') ?? true;
  }

  getPrivateApiPort(): number {
    return this.configService.get<number>('api.privatePort') ?? 4001;
  }

  getIsAuthActive(): boolean {
    return this.configService.get<boolean>('features.auth.enabled') ?? this.configService.get<boolean>('api.auth') ?? false;
  }

  getDatabaseType(): string {
    const databaseType = this.configService.get<string>('database.type');
    if (!databaseType) {
      throw new Error('No database.type present');
    }

    return databaseType;
  }

  getDatabaseHost(): string {
    const databaseHost = this.configService.get<string>('database.host');
    if (!databaseHost) {
      throw new Error('No database.host present');
    }

    return databaseHost;
  }

  getDatabasePort(): number {
    const databasePort = this.configService.get<number>('database.port');
    if (!databasePort) {
      throw new Error('No database.port present');
    }

    return databasePort;
  }


  getDatabaseUsername(): string | undefined {
    const databaseUsername = this.configService.get<string>('database.username');

    return databaseUsername;
  }

  getDatabasePassword(): string | undefined {
    const databasePassword = this.configService.get<string>('database.password');

    return databasePassword;
  }

  getDatabaseName(): string {
    const databaseName = this.configService.get<string>('database.database');
    if (!databaseName) {
      throw new Error('No database.database present');
    }

    return databaseName;
  }

  getDatabaseUrl(): string {
    const databaseUrl = this.configService.get<string>('database.url');
    if (!databaseUrl) {
      throw new Error('No database.url present');
    }

    return databaseUrl;
  }

  getDatabaseConnection(): any {
    return {
      host: this.getDatabaseHost(),
      port: this.getDatabasePort(),
      username: this.getDatabaseUsername(),
      password: this.getDatabasePassword(),
      database: this.getDatabaseName(),
    };
  }

  getDatabaseSlaveConnections(): DatabaseConnectionOptions[] {
    const slaves = this.configService.get<DatabaseConnectionOptions[]>('database.slaves');
    if (!slaves) {
      return [];
    }

    return slaves;
  }

  getImageWidth(): number {
    const imageWidth = this.configService.get<number>('image.width');
    if (!imageWidth) {
      throw new Error('No imageWidth present');
    }

    return imageWidth;
  }

  getImageHeight(): number {
    const imageHeight = this.configService.get<number>('image.height');
    if (!imageHeight) {
      throw new Error('No imageHeight present');
    }

    return imageHeight;
  }

  getImageType(): string {
    const imageType = this.configService.get<string>('image.type');
    if (!imageType) {
      throw new Error('No imageType present');
    }

    return imageType;
  }

  getAwsS3KeyId(): string {
    const s3KeyId = this.configService.get<string>('aws.s3KeyId');
    if (!s3KeyId) {
      throw new Error('No s3KeyId present');
    }

    return s3KeyId;
  }

  getAwsS3Secret(): string {
    const s3Secret = this.configService.get<string>('aws.s3Secret');
    if (!s3Secret) {
      throw new Error('No s3Secret present');
    }

    return s3Secret;
  }

  getAwsS3Bucket(): string {
    const s3Bucket = this.configService.get<string>('aws.s3Bucket');
    if (!s3Bucket) {
      throw new Error('No s3Bucket present');
    }

    return s3Bucket;
  }

  getAwsS3Region(): string {
    const s3Region = this.configService.get<string>('aws.s3Region');
    if (!s3Region) {
      throw new Error('No s3Region present');
    }

    return s3Region;
  }

  getMetaChainShardId(): number {
    const metaChainShardId = this.configService.get<number>('metaChainShardId');
    if (metaChainShardId === undefined) {
      throw new Error('No metaChainShardId present');
    }

    return metaChainShardId;
  }

  getRateLimiterSecret(): string | undefined {
    return this.configService.get<string>('rateLimiterSecret');
  }

  getInflationAmounts(): number[] {
    const inflationAmounts = this.configService.get<number[]>('inflation');
    if (!inflationAmounts) {
      throw new Error('No inflation amounts present');
    }

    return inflationAmounts;
  }

  getMediaUrl(): string {
    const mediaUrl = this.configService.get<string>('urls.media');
    if (!mediaUrl) {
      throw new Error('No media url present');
    }

    return mediaUrl;
  }

  getMediaInternalUrl(): string | undefined {
    return this.configService.get<string>('urls.mediaInternal');
  }

  getExternalMediaUrl(): string {
    const mediaUrl = this.getMediaUrl();
    if (mediaUrl.endsWith('.')) {
      return mediaUrl.substring(0, mediaUrl.length - 1);
    }

    return mediaUrl;
  }

  getNftThumbnailsUrl(): string {
    const nftThumbnailsUrl = this.configService.get<string>('urls.nftThumbnails');
    if (!nftThumbnailsUrl) {
      throw new Error('No nft thumbnails url present');
    }

    return nftThumbnailsUrl;
  }

  getSecurityAdmins(): string[] {
    const admins = this.configService.get<string[]>('features.auth.admins') ?? this.configService.get<string[]>('security.admins');
    if (admins === undefined) {
      throw new Error('No security admins value present');
    }

    return admins;
  }

  getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('features.auth.jwtSecret') ?? this.configService.get<string>('security.jwtSecret');
    if (!jwtSecret) {
      throw new Error('No jwtSecret present');
    }

    return jwtSecret;
  }

  getMockKeybases(): boolean | undefined {
    return this.configService.get<boolean>('test.mockKeybases');
  }

  getMockNodes(): boolean | undefined {
    return this.configService.get<boolean>('test.mockNodes');
  }

  getMockTokens(): boolean | undefined {
    return this.configService.get<boolean>('test.mockTokens');
  }

  getMockPath(): string | undefined {
    const mockPath = this.configService.get<string>('test.mockPath');
    if (mockPath === undefined) {
      throw new Error('No mock path value present');
    }

    return mockPath;
  }

  getNftProcessParallelism(): number {
    return this.configService.get<number>('nftProcess.parallelism') ?? 1;
  }

  getNftProcessMaxRetries(): number {
    return this.configService.get<number>('nftProcess.maxRetries') ?? 3;
  }

  private isExchangeEnabledInternal(): boolean {
    return this.configService.get<boolean>('features.exchange.enabled') ?? false;
  }

  private getExchangeServiceUrlLegacy(): string | undefined {
    return this.configService.get<string>('transaction-action.mex.microServiceUrl') ?? this.configService.get<string>('plugins.transaction-action.mex.microServiceUrl');
  }

  isExchangeEnabled(): boolean {
    const isExchangeEnabled = this.isExchangeEnabledInternal();
    if (isExchangeEnabled) {
      return true;
    }

    const legacyUrl = this.getExchangeServiceUrlLegacy();
    if (legacyUrl) {
      return true;
    }

    return false;
  }

  getExchangeServiceUrl(): string | undefined {
    const isExchangeEnabled = this.isExchangeEnabledInternal();
    if (isExchangeEnabled) {
      return this.configService.get<string>('features.exchange.serviceUrl');
    }

    const legacyUrl = this.getExchangeServiceUrlLegacy();
    if (legacyUrl) {
      return legacyUrl;
    }

    return undefined;
  }

  getExchangeServiceUrlMandatory(): string {
    const microServiceUrl = this.getExchangeServiceUrl();
    if (!microServiceUrl) {
      throw new Error('No exchange service url present');
    }

    return microServiceUrl;
  }

  getGithubToken(): string | undefined {
    return this.configService.get<string>('github.token');
  }

  isTransactionPoolEnabled(): boolean {
    return this.configService.get<boolean>('features.transactionPool.enabled') ?? false;
  }

  isTransactionPoolCacheWarmerEnabled(): boolean {
    return this.configService.get<boolean>('features.transactionPoolWarmer.enabled') ?? false;
  }

  isUpdateAccountExtraDetailsEnabled(): boolean {
    return this.configService.get<boolean>('features.updateAccountExtraDetails.enabled') ?? false;
  }

  getAccountExtraDetailsTransfersLast24hUrl(): string | undefined {
    return this.configService.get<string>('features.updateAccountExtraDetails.transfersLast24hUrl');
  }

  getTransactionPoolCacheWarmerCronExpression(): string {
    const cronExpression = this.configService.get<string>('features.transactionPoolWarmer.cronExpression');
    if (!cronExpression) {
      throw new Error('No transaction pool cron expression present');
    }
    return cronExpression;
  }

  getTransactionPoolCacheWarmerTtlInSeconds(): number {
    return this.configService.get<number>('features.transactionPoolWarmer.ttlInSeconds') ?? 6;
  }

  isStakingV4Enabled(): boolean {
    return this.configService.get<boolean>('features.stakingV4.enabled') ?? false;
  }

  getStakingV4CronExpression(): string {
    const cronExpression = this.configService.get<string>('features.stakingV4.cronExpression');
    if (!cronExpression) {
      throw new Error('No staking V4 cron expression present');
    }

    return cronExpression;
  }

  isTpsEnabled(): boolean {
    return this.configService.get<boolean>('features.tps.enabled') ?? false;
  }

  getTpsMaxLookBehindNonces(): number {
    return this.configService.get<number>('features.tps.maxLookBehindNonces') ?? 100;
  }

  isNftExtendedAttributesEnabled(): boolean {
    return this.configService.get<boolean>('features.nftExtendedAttributes.enabled') ?? false;
  }

  getNftExtendedAttributesNsfwThreshold(): number {
    return this.configService.get<number>('features.nftExtendedAttributes.nsfwThreshold') ?? 0.85;
  }

  isNodeEpochsLeftEnabled(): boolean {
    return this.configService.get<boolean>('features.nodeEpochsLeft.enabled') ?? false;
  }

  getIndexerSlaveConnections(): DatabaseConnectionOptions[] {
    const slaves = this.configService.get<DatabaseConnectionOptions[]>('indexer.slaves');
    if (!slaves) {
      return [];
    }
    return slaves;
  }

  private getIndexerHost(): string {
    const indexerHost = this.configService.get<string>('indexer.host');
    if (!indexerHost) {
      throw new Error('No indexer.host present');
    }
    return indexerHost;
  }

  private getIndexerPort(): number {
    const indexerPort = this.configService.get<number>('indexer.port');
    if (!indexerPort) {
      throw new Error('No indexer.port present');
    }
    return indexerPort;
  }

  private getIndexerUsername(): string | undefined {
    const indexerUsername = this.configService.get<string>('indexer.username');
    return indexerUsername;
  }

  private getIndexerPassword(): string | undefined {
    const indexerPassword = this.configService.get<string>('indexer.password');
    return indexerPassword;
  }

  private getIndexerName(): string {
    const indexerName = this.configService.get<string>('indexer.database');
    if (!indexerName) {
      throw new Error('No indexer.database present');
    }
    return indexerName;
  }

  getIndexerConnection(): any {
    return {
      host: this.getIndexerHost(),
      port: this.getIndexerPort(),
      username: this.getIndexerUsername(),
      password: this.getIndexerPassword(),
      database: this.getIndexerName(),
    };
  }

  getIndexerMaxPagination(): number {
    return this.configService.get<number>('indexer.maxPagination') ?? 10000;
  }

  isNodeSyncProgressEnabled(): boolean {
    return this.configService.get<boolean>('features.nodeSyncProgress.enabled') ?? false;
  }

  isUpdateCollectionExtraDetailsEnabled(): boolean {
    return this.configService.get<boolean>('features.updateCollectionExtraDetails.enabled') ?? false;
  }

  isMarketplaceFeatureEnabled(): boolean {
    return this.configService.get<boolean>('features.marketplace.enabled') ?? false;
  }

  getMarketplaceServiceUrl(): string {
    const serviceUrl = this.configService.get<string>('features.marketplace.serviceUrl');
    if (!serviceUrl) {
      throw new Error('No marketplace service url present');
    }

    return serviceUrl;
  }

  getNativeAuthAcceptedOrigins(): string[] {
    return this.configService.get<string[]>('features.auth.acceptedOrigins') ?? [''];
  }

  getNativeAuthMaxExpirySeconds(): number {
    return this.configService.get<number>('features.auth.maxExpirySeconds') ?? Constants.oneDay();
  }

  isDataApiFeatureEnabled(): boolean {
    return this.configService.get<boolean>('features.dataApi.enabled') ?? false;
  }

  getDataApiServiceUrl(): string {
    const serviceUrl = this.configService.get<string>('features.dataApi.serviceUrl');
    if (!serviceUrl) {
      throw new Error('No data-api service url present');
    }

    return serviceUrl;
  }

  isDeepHistoryGatewayEnabled(): boolean {
    return this.configService.get<boolean>('features.deepHistory.enabled') ?? false;
  }

  getDeepHistoryGatewayUrl(): string {
    const deepHistoryUrl = this.configService.get<string>('features.deepHistory.url');
    if (!deepHistoryUrl) {
      throw new Error('No deep history url present');
    }

    return deepHistoryUrl;
  }

  isAssetsCdnFeatureEnabled(): boolean {
    return this.configService.get<boolean>('features.assetsFetch.enabled') ?? false;
  }

  getAssetsCdnUrl(): string {
    return this.configService.get<string>('features.assetsFetch.assetesUrl') ?? 'https://tools.multiversx.com/assets-cdn';
  }

  isTokensFetchFeatureEnabled(): boolean {
    return this.configService.get<boolean>('features.tokensFetch.enabled') ?? false;
  }

  getTokensFetchServiceUrl(): string {
    const serviceUrl = this.configService.get<string>('features.tokensFetch.serviceUrl');
    if (!serviceUrl) {
      throw new Error('No tokens fetch service url present');
    }

    return serviceUrl;
  }

  isNodesFetchFeatureEnabled(): boolean {
    return this.configService.get<boolean>('features.nodesFetch.enabled') ?? false;
  }

  getNodesFetchServiceUrl(): string {
    const serviceUrl = this.configService.get<string>('features.nodesFetch.serviceUrl');
    if (!serviceUrl) {
      throw new Error('No nodes fetch service url present');
    }

    return serviceUrl;
  }

  isProvidersFetchFeatureEnabled(): boolean {
    return this.configService.get<boolean>('features.providersFetch.enabled') ?? false;
  }

  getProvidersFetchServiceUrl(): string {
    const serviceUrl = this.configService.get<string>('features.providersFetch.serviceUrl');
    if (!serviceUrl) {
      throw new Error('No providers fetch service url present');
    }

    return serviceUrl;
  }

  getCacheDuration(): number {
    return this.configService.get<number>('caching.cacheDuration') ?? 3;
  }
}
