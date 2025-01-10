import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";
import { DelegationService } from "src/endpoints/delegation/delegation.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { WaitingListService } from "src/endpoints/waiting-list/waiting.list.service";
import { AccountController } from "src/endpoints/accounts/account.controller";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { AccountModule } from "src/endpoints/accounts/account.module";
import { CollectionModule } from "src/endpoints/collections/collection.module";
import { DelegationLegacyModule } from "src/endpoints/delegation.legacy/delegation.legacy.module";
import { DelegationModule } from "src/endpoints/delegation/delegation.module";
import { NftModule } from "src/endpoints/nfts/nft.module";
import { SmartContractResultModule } from "src/endpoints/sc-results/scresult.module";
import { StakeModule } from "src/endpoints/stake/stake.module";
import { TokenModule } from "src/endpoints/tokens/token.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransferModule } from "src/endpoints/transfers/transfer.module";
import { WaitingListModule } from "src/endpoints/waiting-list/waiting.list.module";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ConfigModule } from "@nestjs/config";
import { AccountDeferred } from "src/endpoints/accounts/entities/account.deferred";
import request = require('supertest');
import { mockAccountService, mockTokenService, mockNftService, mockDelegationLegacyService, mockWaitingListService, mockStakeService, mockTransactionService, mockSmartContractResultService, mockCollectionService, mockTransferService, mockApiConfigService, mockDelegationService } from "./services.mock/account.services.mock";
import { AccountFetchOptions } from "src/endpoints/accounts/entities/account.fetch.options";

