import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PublicAppModule } from './public.app.module';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ApiConfigService } from './common/api-config/api.config.service';
import { PrivateAppModule } from './private.app.module';
import { CacheWarmerModule } from './crons/cache.warmer/cache.warmer.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { INestApplication, Logger, NestInterceptor } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as requestIp from 'request-ip';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RedisClient } from 'redis';
import { TransactionProcessorModule } from './crons/transaction.processor/transaction.processor.module';
import { PubSubListenerModule } from './common/pubsub/pub.sub.listener.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NftQueueModule } from './queue.worker/nft.worker/queue/nft.queue.module';
import { ElasticUpdaterModule } from './crons/elastic.updater/elastic.updater.module';
import { PluginService } from './common/plugins/plugin.service';
import { TransactionCompletedModule } from './crons/transaction.processor/transaction.completed.module';
import { SocketAdapter } from './common/websockets/socket-adapter';
import { ApiConfigModule } from './common/api-config/api.config.module';
import { CacheService, CachingInterceptor, GuestCacheInterceptor, GuestCacheService } from '@multiversx/sdk-nestjs-cache';
import { LoggerInitializer } from '@multiversx/sdk-nestjs-common';
import { MetricsService, RequestCpuTimeInterceptor, LoggingInterceptor, LogRequestsInterceptor } from '@multiversx/sdk-nestjs-monitoring';
import { FieldsInterceptor, ExtractInterceptor, CleanupInterceptor, PaginationInterceptor, QueryCheckInterceptor, ComplexityInterceptor, OriginInterceptor, ExcludeFieldsInterceptor } from '@multiversx/sdk-nestjs-http';
import { MxnestConfigServiceImpl } from './common/api-config/mxnest-config-service-impl.service';
import { RabbitMqModule } from './common/rabbitmq/rabbitmq.module';
import { TransactionLoggingInterceptor } from './interceptors/transaction.logging.interceptor';
import { BatchTransactionProcessorModule } from './crons/transaction.processor/batch.transaction.processor.module';
import { SettingsService } from './common/settings/settings.service';
import { StatusCheckerModule } from './crons/status.checker/status.checker.module';
import { JwtOrNativeAuthGuard } from '@multiversx/sdk-nestjs-auth';
import { WebSocketPublisherModule } from './common/websockets/web-socket-publisher-module';
import { IndexerService } from './common/indexer/indexer.service';
import { NotWritableError } from './common/indexer/entities/not.writable.error';
import { ResponseTimeCpuInterceptor } from './interceptors/response-time.cpu.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrapper');

  // @ts-ignore
  LoggerInitializer.initialize(logger);

  const apiConfigApp = await NestFactory.create(ApiConfigModule);
  const apiConfigService = apiConfigApp.get<ApiConfigService>(ApiConfigService);

  if (apiConfigService.getUseTracingFlag() === true) {
    require('dd-trace').init();
  }

  if (apiConfigService.getIsPublicApiActive()) {
    const publicApp = await NestFactory.create<NestExpressApplication>(PublicAppModule);

    await configurePublicApp(publicApp, apiConfigService);

    await publicApp.listen(apiConfigService.getPublicApiPort());

    if (apiConfigService.getIsWebsocketApiActive()) {
      const websocketPublisherApp = await NestFactory.createMicroservice<MicroserviceOptions>(
        WebSocketPublisherModule,
        {
          transport: Transport.REDIS,
          options: {
            host: apiConfigService.getRedisUrl(),
            port: 6379,
            retryAttempts: 100,
            retryDelay: 1000,
            retryStrategy: () => 1000,
          },
        },
      );
      websocketPublisherApp.useWebSocketAdapter(new SocketAdapter(websocketPublisherApp));
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      websocketPublisherApp.listen();
    }
  }

  if (apiConfigService.getIsPrivateApiActive()) {
    const privateApp = await NestFactory.create(PrivateAppModule);
    await privateApp.listen(apiConfigService.getPrivateApiPort());
  }

  if (apiConfigService.getIsTransactionProcessorCronActive()) {
    const processorApp = await NestFactory.create(TransactionProcessorModule);
    await processorApp.listen(5001);
  }

  if (apiConfigService.getIsCacheWarmerCronActive()) {
    const cacheWarmerApp = await NestFactory.create(CacheWarmerModule);
    await configureCacheWarmerApp(cacheWarmerApp, apiConfigService);
    await cacheWarmerApp.listen(6001);
  }

  if (apiConfigService.getIsTransactionCompletedCronActive()) {
    const processorApp = await NestFactory.create(TransactionCompletedModule);
    await processorApp.listen(7001);
  }

  if (apiConfigService.getIsTransactionBatchCronActive()) {
    const processorApp = await NestFactory.create(BatchTransactionProcessorModule);
    await processorApp.listen(7002);
  }

  if (apiConfigService.getIsElasticUpdaterCronActive()) {
    const elasticUpdaterApp = await NestFactory.create(ElasticUpdaterModule);
    await elasticUpdaterApp.listen(8001);
  }

  if (apiConfigService.getIsApiStatusCheckerActive()) {
    const cacheApiStatusChecker = await NestFactory.create(StatusCheckerModule);
    await cacheApiStatusChecker.listen(9001);
  }

  if (apiConfigService.getIsQueueWorkerCronActive()) {
    const queueWorkerApp = await NestFactory.createMicroservice<MicroserviceOptions>(NftQueueModule, {
      transport: Transport.RMQ,
      options: {
        urls: [apiConfigService.getRabbitmqUrl()],
        queue: apiConfigService.getNftQueueName(),
        noAck: false,
        prefetchCount: apiConfigService.getNftProcessParallelism(),
        queueOptions: {
          durable: true,
          // arguments: {
          //   'x-single-active-consumer': true,
          // },
          deadLetterExchange: apiConfigService.getNftQueueDlqName(),
        },
      },
    });
    await queueWorkerApp.listen();
  }

  if (apiConfigService.isEventsNotifierFeatureActive()) {
    const eventsNotifierApp = await NestFactory.create(RabbitMqModule.register());
    await eventsNotifierApp.listen(apiConfigService.getEventsNotifierFeaturePort());
  }

  const pubSubApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    PubSubListenerModule,
    {
      transport: Transport.REDIS,
      options: {
        host: apiConfigService.getRedisUrl(),
        port: 6379,
        retryAttempts: 100,
        retryDelay: 1000,
        retryStrategy: () => 1000,
      },
    },
  );
  pubSubApp.useLogger(pubSubApp.get(WINSTON_MODULE_NEST_PROVIDER));
  pubSubApp.useWebSocketAdapter(new SocketAdapter(pubSubApp));
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pubSubApp.listen();

  logger.log(`Public API active: ${apiConfigService.getIsPublicApiActive()}`);
  logger.log(`Private API active: ${apiConfigService.getIsPrivateApiActive()}`);
  logger.log(`Transaction processor cron active: ${apiConfigService.getIsTransactionProcessorCronActive()}`);
  logger.log(`Transaction completed cron active: ${apiConfigService.getIsTransactionCompletedCronActive()}`);
  logger.log(`Transaction batch cron active: ${apiConfigService.getIsTransactionBatchCronActive()}`);
  logger.log(`Cache warmer active: ${apiConfigService.getIsCacheWarmerCronActive()}`);
  logger.log(`Queue worker active: ${apiConfigService.getIsQueueWorkerCronActive()}`);
  logger.log(`Elastic updater active: ${apiConfigService.getIsElasticUpdaterCronActive()}`);
  logger.log(`Events notifier feature active: ${apiConfigService.isEventsNotifierFeatureActive()}`);
  logger.log(`Exchange feature active: ${apiConfigService.isExchangeEnabled()}`);
  logger.log(`Marketplace feature active: ${apiConfigService.isMarketplaceFeatureEnabled()}`);
  logger.log(`Auth active: ${apiConfigService.getIsAuthActive()}`);

  logger.log(`Use tracing: ${apiConfigService.getUseTracingFlag()}`);
  logger.log(`Process NFTs flag: ${apiConfigService.getIsProcessNftsFlagActive()}`);
  logger.log(`Staking v4 enabled: ${apiConfigService.isStakingV4Enabled()}`);
  logger.log(`Events notifier enabled: ${apiConfigService.isEventsNotifierFeatureActive()}`);
  logger.log(`Guest caching enabled: ${apiConfigService.isGuestCacheFeatureActive()}`);
  logger.log(`Transaction pool enabled: ${apiConfigService.isTransactionPoolEnabled()}`);
  logger.log(`Transaction pool cache warmer enabled: ${apiConfigService.isTransactionPoolCacheWarmerEnabled()}`);
}

