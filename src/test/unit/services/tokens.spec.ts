import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { EsdtAddressService } from "src/endpoints/esdt/esdt.address.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TokenType } from "src/common/indexer/entities";
import { DataApiService } from "src/common/data-api/data-api.service";
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssetStatus } from "src/endpoints/tokens/entities/token.asset.status";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftRankAlgorithm } from "src/common/assets/entities/nft.rank.algorithm";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import * as fs from 'fs';
import * as path from 'path';
import { ApiService, ApiUtils } from "@multiversx/sdk-nestjs-http";
import { Token } from "src/endpoints/tokens/entities/token";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { EsdtSupply } from "src/endpoints/esdt/entities/esdt.supply";
import { TokenDetailed } from "src/endpoints/tokens/entities/token.detailed";
import { NumberUtils } from "@multiversx/sdk-nestjs-common";

describe('Token Service', () => {
  let tokenService: TokenService;
  let esdtService: EsdtService;
  let collectionService: CollectionService;
  let indexerService: IndexerService;
  let assetsService: AssetsService;
  let apiService: ApiService;
  let apiConfigService: ApiConfigService;
  let cacheService: CacheService;
  let dataApiService: DataApiService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: IndexerService,
          useValue: {
            getCollection: jest.fn(),
            getTokenCountForAddress: jest.fn(),
            getTokensForAddress: jest.fn(),
            getTokenAccounts: jest.fn(),
            getTokenAccountsCount: jest.fn(),
            getToken: jest.fn(),
            getTokensWithRolesForAddressCount: jest.fn(),
            getTokensWithRolesForAddress: jest.fn(),
            getEsdtAccountsCount: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue:
          {
            getOrSet: jest.fn(),
            get: jest.fn(),
            batchSet: jest.fn(),
            getLocal: jest.fn(),
            deleteInCache: jest.fn(),
            batchGetManyRemote: jest.fn(),
            batchApplyAll: jest.fn(),
          },
        },
        {
          provide: EsdtService,
          useValue: {
            getEsdtAddressesRoles: jest.fn(),
            getTokenSupply: jest.fn(),
            getEsdtTokenProperties: jest.fn(),
            getAllFungibleTokenProperties: jest.fn(),
          },
        },
        {
          provide: EsdtAddressService,
          useValue: {
            getAllEsdtsForAddressFromGateway: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getAddressNft: jest.fn(),
            getAddressEsdt: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getIsIndexerV3FlagActive: jest.fn(),
            isTokensFetchFeatureEnabled: jest.fn(),
            getTokensFetchServiceUrl: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getTokenAssets: jest.fn(),
            getAllAccountAssets: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            getTransactionCount: jest.fn(),
          },
        },
        {
          provide: MexTokenService,
          useValue: {
            getMexPricesRaw: jest.fn(),
          },
        },
        {
          provide: CollectionService,
          useValue: {
            applyCollectionRoles: jest.fn(),
            getNftCollections: jest.fn(),
          },
        },
        {
          provide: DataApiService,
          useValue: {
            getEsdtTokenPrice: jest.fn(),
            getEgldPrice: jest.fn(),
          },
        },
        {
          provide: TransferService,
          useValue: {
            getTransfersCount: jest.fn(),
          },
        },
        {
          provide: MexPairService,
          useValue: {
            getAllMexPairs: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);
    cacheService = moduleRef.get<CacheService>(CacheService);
    esdtService = moduleRef.get<EsdtService>(EsdtService);
    collectionService = moduleRef.get<CollectionService>(CollectionService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    assetsService = moduleRef.get<AssetsService>(AssetsService);
    apiService = moduleRef.get<ApiService>(ApiService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    dataApiService = moduleRef.get<DataApiService>(DataApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isToken', () => {
    it('should return true if identifier exists in getAllTokens', async () => {
      const data = require('../../mocks/tokens.mock.json');
      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      const result = await tokenService.isToken('WEGLD-bd4d79');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should return false if identifier does not exist in getAllTokens', async () => {
      tokenService.getAllTokens = jest.fn().mockResolvedValue([]);

      const result = await tokenService.isToken('WEGLD-bd4d79');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token details if identifier exists in getAllTokens', async () => {
      const data = require('../../mocks/tokens.mock.json');

      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue([]);

      const result = await tokenService.getToken('WEGLD-bd4d79');
      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).toHaveBeenCalledTimes(1);
      expect(tokenService.applySupply).toHaveBeenCalledTimes(1);
      expect(tokenService.getTokenRoles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({
        identifier: 'WEGLD-bd4d79',
        type: 'FungibleESDT',
        collection: undefined,
        nonce: undefined,
        name: 'WrappedEGLD',
        ticker: 'WEGLD',
        owner: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
        minted: '',
        burnt: '',
        initialMinted: '',
        decimals: 18,
        isPaused: false,
        transactions: 5900945,
        accounts: 123942,
        canUpgrade: true,
        canMint: true,
        canBurn: true,
        canChangeOwner: true,
        canAddSpecialRoles: true,
        canPause: true,
        canFreeze: true,
        canWipe: true,
        canTransferNftCreateRole: undefined,
        price: 41.626458658528016,
        marketCap: 39400951.72791124,
        supply: '946536241555565591724502',
        circulatingSupply: '946536241555565591724502',
      }));
    });

    it('should return token case insensitive', async () => {
      const data = require('../../mocks/tokens.mock.json');

      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue([]);

      const result = await tokenService.getToken('wEglD-bd4D79');
      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).toHaveBeenCalledTimes(1);
      expect(tokenService.applySupply).toHaveBeenCalledTimes(1);
      expect(tokenService.getTokenRoles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({
        identifier: 'WEGLD-bd4d79',
        type: 'FungibleESDT',
        price: 41.626458658528016,
      }));
    });

    it('should return undefined if identifier does not exist in getAllTokens', async () => {
      tokenService.getAllTokens = jest.fn().mockResolvedValue([]);
      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue(undefined);

      const result = await tokenService.getToken('token-1234');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).not.toHaveBeenCalled();
      expect(tokenService.applySupply).not.toHaveBeenCalled();
      expect(tokenService.getTokenRoles).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined if identifier is not a valid token', async () => {
      const data = require('../../mocks/tokens.mock.json');
      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue(undefined);

      const result = await tokenService.getToken('invalid-token');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).not.toHaveBeenCalled();
      expect(tokenService.applySupply).not.toHaveBeenCalled();
      expect(tokenService.getTokenRoles).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return undefined if getTokenRoles returns undefined for fungible tokens', async () => {
      const data = require('../../mocks/tokens.mock.json');
      tokenService.getAllTokens = jest.fn().mockResolvedValue(data);

      tokenService.applyTickerFromAssets = jest.fn().mockResolvedValue(undefined);
      tokenService.applySupply = jest.fn().mockResolvedValue(undefined);
      tokenService.getTokenRoles = jest.fn().mockResolvedValue(undefined);

      const result = await tokenService.getToken('token1');

      expect(tokenService.getAllTokens).toHaveBeenCalledTimes(1);
      expect(tokenService.applyTickerFromAssets).toHaveBeenCalledTimes(0);
      expect(tokenService.applySupply).toHaveBeenCalledTimes(0);
      expect(result).toBeUndefined();
    });
  });

  describe('getTokens', () => {
    it('should return an empty array when there are no tokens', async () => {
      const queryPagination: QueryPagination = { from: 0, size: 10 };
      const filter: TokenFilter = {};
      const getFilteredTokensMock = jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue([]);

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(getFilteredTokensMock).toHaveBeenCalledWith(filter);
      expect(result).toEqual([]);
    });

    it('should return the correct number of tokens when they exist', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue(mockTokens);
      const applyTickerFromAssetsMock = jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination = new QueryPagination();
      queryPagination.size = 2;
      const filter: TokenFilter = {};

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(getFilteredTokensMock).toHaveBeenCalledWith(filter);
      expect(result.length).toEqual(2);
      expect(applyTickerFromAssetsMock).toHaveBeenCalledTimes(2);
    });

    it('should verify if assets property is defined', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const filter: TokenFilter = {};
      const queryPagination: QueryPagination = new QueryPagination();

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result.length).toEqual(25);
      expect(result[0].assets).toBeDefined();
    });

    it('should verify when includeMetaESDT is true, response body should contain MetaESDTs', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getFilteredTokens').mockResolvedValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const filter: TokenFilter = new TokenFilter();
      filter.includeMetaESDT = true;
      const queryPagination: QueryPagination = new QueryPagination({ size: 30 });

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result).toContainEqual(expect.objectContaining({ type: 'MetaESDT' }));
    });

    it('should return an array of tokens details for a specific array of identifiers', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ identifiers: ['MEX-455c57', 'WEGLD-bd4d79'] });

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'MEX-455c57' }),
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of token details for a specific identifier', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ identifier: 'WEGLD-bd4d79' });

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of token details for a specific search keyword', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ search: 'WEGLD' });

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of token details for a specific name', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ search: 'WrappedEGLD' });

      const result = await tokenService.getTokens(queryPagination, filter);
      expect(result).toHaveLength(1);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ identifier: 'WEGLD-bd4d79' }),
      ]));
    });

    it('should return an array of tokens with ESDT type equal with Fungible', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));

      jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);
      jest.spyOn(tokenService, 'applyTickerFromAssets').mockImplementation();

      const queryPagination: QueryPagination = new QueryPagination();
      const filter: TokenFilter = new TokenFilter({ type: TokenType.FungibleESDT });

      const result = await tokenService.getTokens(queryPagination, filter);

      expect(result).toHaveLength(25);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'FungibleESDT' }),
      ]));
    });
  });

  describe('getTokenCount', () => {
    it('should return total tokens count', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const result = await tokenService.getTokenCount(new TokenFilter());

      expect(result).toStrictEqual(25);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });

    it('should return total tokens count and add MetaESDT', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const filter = new TokenFilter();
      filter.includeMetaESDT = true;

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(26);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });

    it('should return tokens count when identifier filter is applied', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const filter = new TokenFilter();
      filter.identifier = "WEGLD-bd4d79";

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(1);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });

    it('should return tokens count when identifiers filter is applied', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const getFilteredTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockReturnValue(mockTokens);

      const filter = new TokenFilter();
      filter.identifiers = ['MEX-455c57', 'WEGLD-bd4d79'];

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(2);
      expect(getFilteredTokensMock).toHaveBeenCalled();
    });
  });

  describe('getTokenCountForAddress', () => {
    it('should return the correct token count for a valid address and filter', async () => {
      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });
      const expectedCount = 10;
      const getTokenCountForAddressMock = jest.spyOn(tokenService['indexerService'], 'getTokenCountForAddress')
        .mockResolvedValue(expectedCount);

      const result = await tokenService.getTokenCountForAddress(address, filter);
      expect(result).toEqual(expectedCount);
      expect(getTokenCountForAddressMock).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getTokenCountForAddressFromElastic', () => {
    it('should return the correct token count from elastic for a valid address and filter', async () => {
      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });
      const expectedCount = 10;
      const getTokenCountForAddressMock = jest.spyOn(tokenService['indexerService'], 'getTokenCountForAddress')
        .mockResolvedValue(expectedCount);

      const result = await tokenService.getTokenCountForAddressFromElastic(address, filter);
      expect(result).toEqual(expectedCount);
      expect(getTokenCountForAddressMock).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getTokenCountForAddressFromGateway', () => {
    it('should return the correct token count for a valid address and filter', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });

      const expectedCount = 26;
      const getAllTokensForAddressMock = jest.spyOn(tokenService, 'getAllTokensForAddress').mockResolvedValue(mockTokens);

      const count = await tokenService.getTokenCountForAddressFromGateway(address, filter);

      expect(count).toEqual(expectedCount);
      expect(getAllTokensForAddressMock).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getTokensForAddress', () => {
    it('should return the correct tokens with balances for a valid address and filter', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.filtered.mock.json'), 'utf-8'));

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const queryPagination = { from: 0, size: 1 };
      const filter = new TokenFilter({ type: TokenType.FungibleESDT });

      jest.spyOn(tokenService, 'getAllTokensForAddress').mockResolvedValue(mockTokens);

      const result = await tokenService.getTokensForAddress(address, queryPagination, filter);

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          identifier: 'WEGLD-bd4d79',
        }),
      ]));
    });
  });

  describe('getTokenMarketCap', () => {
    it('should return market cap from cache when available', async () => {
      const rawValueMock = tokenService.getTokenMarketCapRaw = jest.fn();
      jest.spyOn(tokenService['cachingService'], 'getOrSet').mockResolvedValue(1000000);

      const result = await tokenService.getTokenMarketCap();

      expect(rawValueMock).toBeCalledTimes(0);
      expect(result).toStrictEqual(1000000);
    });
  });

  describe('getTokenMarketCap', () => {
    it('should return market cap raw from cache when available', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/tokens.mock.json'), 'utf-8'));
      const getAllTokensMock = jest.spyOn(tokenService, 'getAllTokens').mockResolvedValue(mockTokens);

      const result = await tokenService.getTokenMarketCapRaw();
      expect(result).toBeGreaterThanOrEqual(261151384.6163954);
      expect(getAllTokensMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllTokens', () => {
    const mockTokens = [
      {
        type: "FungibleESDT",
        identifier: "WEGLD-bd4d79",
        name: "WrappedEGLD",
        ticker: "WEGLD",
        owner: "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97",
        decimals: 18,
        isPaused: false,
        assets: {
          website: "https://xexchange.com",
          description: "wEGLD is an ESDT token that has the same value as EGLD, the native coin of the MultiversX blockchain.",
          status: TokenAssetStatus.active,
          pngUrl: "https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.png",
          svgUrl: "https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.svg",
          ledgerSignature: "3044022062a68d4bdd649aebb5e4ed5c6284e211c689c3b8142e59a47b01cc9997b16dfa0220475b064836849b9c4aa9c5ff18daed91a64f847bd96aa0a26768349f2cd0c24f",
          extraTokens: [],

        },
        transactions: 5998186,
        accounts: 126027,
        canUpgrade: true,
        canMint: true,
        canBurn: true,
        canChangeOwner: true,
        canAddSpecialRoles: false,
        canPause: true,
        canFreeze: true,
        canWipe: true,
      },
      {
        type: "FungibleESDT",
        identifier: "MEX-455c57",
        name: "MEX",
        ticker: "MEX",
        owner: "erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97",
        decimals: 18,
        isPaused: false,
        assets: {
          website: "https://xexchange.com",
          description: "wEGLD is an ESDT token that has the same value as EGLD, the native coin of the MultiversX blockchain.",
          status: "active",
          pngUrl: "https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.png",
          svgUrl: "https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.svg",
          ledgerSignature: "3044022062a68d4bdd649aebb5e4ed5c6284e211c689c3b8142e59a47b01cc9997b16dfa0220475b064836849b9c4aa9c5ff18daed91a64f847bd96aa0a26768349f2cd0c24f",
        },
        transactions: 5998186,
        accounts: 126027,
        canUpgrade: true,
        canMint: true,
        canBurn: true,
        canChangeOwner: true,
        canAddSpecialRoles: false,
        canPause: true,
        canFreeze: true,
        canWipe: true,
      },
    ];
    describe('getAllTokens', () => {
      it('should return nodes from API when isNodesFetchFeatureEnabled is true', async () => {
        const mockTokens: Partial<Token>[] = [{ identifier: 'mockIdentifier' }];
        const url = 'https://testnet-api.multiversx.com';

        jest.spyOn(apiConfigService, 'isTokensFetchFeatureEnabled').mockReturnValue(true);
        jest.spyOn(apiConfigService, 'getTokensFetchServiceUrl').mockReturnValue(url);
        jest.spyOn(apiService, 'get').mockResolvedValue({ data: mockTokens });
        // eslint-disable-next-line require-await
        jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, getter) => getter());

        const result = await tokenService.getAllTokens();

        expect(apiConfigService.isTokensFetchFeatureEnabled).toHaveBeenCalled();
        expect(apiService.get).toHaveBeenCalledWith(`${url}/tokens`, { params: { size: 10000 } });
        expect(result).toEqual(mockTokens);
      });

      it('should return tokens from other sources when isTokensFetchFeatureEnabled is false', async () => {

        const mockTokenProperties: Partial<TokenProperties>[] = [{ identifier: 'mockIdentifier' }];
        let mockTokens: Partial<TokenDetailed>[] = mockTokenProperties.map(properties => ApiUtils.mergeObjects(new TokenDetailed(), properties));
        const mockTokenAssets: Partial<TokenAssets> = { name: 'mockName' };
        const mockNftCollections: Partial<NftCollection>[] = [{ collection: 'mockCollection' }];
        const mockTokenSupply: Partial<EsdtSupply> = { totalSupply: '1000000000000000000', circulatingSupply: '500000000000000000' };

        jest.spyOn(apiConfigService, 'isTokensFetchFeatureEnabled').mockReturnValue(false);
        jest.spyOn(esdtService, 'getAllFungibleTokenProperties').mockResolvedValue(mockTokenProperties as TokenProperties[]);
        jest.spyOn(assetsService, 'getTokenAssets').mockResolvedValue(mockTokenAssets as TokenAssets);
        jest.spyOn(collectionService, 'getNftCollections').mockResolvedValue(mockNftCollections as NftCollection[]);

        jest.spyOn(tokenService as any, 'batchProcessTokens').mockImplementation(() => Promise.resolve());
        jest.spyOn(tokenService as any, 'applyMexLiquidity').mockImplementation(() => Promise.resolve());
        jest.spyOn(tokenService as any, 'applyMexPrices').mockImplementation(() => Promise.resolve());
        jest.spyOn(tokenService as any, 'applyMexPairType').mockImplementation(() => Promise.resolve());
        jest.spyOn(tokenService as any, 'applyMexPairTradesCount').mockImplementation(() => Promise.resolve());
        jest.spyOn(cacheService as any, 'batchApplyAll').mockImplementation(() => Promise.resolve());
        jest.spyOn(dataApiService, 'getEsdtTokenPrice').mockResolvedValue(100);
        jest.spyOn(dataApiService, 'getEgldPrice').mockResolvedValue(100);
        jest.spyOn(tokenService as any, 'fetchTokenDataFromUrl').mockResolvedValue(100);
        jest.spyOn(esdtService, 'getTokenSupply').mockResolvedValue(mockTokenSupply as EsdtSupply);

        // eslint-disable-next-line require-await
        jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, getter) => getter());

        const result = await tokenService.getAllTokens();

        expect(apiConfigService.isTokensFetchFeatureEnabled).toHaveBeenCalled();
        expect(esdtService.getAllFungibleTokenProperties).toHaveBeenCalled();

        mockTokens.forEach((mockToken) => {
          expect(assetsService.getTokenAssets).toHaveBeenCalledWith(mockToken.identifier);
        });

        expect(esdtService.getAllFungibleTokenProperties).toHaveBeenCalled();
        mockTokens.forEach(mockToken => {
          expect(assetsService.getTokenAssets).toHaveBeenCalledWith(mockToken.identifier);
          mockToken.name = mockTokenAssets.name;
        });
        expect(assetsService.getTokenAssets).toHaveBeenCalledTimes(mockTokens.length + 1); // add 1 for EGLD-000000


        expect((collectionService as any).getNftCollections).toHaveBeenCalledWith(expect.anything(), { type: [TokenType.MetaESDT] });
        mockNftCollections.forEach(collection => {
          mockTokens.push(new TokenDetailed({
            type: TokenType.MetaESDT,
            subType: collection.subType,
            identifier: collection.collection,
            name: collection.name,
            timestamp: collection.timestamp,
            owner: collection.owner,
            decimals: collection.decimals,
            canFreeze: collection.canFreeze,
            canPause: collection.canPause,
            canTransferNftCreateRole: collection.canTransferNftCreateRole,
            canWipe: collection.canWipe,
            canAddSpecialRoles: collection.canAddSpecialRoles,
            canChangeOwner: collection.canChangeOwner,
            canUpgrade: collection.canUpgrade,
          }));
        });

        expect((tokenService as any).batchProcessTokens).toHaveBeenCalledWith(mockTokens);
        expect((tokenService as any).applyMexLiquidity).toHaveBeenCalledWith(mockTokens.filter(x => x.type !== TokenType.MetaESDT));
        expect((tokenService as any).applyMexPrices).toHaveBeenCalledWith(mockTokens.filter(x => x.type !== TokenType.MetaESDT));
        expect((tokenService as any).applyMexPairType).toHaveBeenCalledWith(mockTokens.filter(x => x.type !== TokenType.MetaESDT));
        expect((tokenService as any).applyMexPairTradesCount).toHaveBeenCalledWith(mockTokens.filter(x => x.type !== TokenType.MetaESDT));
        expect((cacheService as any).batchApplyAll).toHaveBeenCalled();
        mockTokens.forEach(mockToken => {
          const priceSourcetype = mockToken.assets?.priceSource?.type;
          if (priceSourcetype === 'dataApi') {
            expect(dataApiService.getEsdtTokenPrice).toHaveBeenCalledWith(mockToken.identifier);
          } else if (priceSourcetype === 'customUrl' && mockToken.assets?.priceSource?.url) {
            const pathToPrice = mockToken.assets?.priceSource?.path ?? "0.usdPrice";
            expect((tokenService as any).fetchTokenDataFromUrl).toHaveBeenCalledWith(mockToken.assets?.priceSource?.url, pathToPrice);
          }

          if (mockToken.price) {
            expect(esdtService.getTokenSupply).toHaveBeenCalledWith(mockToken.identifier);
            mockToken.supply = mockTokenSupply.totalSupply;

            if (mockToken.circulatingSupply) {
              mockToken.marketCap = mockToken.price * NumberUtils.denominateString(mockToken.circulatingSupply.toString(), mockToken.decimals);
            }
          }
        });

        mockTokens = mockTokens.sortedDescending(
          token => token.assets ? 1 : 0,
          token => token.isLowLiquidity ? 0 : (token.marketCap ?? 0),
          token => token.transactions ?? 0,
        );

        mockTokens.push(new TokenDetailed({
          identifier: 'EGLD-000000',
          name: 'EGLD',
          canPause: false,
          canUpgrade: false,
          canWipe: false,
          price: 100,
          decimals: 18,
          isLowLiquidity: false,
          marketCap: 0,
          circulatingSupply: '0',
          supply: '0',
          assets: {
            name: 'mockName',
          } as TokenAssets,
        }));

        expect(result).toEqual(mockTokens);
      });
    });

    it('should return values from cache', async () => {
      const cachedValueMock = jest.spyOn(tokenService['cachingService'], 'getOrSet').mockResolvedValue(mockTokens);

      const result = await tokenService.getAllTokens();
      expect(result).toEqual(mockTokens);
      expect(cachedValueMock).toHaveBeenCalledTimes(1);
      expect(cachedValueMock).toHaveBeenCalledWith(
        CacheInfo.AllEsdtTokens.key,
        expect.any(Function),
        CacheInfo.AllEsdtTokens.ttl,
      );
      expect(esdtService.getAllFungibleTokenProperties).not.toHaveBeenCalled();
      expect(collectionService.getNftCollections).not.toHaveBeenCalled();
    });
  });

  describe('getLogoPng, getLogoSvg', () => {
    const assetsMock: TokenAssets = {
      website: 'https://example.com',
      description: 'Example token',
      name: 'Example',
      status: TokenAssetStatus.active,
      pngUrl: 'https://example.com/token.png',
      svgUrl: 'https://example.com/token.svg',
      ledgerSignature: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
      lockedAccounts: {
        'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97': '1000000000000000000',
        'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x91': '500000000000000000',
      },
      extraTokens: ['MEX-455c57', 'USDC-c76f1f'],
      preferredRankAlgorithm: NftRankAlgorithm.trait,
      priceSource: undefined,
    };

    it('should return undefined if there are no assets for the identifier', async () => {
      const identifier = 'WEGLD-bd4d79';
      const tokenAssetesMock = jest.spyOn(tokenService['assetsService'], 'getTokenAssets').mockReturnValueOnce(Promise.resolve(undefined));

      const result = await tokenService.getLogoPng(identifier);

      expect(result).toBeUndefined();
      expect(tokenAssetesMock).toHaveBeenCalledTimes(1);
      expect(tokenAssetesMock).toHaveBeenCalledWith(identifier);
    });

    it('should return the PNG URL if assets exist for the identifier', async () => {
      const identifier = 'WEGLD-bd4d79';

      const pngUrl = 'https://example.com/token.png';
      const tokenAssetesMock = jest.spyOn(tokenService['assetsService'], 'getTokenAssets').mockReturnValueOnce(Promise.resolve(assetsMock));

      const result = await tokenService.getLogoPng(identifier);

      expect(result).toEqual(pngUrl);
      expect(tokenAssetesMock).toHaveBeenCalledTimes(1);
      expect(tokenAssetesMock).toHaveBeenCalledWith(identifier);
    });

    it('should return undefined if there are no assets for the identifier', async () => {
      const identifier = 'WEGLD-bd4d79';
      const tokenAssetesMock = jest.spyOn(tokenService['assetsService'], 'getTokenAssets').mockReturnValueOnce(Promise.resolve(undefined));

      const result = await tokenService.getLogoSvg(identifier);

      expect(result).toBeUndefined();
      expect(tokenAssetesMock).toHaveBeenCalledTimes(1);
      expect(tokenAssetesMock).toHaveBeenCalledWith(identifier);
    });

    it('should return the SVG URL if assets exist for the identifier', async () => {
      const identifier = 'WEGLD-bd4d79';

      const pngUrl = 'https://example.com/token.svg';
      const tokenAssetesMock = jest.spyOn(tokenService['assetsService'], 'getTokenAssets').mockReturnValueOnce(Promise.resolve(assetsMock));

      const result = await tokenService.getLogoSvg(identifier);

      expect(result).toEqual(pngUrl);
      expect(tokenAssetesMock).toHaveBeenCalledTimes(1);
      expect(tokenAssetesMock).toHaveBeenCalledWith(identifier);
    });
  });

  describe('getTokenAccountsCount', () => {
    const identifier = 'WEGLD-bd4d79';
    const propertiesMock: TokenProperties = {
      identifier: 'WEGLD-bd4d79',
      name: 'WrappedEGLD',
      type: EsdtType.FungibleESDT,
      subType: undefined,
      owner: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
      wiped: '',
      decimals: 18,
      isPaused: false,
      tags: [],
      royalties: 0,
      uris: [],
      url: '',
      canUpgrade: true,
      canMint: true,
      canBurn: true,
      canChangeOwner: true,
      canPause: true,
      canFreeze: true,
      canWipe: true,
      canAddSpecialRoles: false,
      canTransferNFTCreateRole: false,
      NFTCreateStopped: false,
      timestamp: 1643824710,
      ownersHistory: [
        {
          address: 'erd1qqqqqqqqqqqqqpgq0lzzvt2faev4upyf586tg38s84d7zsaj2jpsglugga',
          timestamp: 1643824710,
        },
      ],
    };

    it('should returns undefined if getTokenProperties returns undefined', async () => {
      const tokensPropertiesMock = jest.spyOn(tokenService, 'getTokenProperties').mockResolvedValueOnce(Promise.resolve(undefined));
      const result = await tokenService.getTokenAccountsCount(identifier);

      expect(result).toStrictEqual(undefined);
      expect(tokensPropertiesMock).toHaveBeenCalledTimes(1);
    });

    it('should returns total number of accounts for a given identifier', async () => {
      const tokensPropertiesMock = jest.spyOn(tokenService, 'getTokenProperties').mockResolvedValueOnce(propertiesMock);
      const indexerAccountsCountMock = jest.spyOn(tokenService['indexerService'], 'getTokenAccountsCount').mockResolvedValueOnce(Promise.resolve(10));
      const result = await tokenService.getTokenAccountsCount(identifier);

      expect(result).toStrictEqual(10);
      expect(indexerAccountsCountMock).toHaveBeenCalledTimes(1);
      expect(tokensPropertiesMock).toHaveBeenCalledTimes(1);
      expect(indexerAccountsCountMock).toHaveBeenCalledWith(identifier);
      expect(tokensPropertiesMock).toHaveBeenCalledWith(identifier);
    });
  });

  describe('getTokenAccounts', () => {
    const identifier = 'WEGLD-bd4d79';
    const propertiesMock: TokenProperties = {
      identifier: 'WEGLD-bd4d79',
      name: 'WrappedEGLD',
      type: EsdtType.FungibleESDT,
      subType: undefined,
      owner: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
      wiped: '',
      decimals: 18,
      isPaused: false,
      tags: [],
      royalties: 0,
      uris: [],
      url: '',
      canUpgrade: true,
      canMint: true,
      canBurn: true,
      canChangeOwner: true,
      canPause: true,
      canFreeze: true,
      canWipe: true,
      canAddSpecialRoles: false,
      canTransferNFTCreateRole: false,
      NFTCreateStopped: false,
      timestamp: 1643824710,
      ownersHistory: [
        {
          address: 'erd1qqqqqqqqqqqqqpgq0lzzvt2faev4upyf586tg38s84d7zsaj2jpsglugga',
          timestamp: 1643824710,
        },
      ],
    };

    const assets = {
      erd16jruked88jgtsar78ej85hjp3qsd9jkjcw4swsn7k0teqh3wgcqqgyrupq: new AccountAssets({
        name: 'Exchange: Tests',
        description: '',
        tags: ['exchange', 'tests'],
        iconPng:
          'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/test.png',
        iconSvg:
          'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/test.svg',
      }),
    };

    it('should returns undefined if getTokenProperties returns undefined', async () => {
      const tokensPropertiesMock = jest.spyOn(tokenService, 'getTokenProperties').mockResolvedValueOnce(Promise.resolve(undefined));
      const result = await tokenService.getTokenAccounts(new QueryPagination(), identifier);

      expect(result).toStrictEqual(undefined);
      expect(tokensPropertiesMock).toHaveBeenCalledTimes(1);
    });

    it('should return an array of accounts for given identifier', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/token.accounts.mock.json'), 'utf-8'));
      const tokensPropertiesMock = jest.spyOn(tokenService, 'getTokenProperties').mockResolvedValueOnce(Promise.resolve(propertiesMock));
      const tokenAccountsMock = jest.spyOn(indexerService, 'getTokenAccounts').mockResolvedValueOnce(mockTokens);
      const accountAssetsMock = jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValueOnce(assets);

      const results = await tokenService.getTokenAccounts(new QueryPagination(), identifier);
      if (results) {
        expect(results.length).toEqual(mockTokens.length);

        for (const result of results) {
          expect(result.hasOwnProperty('address')).toBe(true);
          expect(result.hasOwnProperty('balance')).toBe(true);
          expect(result.hasOwnProperty('assets')).toBe(true);
        }
      }
      expect(tokensPropertiesMock).toHaveBeenCalledTimes(1);
      expect(tokenAccountsMock).toHaveBeenCalledTimes(1);
      expect(accountAssetsMock).toHaveBeenCalledTimes(1);
    });

    it('should return single account for given identifier', async () => {
      const mockTokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../../mocks/token.accounts.mock.json'), 'utf-8'));
      const tokensPropertiesMock = jest.spyOn(tokenService, 'getTokenProperties').mockResolvedValueOnce(Promise.resolve(propertiesMock));
      const tokenAccountsMock = jest.spyOn(indexerService, 'getTokenAccounts').mockResolvedValueOnce([mockTokens[2]]);
      const accountAssetsMock = jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValueOnce(assets);

      const results = await tokenService.getTokenAccounts(new QueryPagination({ size: 1 }), identifier);
      if (results) {
        for (const result of results) {
          expect(result.address).toStrictEqual("erd1qqqqqqqqqqqqqpgq0lzzvt2faev4upyf586tg38s84d7zsaj2jpsglugga");
          expect(result.hasOwnProperty('address')).toBe(true);
          expect(result.hasOwnProperty('balance')).toBe(true);
          expect(result.hasOwnProperty('assets')).toBe(true);
        }
      }
      expect(tokensPropertiesMock).toHaveBeenCalledTimes(1);
      expect(tokenAccountsMock).toHaveBeenCalledTimes(1);
      expect(accountAssetsMock).toHaveBeenCalledTimes(1);
    });
  });
});
