import { CacheModule, Module } from '@nestjs/common';
import { AccountController } from './endpoints/accounts/account.controller';
import { AccountService } from './endpoints/accounts/account.service';
import { ApiConfigService } from './common/api.config.service';
import { NetworkController } from './endpoints/network/network.controller';
import { NetworkService } from './endpoints/network/network.service';
import { TransactionController } from './endpoints/transactions/transaction.controller';
import { TransactionService } from './endpoints/transactions/transaction.service';
import { TokenController } from './endpoints/tokens/token.controller';
import { NftController } from './endpoints/nfts/nft.controller';
import { TokenService } from './endpoints/tokens/token.service';
import { BlockService } from './endpoints/blocks/block.service';
import { BlockController } from './endpoints/blocks/block.controller';
import { MiniBlockService } from './endpoints/miniblocks/mini.block.service';
import { MiniBlockController } from './endpoints/miniblocks/mini.block.controller';
import { RoundService } from './endpoints/rounds/round.service';
import { RoundController } from './endpoints/rounds/round.controller';
import { NodeController } from './endpoints/nodes/node.controller';
import { NodeService } from './endpoints/nodes/node.service';
import { VmQueryService } from './endpoints/vm.query/vm.query.service';
import { ProviderService } from './endpoints/providers/provider.service';
import { ProviderController } from './endpoints/providers/provider.controller';
import { StakeService } from './endpoints/stake/stake.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { DelegationLegacyService } from './endpoints/delegation.legacy/delegation.legacy.service';
import { DelegationLegacyController } from './endpoints/delegation.legacy/delegation.legacy.controller';
import { StakeController } from './endpoints/stake/stake.controller';
import { DelegationController } from './endpoints/delegation/delegation.controller';
import { DelegationService } from './endpoints/delegation/delegation.service';
import { VmQueryController } from './endpoints/vm.query/vm.query.controller';
import { CachingInterceptor } from './interceptors/caching.interceptor';
import { ShardController } from './endpoints/shards/shard.controller';
import { ShardService } from './endpoints/shards/shard.service';
import { MetricsService } from './endpoints/metrics/metrics.service';
import { IdentitiesController } from './endpoints/identities/identities.controller';
import { IdentitiesService } from './endpoints/identities/identities.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ProxyController } from './endpoints/proxy/proxy.controller';
import { TokenAssetService } from './endpoints/tokens/token.asset.service';
import { KeysController } from './endpoints/keys/keys.controller';
import { KeysService } from './endpoints/keys/keys.service';
import { WaitingListController } from './endpoints/waiting-list/waiting.list.controller';
import { WaitingListService } from './endpoints/waiting-list/waiting.list.service';
import { TagController } from './endpoints/nfttags/tag.controller';
import { TagService } from './endpoints/nfttags/tag.service';
import { TransactionScamCheckService } from './endpoints/transactions/scam-check/transaction-scam-check.service';
import { PotentialScamTransactionChecker } from './endpoints/transactions/scam-check/potential-scam-transaction.checker';
const DailyRotateFile = require('winston-daily-rotate-file');
import "./utils/extensions/array.extensions";
import "./utils/extensions/date.extensions";
import "./utils/extensions/number.extensions";
import { NftExtendedAttributesService } from './endpoints/nfts/nft.extendedattributes.service';
import { TransactionGetService } from './endpoints/transactions/transaction.get.service';
import { TokenTransferService } from './endpoints/transactions/token.transfer.service';
import { TransactionPriceService } from './endpoints/transactions/transaction.price.service';
import { NftService } from './endpoints/nfts/nft.service';
import { UsernameController } from './endpoints/usernames/usernames.controller';
import { UsernameService } from './endpoints/usernames/username.service';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CacheModule.register(),
    WinstonModule.forRoot({
      level: 'verbose',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.Console({ level: 'info' }),
        new DailyRotateFile({
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          createSymlink: true,
          dirname: 'dist/logs',
          symlinkName: 'application.log'
        }),
      ]
    }),
    CommonModule,
  ],
  controllers: [
    NetworkController, AccountController, TransactionController, TokenController, BlockController,
    MiniBlockController, RoundController, NodeController, ProviderController,
    DelegationLegacyController, StakeController, DelegationController,
    VmQueryController, ShardController, IdentitiesController, ProxyController,
    KeysController, WaitingListController, TagController, NftController,
    UsernameController,
  ],
  providers: [
    NetworkService, ApiConfigService, AccountService, TransactionService,
    TokenService, BlockService, MiniBlockService, RoundService, NodeService, VmQueryService,
    ProviderService,
    StakeService, LoggingInterceptor, DelegationLegacyService,
    DelegationService, CachingInterceptor, ShardService, MetricsService, IdentitiesService,
    TokenAssetService, KeysService, WaitingListService, TagService,
    TransactionScamCheckService, PotentialScamTransactionChecker, NftExtendedAttributesService,
    TransactionGetService, TokenTransferService,
    TransactionPriceService, NftService, UsernameService,
  ],
  exports: [
    RoundService, TransactionService, MetricsService, NodeService,
    ShardService, IdentitiesService, ProviderService,
    NetworkService, AccountService,
  ]
})
export class PublicAppModule { }
