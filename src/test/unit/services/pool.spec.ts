import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { PoolFilter } from "src/endpoints/pool/entities/pool.filter";
import { PoolService } from "src/endpoints/pool/pool.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { ProtocolService } from "../../../common/protocol/protocol.service";
import { TransactionActionService } from "../../../endpoints/transactions/transaction-action/transaction.action.service";

describe('PoolService', () => {
  let service: PoolService;
  let gatewayService: GatewayService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PoolService,
        {
          provide: GatewayService,
          useValue: {
            getTransactionPool: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardCount: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            isTransactionPoolEnabled: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TransactionActionService,
          useValue: {
            getTransactionMetadata: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<PoolService>(PoolService);
    gatewayService = moduleRef.get<GatewayService>(GatewayService);
    cacheService = moduleRef.get<CacheService>(CacheService);

    const data = require('../../mocks/pool.mock.json');

    gatewayService.getTransactionPool = jest.fn().mockResolvedValue(data);
    const txPoolRaw = await service.getTxPoolRaw();

    cacheService.getOrSet = jest.fn().mockResolvedValue(txPoolRaw);

  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPool', () => {
    it('should work and return the pool', async () => {
      const pool = await service.getPool(new QueryPagination(), new PoolFilter());
      expect(pool).toHaveLength(7);
      expect(pool[0].type).toStrictEqual(TransactionType.Transaction);
    });

    it('should work and return the pool with filters', async () => {
      let pool = await service.getPool(new QueryPagination(), new PoolFilter({ type: TransactionType.Transaction }));
      expect(pool).toHaveLength(1);

      pool = await service.getPool(new QueryPagination(), new PoolFilter({ type: TransactionType.SmartContractResult }));
      expect(pool).toHaveLength(1);

      pool = await service.getPool(new QueryPagination(), new PoolFilter({ type: TransactionType.Reward }));
      expect(pool).toHaveLength(5);
    });

    it('should work and return the pool with query pagination', async () => {
      const pool = await service.getPool(new QueryPagination({ from: 0, size: 2 }), new PoolFilter({ type: TransactionType.Reward }));
      expect(pool).toHaveLength(2);
      expect(pool[0].type).toStrictEqual(TransactionType.Reward);
    });
  });

  describe('getPoolCount', () => {
    it('should work and return the pool count', async () => {
      const poolCount = await service.getPoolCount(new PoolFilter());
      expect(poolCount).toStrictEqual(7);
    });

    it('should work and return the pool count with filters', async () => {
      let poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.Transaction }));
      expect(poolCount).toStrictEqual(1);

      poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.SmartContractResult }));
      expect(poolCount).toStrictEqual(1);

      poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward }));
      expect(poolCount).toStrictEqual(5);
    });
  });

  describe('getTransactionFromPool', () => {
    it('should work and return the transaction', async () => {
      const tx = await service.getTransactionFromPool("e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da");
      expect(tx).toBeDefined();
    });

    it('should not find a tx hash that is not in the pool', async () => {
      const tx = await service.getTransactionFromPool("e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01d0");
      expect(tx).toBeUndefined();
    });
  });
});