async function configurePublicApp(publicApp: NestExpressApplication, apiConfigService: ApiConfigService) {
  publicApp.use(bodyParser.json({ limit: '1mb' }));
  publicApp.use(requestIp.mw());
  publicApp.enableCors();
  publicApp.useLogger(publicApp.get(WINSTON_MODULE_NEST_PROVIDER));
  publicApp.disable('etag');
  publicApp.disable('x-powered-by');
  publicApp.useStaticAssets(join(__dirname, 'public/assets'));

  const metricsService = publicApp.get<MetricsService>(MetricsService);
  const pluginService = publicApp.get<PluginService>(PluginService);
  const httpAdapterHostService = publicApp.get<HttpAdapterHost>(HttpAdapterHost);
  const cachingService = publicApp.get<CacheService>(CacheService);
  const settingsService = publicApp.get<SettingsService>(SettingsService);

  if (apiConfigService.getIsAuthActive()) {
    publicApp.useGlobalGuards(new JwtOrNativeAuthGuard(new MxnestConfigServiceImpl(apiConfigService), cachingService));
  }

  const httpServer = httpAdapterHostService.httpAdapter.getHttpServer();
  httpServer.keepAliveTimeout = apiConfigService.getServerTimeout();
  httpServer.headersTimeout = apiConfigService.getHeadersTimeout(); //`keepAliveTimeout + server's expected response time`

  const globalInterceptors: NestInterceptor[] = [];
  // @ts-ignore
  globalInterceptors.push(new QueryCheckInterceptor(httpAdapterHostService));

  if (apiConfigService.isGuestCacheFeatureActive()) {
    const guestCacheService = publicApp.get<GuestCacheService>(GuestCacheService);
    // @ts-ignore
    globalInterceptors.push(new GuestCacheInterceptor(guestCacheService, {
      ignoreAuthorizationHeader: true,
    }));
  }

  // @ts-ignore
  globalInterceptors.push(new OriginInterceptor());
  // @ts-ignore
  globalInterceptors.push(new ComplexityInterceptor());
  // @ts-ignore
  globalInterceptors.push(new RequestCpuTimeInterceptor(metricsService));
  // @ts-ignore
  globalInterceptors.push(new LoggingInterceptor(metricsService));
  //@ts-ignore
  globalInterceptors.push(new ResponseTimeCpuInterceptor(metricsService, { shouldLog: true }));

  const getUseRequestCachingFlag = await settingsService.getUseRequestCachingFlag();
  const cacheDuration = apiConfigService.getCacheDuration();
  if (getUseRequestCachingFlag) {
    const cachingInterceptor = new CachingInterceptor(
      cachingService,
      // @ts-ignore
      httpAdapterHostService,
      metricsService,
      cacheDuration
    );

    // @ts-ignore
    globalInterceptors.push(cachingInterceptor);
  }

  // @ts-ignore
  globalInterceptors.push(new ExcludeFieldsInterceptor());

  // @ts-ignore
  globalInterceptors.push(new FieldsInterceptor());

  const getUseRequestLoggingFlag = await settingsService.getUseRequestLoggingFlag();
  if (getUseRequestLoggingFlag) {
    // @ts-ignore
    globalInterceptors.push(new LogRequestsInterceptor(httpAdapterHostService));
  }

  // @ts-ignore
  globalInterceptors.push(new ExtractInterceptor());
  // @ts-ignore
  globalInterceptors.push(new CleanupInterceptor());
  // @ts-ignore
  globalInterceptors.push(new PaginationInterceptor(apiConfigService.getIndexerMaxPagination()));
  // @ts-ignore
  globalInterceptors.push(new TransactionLoggingInterceptor());

  await pluginService.bootstrapPublicApp(publicApp);

  publicApp.useGlobalInterceptors(...globalInterceptors);
  const description = readFileSync(
    join(__dirname, '..', 'docs', 'swagger.md'),
    'utf8',
  );

  const documentBuilder = new DocumentBuilder()
    .setTitle('Multiversx API')
    .setDescription(description)
    .setVersion('1.8.0')
    .setExternalDoc('Find out more about Multiversx API', 'https://docs.multiversx.com/sdk-and-tools/rest-api/rest-api/');

  const config = documentBuilder.build();
  const options = {
    customSiteTitle: 'Multiversx API',
    customCss: `.topbar-wrapper img
          {
            content:url(\'/img/mvx-ledger-icon-mint.png\'); width:100px; height:auto;
          }
          .swagger-ui .topbar { background-color: #FAFAFA; }
          .swagger-ui .scheme-container {background-color: #FAFAFA;}`,


    customfavIcon: '/img/mvx-ledger-icon-mint.png',
    swaggerOptions: {
      filter: true,
      displayRequestDuration: true,
    },
  };

  const document = SwaggerModule.createDocument(publicApp, config);
  SwaggerModule.setup('docs', publicApp, document, options);
  SwaggerModule.setup('', publicApp, document, options);

  const logger = new Logger('Public App initializer');
  logger.log(`Use request caching: ${await settingsService.getUseRequestCachingFlag()}`);
  logger.log(`Use request logging: ${await settingsService.getUseRequestLoggingFlag()}`);
  logger.log(`Use vm query tracing: ${await settingsService.getUseVmQueryTracingFlag()}`);
}