describe('AccountController', () => {
  let app: INestApplication;
  const path = "/accounts";

  const accountServiceMocks = mockAccountService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      imports: [
        AccountModule,
        TokenModule,
        NftModule,
        DelegationLegacyModule,
        WaitingListModule,
        StakeModule,
        TransactionModule,
        SmartContractResultModule,
        CollectionModule,
        TransferModule,
        ApiConfigModule,
        DelegationModule,
        ConfigModule.forRoot({}),
      ],
    })
      .overrideProvider(AccountService).useValue(accountServiceMocks)
      .overrideProvider(TokenService).useValue(mockTokenService())
      .overrideProvider(NftService).useValue(mockNftService())
      .overrideProvider(DelegationLegacyService).useValue(mockDelegationLegacyService())
      .overrideProvider(WaitingListService).useValue(mockWaitingListService())
      .overrideProvider(StakeService).useValue(mockStakeService())
      .overrideProvider(TransactionService).useValue(mockTransactionService())
      .overrideProvider(SmartContractResultService).useValue(mockSmartContractResultService())
      .overrideProvider(CollectionService).useValue(mockCollectionService())
      .overrideProvider(TransferService).useValue(mockTransferService())
      .overrideProvider(ApiConfigService).useValue(mockApiConfigService())
      .overrideProvider(DelegationService).useValue(mockDelegationService())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("GET /accounts", () => {
    it('should return the default list of 25 accounts', async () => {
      const defaultAccountsList = createMockAccountsList(25);
      accountServiceMocks.getAccounts.mockReturnValue(defaultAccountsList);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(25);
          expect(response.body).toEqual(defaultAccountsList);
        });
    });

    it('should return a paginated list of accounts when "from" and "size" query parameters are provided', async () => {
      const paginatedAccountsList = createMockAccountsList(10);
      accountServiceMocks.getAccounts.mockReturnValue(paginatedAccountsList);

      const queryPagination = new QueryPagination({ from: 5, size: 10 });
      await request(app.getHttpServer())
        .get(`${path}?from=${queryPagination.from}&size=${queryPagination.size}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(10);
          expect(response.body).toEqual(paginatedAccountsList);
        });
    });

    it('should sort accounts by balance when sort query parameter is set to balance', async () => {
      const sortedAccountsList = createMockAccountsList(10).sort((a, b) => parseInt(a.balance) - parseInt(b.balance));
      accountServiceMocks.getAccounts.mockReturnValue(sortedAccountsList);

      const sort = 'balance';
      await request(app.getHttpServer())
        .get(`/accounts?sort=${sort}`)
        .expect(200);

      expect(accountServiceMocks.getAccounts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sort: 'balance',
        })
      );
    });

    it('should return only smart contracts when isSmartContract query parameter is set to true', async () => {
      const smartContractsList = createMockAccountsList(5, undefined, true);
      accountServiceMocks.getAccounts.mockReturnValue(smartContractsList);
      await request(app.getHttpServer())
        .get(`${path}?isSmartContract=true`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(5);
        });
    });
  });

  describe('GET /accounts/count', () => {
    it('should return total accounts count', async () => {
      accountServiceMocks.getAccountsCount.mockReturnValue(100);

      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(100);
        });
    });

    it('should return total smart contracts count', async () => {
      const params = new URLSearchParams({ isSmartContract: "true" }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(25);
        });
    });

    it('should return accounts details for a given owner address', async () => {
      const ownerAddress: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
      const params = new URLSearchParams({ ownerAddress: ownerAddress }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(25);
        });
    });

    it('should throw 400 Bad Request for a given invalid Bech32 owner address', async () => {
      const ownerAddress: string = "invalidBech32Address";
      const params = new URLSearchParams({ ownerAddress: ownerAddress }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'ownerAddress' (a bech32 address is expected)");
        });
    });

    it('should throw 400 Bad Request for a given isSmartContract value', async () => {
      const params = new URLSearchParams({ isSmartContract: "invalidBoolean" }).toString();
      accountServiceMocks.getAccountsCount.mockReturnValue(25);

      await request(app.getHttpServer())
        .get(`${path}/count?${params}`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'isSmartContract' (optional boolean string is expected)");
        });
    });
  });

  describe('GET /accounts/c', () => {
    it('should return total alternative accounts count', async () => {
      accountServiceMocks.getAccountsCount.mockReturnValue(100);

      await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(100);
        });
    });
  });

  describe('GET /accounts/:address', () => {
    const mockAccount = {
      address: 'erd1vtlpm6sxxvmgt43ldsrpswjrfcsudmradylpxn9jkp66ra3rkz4qruzvfw',
      balance: '707809',
      nonce: 46,
      timestamp: 1708946805,
      shard: 3,
      ownerAddress: 'erd1vtlpm6sxxvmgt43ldsrpswjrfcsudmradylpxn9jkp66ra3rkz4qruzvfw',
      ownerAssets: undefined,
      assets: undefined,
    };

    it('should return account details for a given address', async () => {
      accountServiceMocks.getAccount.mockReturnValue(mockAccount);

      await request(app.getHttpServer())
        .get(`${path}/${mockAccount.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccount);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            mockAccount.address,
            new AccountFetchOptions({
              withGuardianInfo: undefined,
              withTxCount: undefined,
              withScrCount: undefined,
              withTimestamp: undefined,
              withAssets: undefined,
            })
          );
        });
    });

    it('should throw 400 Bad Request for a given invalid address value', async () => {
      await request(app.getHttpServer())
        .get(`${path}/erd1...`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

    it('should return account details with withTxCount parameter', async () => {
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithTxCount = {
        ...mockAccount,
        txCount: 100,
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithTxCount);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withTxCount=true`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithTxCount);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: undefined,
              withTxCount: true,
              withScrCount: undefined,
              withTimestamp: undefined,
              withAssets: undefined,
            })
          );
        });
    });

    it('should return account details with withScrCount parameter', async () => {
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithScrCount = {
        ...mockAccount,
        scrCount: 50,
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithScrCount);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withScrCount=true`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithScrCount);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: undefined,
              withTxCount: undefined,
              withScrCount: true,
              withTimestamp: undefined,
              withAssets: undefined,
            })
          );
        });
    });

    it('should return account details with withTimestamp parameter', async () => {
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithTimestamp = {
        ...mockAccount,
        timestamp: 1708946805,
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithTimestamp);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withTimestamp=true`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithTimestamp);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: undefined,
              withTxCount: undefined,
              withScrCount: undefined,
              withTimestamp: true,
              withAssets: undefined,
            })
          );
        });
    });

    it('should return account details with withAssets parameter', async () => {
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithAssets = {
        ...mockAccount,
        assets: {
          name: "Test Asset",
          description: "Test Description",
        },
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithAssets);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withAssets=true`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithAssets);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: undefined,
              withTxCount: undefined,
              withScrCount: undefined,
              withTimestamp: undefined,
              withAssets: true,
            })
          );
        });
    });

    it('should return account details with all optional parameters set to true', async () => {
      const mockAddressList = createMockAccountsList(1);
      const accountDetails = mockAddressList[0];
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithAllParams = {
        ...accountDetails,
        isGuarded: true,
        activeGuardianActivationEpoch: 496,
        activeGuardianAddress: "erd1x5d4p63uwcns8cvyrl4g3qgvwwa2nkt5jdp0vwetc7csqzpjzz0qec58k0",
        activeGuardianServiceUid: "MultiversXTCSService",
        txCount: 100,
        scrCount: 50,
        timestamp: 1708946805,
        assets: {
          name: "Test Asset",
          description: "Test Description",
        },
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithAllParams);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withGuardianInfo=true&withTxCount=true&withScrCount=true&withTimestamp=true&withAssets=true`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithAllParams);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: true,
              withTxCount: true,
              withScrCount: true,
              withTimestamp: true,
              withAssets: true,
            })
          );
        });
    });

    it('should return account details filtered by fields', async () => {
      const address = "erd1s6uspvcnwr254ag8urs62m8e554hkf8yqpegwrgtxvzw3ddksjcs66g0u2";
      const fields = ['balance', 'nonce'];
      const mockAccountFilteredFields = {
        balance: "1000",
        nonce: 1,
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountFilteredFields);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?fields=${fields.join(',')}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountFilteredFields);
          expect(Object.keys(response.body).sort()).toEqual(fields.sort());
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: undefined,
              withTxCount: undefined,
              withScrCount: undefined,
              withTimestamp: undefined,
              withAssets: undefined,
            })
          );
        });
    });

    it('should return account details with all filters set to false', async () => {
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithAllParamsFalse = {
        ...mockAccount,
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithAllParamsFalse);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withGuardianInfo=false&withTxCount=false&withScrCount=false&withTimestamp=false&withAssets=false`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithAllParamsFalse);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: false,
              withTxCount: false,
              withScrCount: false,
              withTimestamp: false,
              withAssets: false,
            })
          );
        });
    });

    it('should return account details with all filters set to true', async () => {
      const address = "erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p";
      const mockAccountWithAllParamsTrue = {
        ...mockAccount,
        guardianInfo: {
          guarded: true,
          activeGuardian: "erd1guardianaddress",
        },
        txCount: 100,
        scrCount: 50,
        timestamp: 1708946805,
        assets: {
          name: "Test Asset",
          description: "Test Description",
        },
      };

      accountServiceMocks.getAccount.mockResolvedValue(mockAccountWithAllParamsTrue);

      await request(app.getHttpServer())
        .get(`/accounts/${address}?withGuardianInfo=true&withTxCount=true&withScrCount=true&withTimestamp=true&withAssets=true`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockAccountWithAllParamsTrue);
          expect(accountServiceMocks.getAccount).toHaveBeenCalledWith(
            address,
            new AccountFetchOptions({
              withGuardianInfo: true,
              withTxCount: true,
              withScrCount: true,
              withTimestamp: true,
              withAssets: true,
            })
          );
        });
    });

    it('should throw 404 Not Found when account does not exist', async () => {
      const address = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
      accountServiceMocks.getAccount.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`${path}/${address}`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toEqual('Account not found');
        });
    });
  });

  describe("GET /accounts/:address/deferred", () => {
    const address = "erd1s6uspvcnwr254ag8urs62m8e554hkf8yqpegwrgtxvzw3ddksjcs66g0u2";

    it('should return deferred payments from legacy staking', async () => {
      const mockDeferred: AccountDeferred[] = [
        {
          deferredPayment: "1",
          secondsLeft: 2,
        },
      ];

      accountServiceMocks.getDeferredAccount.mockResolvedValue(mockDeferred);

      await request(app.getHttpServer())
        .get(`/accounts/${address}/deferred`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockDeferred);
        });
    });

    it('should return an empty array when there are no deferred payments', async () => {
      accountServiceMocks.getDeferredAccount.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get(`/accounts/${address}/deferred`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual([]);
        });
    });

    it('should return 400 Bad Request for an invalid address format', async () => {
      const invalidAddress = "invalid_address";

      await request(app.getHttpServer())
        .get(`/accounts/${invalidAddress}/deferred`)
        .expect(400)
        .expect(response => {
          expect(response.body.message).toContain("Validation failed for argument 'address' (a bech32 address is expected)");
        });
    });

  });

  afterAll(async () => {
    await app.close();
  });

  function createMockAccountsList(numberOfAccounts: number, ownerAddress = null, includeSmartContracts = false) {
    return Array.from({ length: numberOfAccounts }, (_, index) => {
      const isSmartContractAddress = includeSmartContracts && Math.random() < 0.5;

      return {
        address: ownerAddress || (isSmartContractAddress ? generateMockSmartContractAddress() : generateMockAddress()),
        balance: generateRandomBalance(),
        nonce: Math.floor(Math.random() * 100),
        timestamp: Math.floor(Date.now() / 1000) - index * 1000,
        shard: Math.floor(Math.random() * 4),
        ownerAddress: ownerAddress || generateMockAddress(),
        ownerAssets: undefined,
        assets: undefined,
      };
    });
  }

  function generateMockSmartContractAddress() {
    const prefix = 'erd1';
    const middle = 'q'.repeat(38);
    const suffixLength = 62 - prefix.length - middle.length;
    let suffix = '';

    while (suffix.length < suffixLength) {
      suffix += Math.random().toString(36).substring(2);
    }

    suffix = suffix.substring(0, suffixLength);

    return `${prefix}${middle}${suffix}`;
  }

  function generateRandomBalance() {
    return (Math.floor(Math.random() * 1000000) + 100000).toString();
  }

  function generateMockAddress() {
    const desiredLength = 62 - 'erd1'.length;
    let address = 'erd1';

    while (address.length < desiredLength + 'erd1'.length) {
      address += Math.random().toString(36).substring(2);
    }

    return address.substring(0, desiredLength + 'erd1'.length);
  }
});


