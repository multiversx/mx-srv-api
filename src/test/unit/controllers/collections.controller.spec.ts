import { INestApplication } from "@nestjs/common";
import { mockCollectionService, mockNftService, mockTransactionService } from "./services.mock/collection.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { CollectionController } from "src/endpoints/collections/collection.controller";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { ConfigModule } from "@nestjs/config";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { SortCollections } from "src/endpoints/collections/entities/sort.collections";
import { SortOrder } from "src/common/entities/sort.order";
import request = require('supertest');
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftQueryOptions } from "src/endpoints/nfts/entities/nft.query.options";
import { SortCollectionNfts } from "src/endpoints/collections/entities/sort.collection.nfts";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";
import { mockTransferService } from "./services.mock/transfer.services.mock";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { TransferModule } from "src/endpoints/transfers/transfer.module";

describe('CollectionController', () => {
  let app: INestApplication;
  const path = '/collections';

  const collectionServiceMocks = mockCollectionService();
  const nftServiceMocks = mockNftService();
  const transactionServiceMocks = mockTransactionService();
  const transferServiceMocks = mockTransferService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CollectionController],
      imports: [
        CollectionModule,
        NftModule,
        TransactionModule,
        TransferModule,
        ConfigModule.forRoot({}),
      ],
    })
      .overrideProvider(CollectionService).useValue(collectionServiceMocks)
      .overrideProvider(NftService).useValue(nftServiceMocks)
      .overrideProvider(TransactionService).useValue(transactionServiceMocks)
      .overrideProvider(TransferService).useValue(transferServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /collections', () => {
    it('should return an array of collections', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({})
      );
    });


    it('should return an array of collections with search filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const search = 'Test';

      await request(app.getHttpServer())
        .get(`${path}?search=${search}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ search })
      );
    });

    it('should return an array of collections with identifiers filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const identifiers = ['TEST-5409d3', 'TEST-57a352'];

      await request(app.getHttpServer())
        .get(`${path}?identifiers=${identifiers.join(',')}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ identifiers })
      );
    });

    it('should return an array of collections with type filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const type = [NftType.NonFungibleESDT];

      await request(app.getHttpServer())
        .get(`${path}?type=${type}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ type })
      );
    });


    it('should return an array of collections with canCreate filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const canCreate = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}?canCreate=${canCreate}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ canCreate })
      );
    });

    it('should return an array of collections with before filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const before = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}?before=${before}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ before })
      );
    });

    it('should return an array of collections with after filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const after = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}?after=${after}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ after })
      );
    });

    it('should return an array of collections with multiple filters applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const canBurn = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddQuantity = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canUpdateAttributes = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddUri = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canTransferRole = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}?canBurn=${canBurn}&canAddQuantity=${canAddQuantity}&canUpdateAttributes=${canUpdateAttributes}&canAddUri=${canAddUri}&canTransferRole=${canTransferRole}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole })
      );
    });

    it('should return an array of collections with sort filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const sort = SortCollections.timestamp;

      await request(app.getHttpServer())
        .get(`${path}?sort=${sort}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ sort })
      );
    });


    it('should return an array of collections with order filter applied', async () => {
      collectionServiceMocks.getNftCollections.mockReturnValue([]);
      const order = SortOrder.desc;

      await request(app.getHttpServer())
        .get(`${path}?order=${order}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollections).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createCollectionFilter({ order })
      );
    });
  });

  describe('GET /collections/count', () => {
    it('should return total collections count', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5000);
      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5000);
        });

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({})
      );
    });

    it('should return total collection count with search filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2);
      const search = 'Test';

      await request(app.getHttpServer())
        .get(`${path}/count?search=${search}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ search })
      );
    });

    it('should return total collection count with type filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2500);
      const type = [NftType.NonFungibleESDT];

      await request(app.getHttpServer())
        .get(`${path}/count?type=${type}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ type })
      );
    });

    it('should return total collection count with canCreate filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canCreate = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/count?canCreate=${canCreate}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canCreate })
      );
    });

    it('should return total collection count with before filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(20);
      const before = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/count?before=${before}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ before })
      );
    });

    it('should return total collection count with after filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5);
      const after = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/count?after=${after}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ after })
      );
    });

    it('should return total collection count with multiple filters applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canBurn = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddQuantity = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canUpdateAttributes = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddUri = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canTransferRole = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/count?canBurn=${canBurn}&canAddQuantity=${canAddQuantity}&canUpdateAttributes=${canUpdateAttributes}&canAddUri=${canAddUri}&canTransferRole=${canTransferRole}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole })
      );
    });
  });

  describe('GET /collections/c', () => {
    it('should return total collections count', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5000);
      await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5000);
        });

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({})
      );
    });

    it('should return total collection count with search filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2);
      const search = 'Test';

      await request(app.getHttpServer())
        .get(`${path}/c?search=${search}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ search })
      );
    });

    it('should return total collection count with type filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(2500);
      const type = [NftType.NonFungibleESDT];

      await request(app.getHttpServer())
        .get(`${path}/c?type=${type}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ type })
      );
    });

    it('should return total collection count with canCreate filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canCreate = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/c?canCreate=${canCreate}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canCreate })
      );
    });

    it('should return total collection count with before filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(20);
      const before = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/c?before=${before}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ before })
      );
    });

    it('should return total collection count with after filter applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(5);
      const after = 1694012940;

      await request(app.getHttpServer())
        .get(`${path}/c?after=${after}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ after })
      );
    });

    it('should return total collection count with multiple filters applied', async () => {
      collectionServiceMocks.getNftCollectionCount.mockReturnValue(10);
      const canBurn = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddQuantity = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canUpdateAttributes = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canAddUri = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const canTransferRole = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/c?canBurn=${canBurn}&canAddQuantity=${canAddQuantity}&canUpdateAttributes=${canUpdateAttributes}&canAddUri=${canAddUri}&canTransferRole=${canTransferRole}`)
        .expect(200);

      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalled();
      expect(collectionServiceMocks.getNftCollectionCount).toHaveBeenCalledWith(
        createCollectionFilter({ canBurn, canAddQuantity, canUpdateAttributes, canAddUri, canTransferRole })
      );
    });
  });

  describe('GET /collections/:collection', () => {
    it('should return collection details', async () => {
      collectionServiceMocks.getNftCollection.mockReturnValue({});
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}`)
        .expect(200);
      expect(collectionServiceMocks.getNftCollection).toHaveBeenCalled();
    });

    it('should throw HttpException if collection is not found', async () => {
      collectionServiceMocks.getNftCollection.mockReturnValue(undefined);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toStrictEqual('Collection not found');
        });
      expect(collectionServiceMocks.getNftCollection).toHaveBeenCalled();
    });

    it('should throw collection validation pipe if given collection is not a valid collection', async () => {
      collectionServiceMocks.getNftCollection.mockReturnValue({});
      const collection = 'TEST-5409d3-Test';

      await request(app.getHttpServer())
        .get(`${path}/${collection}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });
  });

  describe('GET /collections/:collection/ranks', () => {
    it('should return collection details ranks', async () => {
      collectionServiceMocks.getNftCollectionRanks.mockReturnValue([]);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/ranks`)
        .expect(200);
      expect(collectionServiceMocks.getNftCollectionRanks).toHaveBeenCalled();
    });

    it('should throw HttpException if collection is not found', async () => {
      collectionServiceMocks.getNftCollectionRanks.mockReturnValue(undefined);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/ranks`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toStrictEqual('Ranks for collection not found');
        });
      expect(collectionServiceMocks.getNftCollectionRanks).toHaveBeenCalled();
    });

    it('should throw collection validation pipe if given collection is not a valid collection', async () => {
      collectionServiceMocks.getNftCollection.mockReturnValue({});
      const collection = 'TEST-5409d3-Test';

      await request(app.getHttpServer())
        .get(`${path}/${collection}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });
  });

  describe('GET /collections/:collection/nfts', () => {
    it('should return collection nfts details', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts`)
        .expect(200);
      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection: collection }),
        options
      );
    });

    it('should return collection NFTs with search filter', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const search = "unique";
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?search=${search}`)
        .expect(200);


      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, search }),
        options
      );
    });

    it('should return collection NFTs with tags filter', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const tags = "tag1,tag2";
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?tags=${tags}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, tags: tags.split(',') }),
        options
      );
    });

    it('should return NFTs filtered by creator address', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const creator = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?creator=${creator}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, creator: creator }),
        options
      );
    });

    it('should return NFTs filtered by isWhitelistedStorage', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const isWhitelistedStorage = true;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?isWhitelistedStorage=${isWhitelistedStorage}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, isWhitelistedStorage: isWhitelistedStorage }),
        options
      );
    });

    it('should return NFTs filtered by isWhitelistedStorage false', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const isWhitelistedStorage = false;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?isWhitelistedStorage=${isWhitelistedStorage}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, isWhitelistedStorage: isWhitelistedStorage }),
        options
      );
    });

    it('should return NFTs filtered by hasUris', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const hasUris = true;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?hasUris=${hasUris}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, hasUris: hasUris }),
        options
      );
    });

    it('should return NFTs filtered by hasUris false', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const hasUris = false;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?hasUris=${hasUris}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, hasUris: hasUris }),
        options
      );
    });

    it('should return NFTs filtered by isNsfw', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const isNsfw = true;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?isNsfw=${isNsfw}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, isNsfw: isNsfw }),
        options
      );
    });

    it('should return NFTs filtered by nonceBefore', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const nonceBefore = 10;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?nonceBefore=${nonceBefore}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, nonceBefore: nonceBefore }),
        options
      );
    });

    it('should return NFTs filtered by nonceAfter', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const nonceAfter = 5;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?nonceAfter=${nonceAfter}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, nonceAfter: nonceAfter }),
        options
      );
    });

    it('should return NFTs filtered by withOwner', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const withOwner = true;
      const options = new NftQueryOptions({ withOwner: withOwner });

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?withOwner=${withOwner}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection }),
        options
      );
    });

    it('should return NFTs filtered by withSupply', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const withSupply = true;
      const options = new NftQueryOptions({ withSupply: withSupply });

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?withSupply=${withSupply}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection }),
        options
      );
    });

    it('should return NFTs filtered by sort / order', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const sort = SortCollectionNfts.timestamp;
      const order = SortOrder.asc;
      const options = new NftQueryOptions({});

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts?sort=${sort}&order=${order}`)
        .expect(200);

      expect(nftServiceMocks.getNfts).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        createNftFilter({ collection, sort: sort, order: order }),
        options
      );
    });

    it('should throw collection validation pipe if given collection is not a valid collection', async () => {
      nftServiceMocks.getNfts.mockResolvedValue([]);
      collectionServiceMocks.getNftCollection.mockReturnValue({});
      const collection = 'TEST-5409d3-Test';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });
  });

  describe('GET /collections/:collection/nfts/count', () => {
    it('should return collection nfts count', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(5000);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count`)
        .expect(200);
      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection: collection }),
      );
    });

    it('should return collection NFTs count with search filter', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(100);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const search = "unique";

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?search=${search}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, search }),
      );
    });

    it('should return collection NFTs count with tags filter', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(200);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const tags = "tag1,tag2";

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?tags=${tags}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, tags: tags.split(',') }),
      );
    });

    it('should return collection NFTs count filtered by creator address', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(150);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const creator = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?creator=${creator}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, creator: creator }),
      );
    });

    it('should return collection NFTs count filtered by isWhitelistedStorage', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(100);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const isWhitelistedStorage = true;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?isWhitelistedStorage=${isWhitelistedStorage}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, isWhitelistedStorage: isWhitelistedStorage }),
      );
    });

    it('should return collection NFTs count filtered by isWhitelistedStorage false', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(50);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const isWhitelistedStorage = false;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?isWhitelistedStorage=${isWhitelistedStorage}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, isWhitelistedStorage: isWhitelistedStorage }),
      );
    });

    it('should return collection NFTs count filtered by hasUris', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(100);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const hasUris = true;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?hasUris=${hasUris}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, hasUris: hasUris }),
      );
    });

    it('should return collection NFTs count filtered by hasUris false', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(50);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const hasUris = false;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?hasUris=${hasUris}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, hasUris: hasUris }),
      );
    });

    it('should return collection NFTs count filtered by nonceBefore', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(10);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const nonceBefore = 10;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?nonceBefore=${nonceBefore}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, nonceBefore: nonceBefore }),
      );
    });

    it('should return NFTs filtered by nonceAfter', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(50);
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      const collection = 'TEST-5409d3';
      const nonceAfter = 5;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count?nonceAfter=${nonceAfter}`)
        .expect(200);

      expect(nftServiceMocks.getNftCount).toHaveBeenCalledWith(
        createNftFilter({ collection, nonceAfter: nonceAfter }),
      );
    });

    it('should throw collection validation pipe if given collection is not a valid collection', async () => {
      nftServiceMocks.getNftCount.mockResolvedValue(0);
      collectionServiceMocks.getNftCollection.mockReturnValue({});
      const collection = 'TEST-5409d3-Test';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/nfts/count`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'collection': Invalid collection identifier.");
        });
    });
  });

  describe('GET /collections/:identifier/accounts', () => {
    it('should return collection accounts', async () => {
      nftServiceMocks.getCollectionOwners.mockResolvedValue([]);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/accounts`)
        .expect(200);
      expect(nftServiceMocks.getCollectionOwners).toHaveBeenCalledWith(
        collection,
        new QueryPagination({})
      );
    });

    it('should throw Collection not found', async () => {
      nftServiceMocks.getCollectionOwners.mockResolvedValue(undefined);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/accounts`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toStrictEqual('Collection not found');
        });
      expect(nftServiceMocks.getCollectionOwners).toHaveBeenCalledWith(
        collection,
        new QueryPagination({})
      );
    });
  });

  describe('GET /collections/:identifier/logo/png', () => {
    it('should return collection logo png', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      collectionServiceMocks.getLogoPng.mockResolvedValue("");
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/logo/png`)
        .expect(302);
      expect(collectionServiceMocks.getLogoPng).toHaveBeenCalledWith(collection);
    });

    it('should throw 404 not found exception if collection assets are undefined', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      collectionServiceMocks.getLogoPng.mockResolvedValue(undefined);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/logo/png`)
        .expect(404);
      expect(collectionServiceMocks.getLogoPng).toHaveBeenCalledWith(collection);
    });
  });

  describe('GET /collections/:identifier/logo/svg', () => {
    it('should return collection logo svg', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      collectionServiceMocks.getLogoSvg.mockResolvedValue("");
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/logo/svg`)
        .expect(302);
      expect(collectionServiceMocks.getLogoSvg).toHaveBeenCalledWith(collection);
    });

    it('should throw 404 not found exception if collection assets are undefined', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      collectionServiceMocks.getLogoSvg.mockResolvedValue(undefined);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/logo/svg`)
        .expect(404);
      expect(collectionServiceMocks.getLogoSvg).toHaveBeenCalledWith(collection);
    });
  });

  describe('GET /collections/:collection/transactions/count', () => {
    it('should return total transactions count for given collection', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(1000);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by sender', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(1000);
      const collection = 'TEST-5409d3';
      const sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?sender=${sender}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, sender: sender, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by senderShard', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(500);
      const collection = 'TEST-5409d3';
      const senderShard = 1;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?senderShard=${senderShard}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, senderShard: senderShard, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by receiverShard', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(500);
      const collection = 'TEST-5409d3';
      const receiverShard = 0;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?receiverShard=${receiverShard}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, receiverShard: receiverShard, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by miniBlockHash', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const miniBlockHash = 'a0ec9786e3879daed306c895841b69e1ae6d5b3801cc0ac6830eee09c312b993';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?miniBlockHash=${miniBlockHash}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, miniBlockHash: miniBlockHash, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by transactions status', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const status = TransactionStatus.success;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?status=${status}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, status: status, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by before timestamp', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const before = 1609630444;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?before=${before}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, before: before, functions: [] })
      );
    });

    it('should return collection NFTs transactions count filtered by after timestamp', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transactionServiceMocks.getTransactionCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const after = 1709630444;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transactions/count?after=${after}`)
        .expect(200);
      expect(transactionServiceMocks.getTransactionCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, after: after, functions: [] })
      );
    });
  });

  describe('GET /collections/:collection/transfers/count', () => {
    it('should return total transfers count for given collection', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(1000);
      const collection = 'TEST-5409d3';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by sender', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(1000);
      const collection = 'TEST-5409d3';
      const sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?sender=${sender}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, sender: sender, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by senderShard', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(500);
      const collection = 'TEST-5409d3';
      const senderShard = 1;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?senderShard=${senderShard}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, senderShard: senderShard, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by receiverShard', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(500);
      const collection = 'TEST-5409d3';
      const receiverShard = 0;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?receiverShard=${receiverShard}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, receiverShard: receiverShard, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by miniBlockHash', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const miniBlockHash = 'a0ec9786e3879daed306c895841b69e1ae6d5b3801cc0ac6830eee09c312b993';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?miniBlockHash=${miniBlockHash}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, miniBlockHash: miniBlockHash, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by transactions status', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const status = TransactionStatus.success;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?status=${status}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, status: status, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by before timestamp', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const before = 1609630444;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?before=${before}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, before: before, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by after timestamp', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const after = 1709630444;

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?after=${after}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, after: after, functions: undefined })
      );
    });

    it('should return collection NFTs transfers count filtered by function', async () => {
      collectionServiceMocks.isCollection.mockResolvedValue(true);
      transferServiceMocks.getTransfersCount.mockResolvedValue(10);
      const collection = 'TEST-5409d3';
      const functions = 'auctionListing';

      await request(app.getHttpServer())
        .get(`${path}/${collection}/transfers/count?function=${functions}`)
        .expect(200);
      expect(transferServiceMocks.getTransfersCount).toHaveBeenCalledWith(
        createTransactionFilter({ token: collection, functions: ['auctionListing'] })
      );
    });
  });
});


function createCollectionFilter(options: CollectionFilter = {}) {
  return new CollectionFilter({
    search: options.search,
    type: options.type,
    identifiers: options.identifiers,
    canCreate: options.canCreate,
    before: options.before,
    after: options.after,
    canBurn: options.canBurn,
    canAddQuantity: options.canAddQuantity,
    canUpdateAttributes: options.canUpdateAttributes,
    canAddUri: options.canAddUri,
    canTransferRole: options.canTransferRole,
    excludeMetaESDT: options.excludeMetaESDT,
    sort: options.sort,
    order: options.order,
  });
}

function createNftFilter(options: NftFilter = {}) {
  return new NftFilter({
    collection: options.collection,
    search: options.search,
    identifiers: options.identifiers,
    name: options.name,
    tags: options.tags,
    creator: options.creator,
    isWhitelistedStorage: options.isWhitelistedStorage,
    hasUris: options.hasUris,
    isNsfw: options.isNsfw,
    traits: options.traits,
    nonceBefore: options.nonceBefore,
    nonceAfter: options.nonceAfter,
    sort: options.sort,
    order: options.order,
  });
}

function createTransactionFilter(options: TransactionFilter = {}) {
  return new TransactionFilter({
    sender: options.sender,
    receivers: options.receivers,
    token: options.token,
    senderShard: options.senderShard,
    receiverShard: options.receiverShard,
    miniBlockHash: options.miniBlockHash,
    hashes: options.hashes,
    status: options.status,
    before: options.before,
    after: options.after,
    functions: options.functions,
  });
}
