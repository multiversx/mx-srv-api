import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { Transaction } from "src/common/indexer/entities/transaction";
import { IndexerService } from "src/common/indexer/indexer.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { TokenTransferService } from "src/endpoints/tokens/token.transfer.service";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionActionService } from "src/endpoints/transactions/transaction-action/transaction.action.service";
import { TransactionGetService } from "src/endpoints/transactions/transaction.get.service";
import { TransactionPriceService } from "src/endpoints/transactions/transaction.price.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { UsernameService } from "src/endpoints/usernames/username.service";

describe('TransactionService', () => {
  let service: TransactionService;
  let indexerService: IndexerService;
  let assetsService: AssetsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: IndexerService,
          useValue: {
            getTransactionCountForAddress: jest.fn(),
            getTransactionCount: jest.fn(),
            getTransactions: jest.fn(),
            getScResultsForTransactions: jest.fn(),
            getSmartContractResults: jest.fn(),
            getMiniBlocks: jest.fn(),
            getBlocks: jest.fn(),
          },
        },
        {
          provide: TransactionGetService,
          useValue: {
            tryGetTransactionFromGatewayForList: jest.fn(),
            tryGetTransactionFromElastic: jest.fn(),
            tryGetTransactionFromGateway: jest.fn(),
            getTransactionLogsFromElastic: jest.fn(),
          },
        },
        {
          provide: TokenTransferService,
          useValue: {
            getOperationsForTransaction: jest.fn(),
          },
        },
        {
          provide: PluginService,
          useValue: {
            processTransactionSend: jest.fn(),
            processTransactions: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            getOrSet: jest.fn(),
            batchGetAll: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: TransactionPriceService,
          useValue: {
            getTransactionPrice: jest.fn(),
          },
        },
        {
          provide: TransactionActionService,
          useValue: {
            getTransactionAction: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getAllAccountAssets: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getMaiarIdUrl: jest.fn(),
          },
        },
        {
          provide: UsernameService,
          useValue: {
            getUsernameForAddressRaw: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<TransactionService>(TransactionService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    assetsService = moduleRef.get<AssetsService>(AssetsService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactionCountForAddressRaw', () => {
    it('should return transactions count for given address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      jest.spyOn(indexerService, 'getTransactionCountForAddress').mockResolvedValue(200);

      const result = await service.getTransactionCountForAddressRaw(address);

      expect(result).toStrictEqual(200);
      expect(indexerService.getTransactionCountForAddress).toHaveBeenCalledWith(address);
      expect(indexerService.getTransactionCountForAddress).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactionCount', () => {
    it('should return transactions count', async () => {
      jest.spyOn(indexerService, 'getTransactionCount').mockResolvedValue(10000);

      const result = await service.getTransactionCount(new TransactionFilter());

      expect(result).toStrictEqual(10000);
      expect(indexerService.getTransactionCount).toHaveBeenCalledWith(new TransactionFilter(), undefined);
      expect(indexerService.getTransactionCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactions', () => {
    const elasticTransactionsMock: Transaction[] = [
      {
        hash: '00c0e3c8dfbbf40298e58432d23c8698f198fae1b659567d372a9b2632825720',
        miniBlockHash:
          '3b5cc5fb6d6da35d2654bb36062113e94766b054a45bd0cdddcc9c8fd1737bb5',
        nonce: 85514,
        round: 17034196,
        value: '0',
        receiver: 'erd1qqqqqqqqqqqqqpgq7rwhny4mx6dhuzcsymrhdsv2vmvarecgh4vq687aqr',
        receiverUserName: 'YWxpY2UyLnN1ZmZpeA==',
        receiverUsername: '',
        sender: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        senderUserName: '',
        senderUsername: '',
        receiverShard: 0,
        senderShard: 0,
        gasPrice: '1000000000',
        gasLimit: '5000000',
        gasUsed: '3260249',
        fee: '223177490000000',
        data:
          'Y2xhaW1Vc2VyQGMyNzBkOWE1NGVlYjFmN2YzOGVkZjE5MjM0ZmE1MjA0ZDRjNTZhODQwZDVhMmFkZDBkODY5OGJmZTJjNzk1OWNAMDE3YWM4NzE4ZmYyNTFjM2ZiM2M=',
        signature:
          'a151ca8de060f210bf10881ce2e958bded2862d01f8d35fd40df0ef0e51b4c15648a37c33a336713a5820aff4fce61e318796349d3f5f143d6e5e9b39fe7e501',
        timestamp: 1698322776,
        status: 'success',
        searchOrder: 0,
        hasScResults: true,
        hasOperations: true,
        tokens: [''],
        esdtValues: ['10'],
        receivers: ['erd1', 'erd2'],
        receiversShardIDs: [1],
        operation: 'transfer',
        scResults: [''],
        relayerAddr: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        version: 1,
        relayer: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        isRelayed: true,
        relayerSignature: 'bc51e9032332740d60c404d4bf553ae225ca77a70ad799a1cdfc6e73609be8ec62e89ac6e2c2621ffbfb89e6fab620c137010662f3ebea9c422c9f1dbec04a03',
      },
      {
        hash: '2b1ce5558f5faa533afd437a42a5aeadea8302dc3cca778c0ed50d19c0a047a4',
        miniBlockHash:
          'fca171ea58af176a797f57673423d1755d04545a90564f98f1dbad173eea120e',
        nonce: 1893,
        round: 17034196,
        value: '0',
        receiver: 'erd1qqqqqqqqqqqqqpgq7rwhny4mx6dhuzcsymrhdsv2vmvarecgh4vq687aqr',
        receiverUserName: '',
        receiverUsername: '',
        sender: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        senderUserName: '',
        senderUsername: '',
        receiverShard: 0,
        senderShard: 0,
        gasPrice: '1000000000',
        gasLimit: '8500000',
        gasUsed: '3260249',
        fee: '223177490000000',
        data:
          'RVNEVE5GVFRyYW5zZmVyQDUzNTU1NDRiMmQ2MjYxMzMzNTY2MzNAMDc2YmE2QDAxNGFlMjAxN2ZhMzM2MTQxYjRkQDAwMDAwMDAwMDAwMDAwMDAwNTAwYzY1YjZkYzhmOTE2ZjNhZGFmYmM1Y2JjNTlhMTllNGU0NDVmMWZmOTU0ODNANjM2ZjZkNzA2Zjc1NmU2NDUyNjU3NzYxNzI2NDcz=',
        signature:
          'bc51e9032332740d60c404d4bf553ae225ca77a70ad799a1cdfc6e73609be8ec62e89ac6e2c2621ffbfb89e6fab620c137010662f3ebea9c422c9f1dbec04a03',
        timestamp: 1698322776,
        status: 'success',
        searchOrder: 0,
        hasScResults: true,
        hasOperations: true,
        tokens: [''],
        esdtValues: ['10'],
        receivers: ['erd1', 'erd2'],
        receiversShardIDs: [1],
        operation: 'transfer',
        scResults: [''],
        relayerAddr: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        version: 1,
        relayer: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        isRelayed: true,
        relayerSignature: 'bc51e9032332740d60c404d4bf553ae225ca77a70ad799a1cdfc6e73609be8ec62e89ac6e2c2621ffbfb89e6fab620c137010662f3ebea9c422c9f1dbec04a03',
      },
    ];

    const assetsAccountMock = {
      'account': new AccountAssets({
        name: 'Test',
        description: 'Test',
        icon: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
        iconPng: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
        iconSvg: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
        proof: '',
        tags: ["transactions", "tests", "unit"],
      }),
    };

    it('should return an array of transactions', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();

      jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValue(assetsAccountMock);

      jest.spyOn(indexerService, 'getTransactions').mockResolvedValue(elasticTransactionsMock);
      const results = await service.getTransactions(filter, pagination);

      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(elasticTransactionsMock.length);
    });

    it('should apply block info when withBlockInfo is true', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = { withBlockInfo: true };

      jest.spyOn(indexerService, 'getTransactions').mockResolvedValue(elasticTransactionsMock);
      jest.spyOn(service, 'applyBlockInfo').mockResolvedValue();

      await service.getTransactions(filter, pagination, queryOptions);

      expect(service.applyBlockInfo).toHaveBeenCalledWith(expect.any(Array));
    });
  });
});