async function configureCacheWarmerApp(cacheWarmerApp: INestApplication<any>, apiConfigService: ApiConfigService): Promise<void> {
  const indexerService = cacheWarmerApp.get<IndexerService>(IndexerService);
  const logger = new Logger('Cache warmer initializer');

  try {
    if (apiConfigService.isUpdateAccountExtraDetailsEnabled()) {
      await indexerService.ensureAccountsWritable();
    }

    if (apiConfigService.isUpdateCollectionExtraDetailsEnabled()) {
      await indexerService.ensureTokensWritable();
    }
  } catch (error) {
    if (error instanceof NotWritableError) {
      logger.error(error.message);
    } else {
      logger.error(`An unhandled error occurred while ensuring database schema is writable`);
      logger.error(error);
    }

    process.kill(process.pid, 'SIGTERM');
  }

  logger.log(`Update account extra details: ${apiConfigService.isUpdateAccountExtraDetailsEnabled()}`);
  logger.log(`Update collection extra details: ${apiConfigService.isUpdateCollectionExtraDetailsEnabled()}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

RedisClient.prototype.on_error = function (err: any) {
  if (this.closing) {
    return;
  }

  err.message =
    'Redis connection to ' + this.address + ' failed - ' + err.message;
  // debug(err.message);
  this.connected = false;
  this.ready = false;

  // Only emit the error if the retry_strategy option is not set
  if (!this.options.retry_strategy) {
    // this.emit('error', err);
  }
  // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
  // then we should try to reconnect.
  this.connection_gone('error', err);
};
