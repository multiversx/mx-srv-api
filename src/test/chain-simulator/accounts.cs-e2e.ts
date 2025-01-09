import axios from "axios";
import { config } from "./config/env.config";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";

describe('Accounts e2e tests with chain simulator', () => {
  describe('GET /accounts with query parameters', () => {
    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?from=0&size=5`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(5);
    });

    it('should filter accounts by owner address', async () => {
      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts?ownerAddress=${address}`);
      expect(response.status).toBe(200);

      for (const account of response.data) {
        expect(account.ownerAddress).toBe(address);
      }
    });

    it('should filter smart contract accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?isSmartContract=true`);
      expect(response.status).toBe(200);

      for (const account of response.data) {
        expect(account.shard).toBe(4294967295);
      }
    });

    it('should search accounts by address', async () => {
      const searchTerm = config.aliceAddress.substring(0, 10);
      const response = await axios.get(`${config.apiServiceUrl}/accounts?search=${searchTerm}`);
      expect(response.status).toBe(200);

      for (const account of response.data) {
        expect(account.address.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });

    it('should return accounts with transaction count when requested', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts?withTxCount=true&withDeployInfo=true`);
      expect(response.status).toBe(200);
      for (const account of response.data) {
        expect(account).toHaveProperty('txCount');
      }
    });

    it('should validate account structure', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts`);
      expect(response.status).toBe(200);

      response.data.forEach((account: any) => {
        expect(account).toHaveProperty('address');
        expect(account).toHaveProperty('balance');
        expect(account).toHaveProperty('nonce');
        expect(account).toHaveProperty('timestamp');
        expect(account).toHaveProperty('shard');
      });
    });
  });

  describe('GET /accounts/count', () => {
    it('should return the total number of accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should filter accounts by owner address', async () => {
      const ownerAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/count?ownerAddress=${ownerAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBe(1);
    });

    it('should filter smart contract accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/count?isSmartContract=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/c alternative', () => {
    it('should return the total number of accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/c`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should filter accounts by owner address', async () => {
      const ownerAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/c?ownerAddress=${ownerAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBe(1);
    });

    it('should filter smart contract accounts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/c?isSmartContract=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address', () => {
    it('should return account details for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}`);
      expect(response.status).toBe(200);
    });

    it('should return account details for a given address with guardian info', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}?withGuardianInfo=true`);
      expect(response.status).toBe(200);
      expect(response.data.isGuarded).toBe(false);
    });

    it('should return correct account details with all fields', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}`);
      expect(response.status).toBe(200);

      expect(response.data.balance).toBeDefined();
      expect(response.data.shard).toBeDefined();
      expect(response.data.nonce).toBeDefined();
      expect(response.data.txCount).toBeDefined();
      expect(response.data.scrCount).toBeDefined();

      expect(typeof response.data.balance).toBe('string');
      expect(typeof response.data.shard).toBe('number');
      expect(typeof response.data.nonce).toBe('number');
      expect(typeof response.data.txCount).toBe('number');
      expect(typeof response.data.scrCount).toBe('number');
    });

    it('should return 400 for non-existent / invalid address', async () => {
      const invalidAddress = 'erd1invalid000000000000000000000000000000000000000000000000000';
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${invalidAddress}`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return address field in response when fields query parameter is provided', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}?fields=address`);
      expect(response.status).toBe(200);
      expect(response.data.address).toBeDefined();
    });
  });

  describe('GET /accounts/:address/tokens', () => {
    it('should return tokens for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return tokens with correct structure', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token).toHaveProperty('type');
        expect(token).toHaveProperty('identifier');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('ticker');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('balance');
        expect(typeof token.balance).toBe('string');
      }
    });

    it('should filter tokens by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?type=FungibleESDT`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token.type).toBe('FungibleESDT');
      }
    });

    it('should search tokens by name', async () => {
      const searchTerm = 'Token';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?name=${searchTerm}`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });

    it('should filter tokens by identifier', async () => {
      const accountToken = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifier = accountToken.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens?identifier=${identifier}`);
      expect(response.status).toBe(200);

      for (const token of response.data) {
        expect(token.identifier).toBe(identifier);
      }
    });

    it('should return empty array for non-existent address', async () => {
      const invalidAddress = 'erd1invalid000000000000000000000000000000000000000000000000000';
      try {
        const response = await axios.get(`${config.apiServiceUrl}/accounts/${invalidAddress}/tokens`);
        expect(response.status).toBe(200);
        expect(response.data).toEqual([]);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /accounts/:address/tokens/count', () => {
    it('should return the total number of tokens for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should filter tokens by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?type=FungibleESDT`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return 0 for an address with 0 tokens', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.bobAddress}/tokens/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBe(0);
      expect(typeof response.data).toBe('number');
    });

    it('should filter tokens by name', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?name=Token`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
    });

    it('should filter tokens by identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?identifier=${identifier}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should filter tokens by identifiers', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifiers = tokens.data.map((token: any) => token.identifier);
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/count?identifiers=${identifiers.join(',')}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(identifiers.length);
    });
  });

  describe('GET /accounts/:address/tokens/:token', () => {
    it('should return token details for a given address and token', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const identifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens/${identifier}`);

      expect(response.status).toBe(200);
      expect(response.data.identifier).toStrictEqual(identifier);
    });
  });

  describe('GET /accounts/:address/roles/collections', () => {
    it('should return collections with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections`);
      expect(response.status).toBe(200);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.owner).toBe(config.aliceAddress);
      }
    });

    it('should return results by canCreate parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canCreate=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canCreate).toBe(false);
      }
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canBurn=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canBurn).toBe(false);
      }
    });

    it('should return results by canAddQuantity parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canAddQuantity=false`);
      expect(response.status).toBe(200);
    });

    it('should return results by canUpdateAttributes parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canUpdateAttributes=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canUpdateAttributes).toBe(false);
      }
    });

    it('should return results by canAddUri parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canAddUri=false`);
      expect(response.status).toBe(200);

      for (const collection of response.data) {
        expect(collection.canAddUri).toBe(false);
      }
    });

    it('should return results by canTransferRole parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections?canTransferRole=false`);
      expect(response.status).toBe(200);
    });

    it('should return collection with all expected fields', async () => {
      const expectedProperties = [
        'collection',
        'type',
        'subType',
        'name',
        'ticker',
        'owner',
        'timestamp',
        'canFreeze',
        'canWipe',
        'canPause',
        'canTransferNftCreateRole',
        'canChangeOwner',
        'canUpgrade',
        'canAddSpecialRoles',
        'canTransfer',
        'canCreate',
        'canBurn',
        'canUpdateAttributes',
        'canAddUri',
      ];

      const expectedRoleProperties = [
        'canCreate',
        'canBurn',
        'canAddQuantity',
        'canUpdateAttributes',
        'canAddUri',
      ];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections`);
      expect(response.status).toBe(200);

      const collection = response.data[0];

      for (const property of expectedProperties) {
        expect(collection).toHaveProperty(property);
      }

      expect(collection).toHaveProperty('role');
      for (const property of expectedRoleProperties) {
        expect(collection.role).toHaveProperty(property);
      }
    });
  });

  describe('GET /accounts/:address/roles/collections/count', () => {
    it('should return the total number of collections with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
    });

    it('should return results by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?type=NonFungibleESDT`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canAddQuantity parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?canAddQuantity=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by excludeMetaESDT parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/count?excludeMetaESDT=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/roles/collections/:collection', () => {
    it('should return collection details with roles for a given address and collection', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections`);
      const collection = collections.data[0].collection;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/${collection}`);

      expect(response.status).toBe(200);
      expect(response.data.collection).toBe(collection);

      const expectedProperties = [
        'collection',
        'type',
        'subType',
        'name',
        'ticker',
        'owner',
        'timestamp',
        'canFreeze',
        'canWipe',
        'canPause',
        'canTransferNftCreateRole',
        'canChangeOwner',
        'canUpgrade',
        'canAddSpecialRoles',
        'canTransfer',
        'canCreate',
        'canBurn',
        'canUpdateAttributes',
        'canAddUri',
      ];

      for (const property of expectedProperties) {
        expect(response.data).toHaveProperty(property);
      }
    });

    it('should return 404 for non-existent collection', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/collections/NFT2-b1cf6d`);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('GET /accounts/:address/roles/tokens', () => {
    it('should return tokens with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(0);

      const expectedProperties = [
        'type',
        'subType',
        'identifier',
        'name',
        'ticker',
        'owner',
        'decimals',
        'isPaused',
        'transactions',
        'transactionsLastUpdatedAt',
        'transfers',
        'transfersLastUpdatedAt',
        'accounts',
        'accountsLastUpdatedAt',
        'canUpgrade',
        'canMint',
        'canChangeOwner',
        'canAddSpecialRoles',
        'canPause',
        'canFreeze',
        'canWipe',
        'timestamp',
        'mexPairType',
        'ownersHistory',
        'role',
        'canLocalMint',
        'canLocalBurn',
        'canTransfer',
      ];

      for (const property of expectedProperties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canMint parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?canMint=false`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?canBurn=false`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return results based on search parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens?search=Token1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/roles/tokens/count', () => {
    it('should return the total number of tokens with roles for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(1);
    });

    it('should return results by owner parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?owner=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canMint parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?canMint=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by canBurn parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?canBurn=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return results by search parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/count?search=Token1`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/roles/tokens/:identifier', () => {
    it('should return token details with roles for a given address and identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens`);
      const identifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/roles/tokens/${identifier}`);

      expect(response.status).toBe(200);

      const expectedProperties = [
        'type',
        'subType',
        'identifier',
        'name',
        'ticker',
        'owner',
        'decimals',
        'isPaused',
        'transactions',
        'transactionsLastUpdatedAt',
        'transfers',
        'transfersLastUpdatedAt',
        'accounts',
        'accountsLastUpdatedAt',
        'canUpgrade',
        'canMint',
        'canChangeOwner',
        'canAddSpecialRoles',
        'canPause',
        'canFreeze',
        'canWipe',
        'timestamp',
        'mexPairType',
        'ownersHistory',
        'role',
        'canLocalMint',
        'canLocalBurn',
        'canTransfer',
      ];

      for (const property of expectedProperties) {
        expect(response.data).toHaveProperty(property);
      }
    });
  });

  //TODO: Add tests for the collections endpoint when CS is updated
  describe.skip('GET /accounts/:address/collections', () => {
    it('should return NFT collections for a specific address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/stake', () => {
    it('should return stake details for a specific address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/stake`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalStaked');
    });
  });

  describe('GET /accounts/:address/delegation-legacy', () => {
    it('should return delegation details for a specific address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/delegation-legacy`);
      expect(response.status).toBe(200);

      const expectedProperties = [
        'userWithdrawOnlyStake',
        'userWaitingStake',
        'userActiveStake',
        'userUnstakedStake',
        'userDeferredPaymentStake',
        'claimableRewards',
      ];

      for (const property of expectedProperties) {
        expect(response.data).toHaveProperty(property);
      }
    });
  });

  describe('GET /accounts/:address/deploys', () => {
    it('should return deploys details for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/deploys`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      const properties = [
        'address',
        'deployTxHash',
        'timestamp',
      ];

      for (const property of properties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/deploys?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/deploys/count', () => {
    it('should return the total number of deploys for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/deploys/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/deploys/c alternative', () => {
    it('should return the total number of deploys for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/deploys/c`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/contracts', () => {
    it('should return contracts details for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/contracts`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/contracts?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/contracts/count', () => {
    it('should return the total number of contracts for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/contracts/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/contracts/c alternative', () => {
    it('should return the total number of contracts for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/contracts/c`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/results', () => {
    it('should return smart contract results for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/results`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/results?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(1);
    });

    it('should return results with properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/results`);
      const properties = [
        'hash',
        'timestamp',
        'nonce',
        'gasLimit',
        'gasPrice',
        'value',
        'sender',
        'receiver',
        'data',
        'prevTxHash',
        'originalTxHash',
        'callType',
        'miniBlockHash',
        'status',
      ];

      for (const property of properties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });
  });

  describe('GET /accounts/:address/results/count', () => {
    it('should return the total number of smart contract results for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/results/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/results/:scHash', () => {
    it('should return smart contract result for a given address and scHash', async () => {
      const results = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/results`);
      const scHash = results.data[0].hash;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/results/${scHash}`);
      const properties = [
        'hash',
        'timestamp',
        'nonce',
        'gasLimit',
        'gasPrice',
        'value',
        'sender',
        'receiver',
        'data',
        'prevTxHash',
        'originalTxHash',
        'callType',
        'miniBlockHash',
        'status',
      ];

      for (const property of properties) {
        expect(response.data).toHaveProperty(property);
      }
      expect(response.status).toBe(200);
    });
  });

  describe('GET /accounts/:address/history', () => {
    it('should return account history for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/history`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      const properties = [
        'address',
        'balance',
        'timestamp',
        'isSender',
      ];

      for (const property of properties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/history?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/history/count', () => {
    it('should return the total number of account history for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/history/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/history/:tokenIdentifier/count', () => {
    it('should return the total number of account history for a given address and token identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const tokenIdentifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/history/${tokenIdentifier}/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/esdthistory', () => {
    it('should return account esdt history for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/esdthistory`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/esdthistory?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(1);
    });

    it('should return results with properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/esdthistory`);
      const properties = [
        'address',
        'balance',
        'timestamp',
        'token',
      ];

      for (const property of properties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });

    it('should return results with token parameter', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const tokenIdentifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/esdthistory?token=${tokenIdentifier}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });
  });

  describe('GET /accounts/:address/esdthistory/count', () => {
    it('should return the total number of account esdt history for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/esdthistory/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of account esdt history for a given address and token identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const tokenIdentifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/esdthistory/count?token=${tokenIdentifier}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(1);
    });
  });

  describe('GET /accounts/:address/history/:tokenIdentifier', () => {
    it('should return account history for a given address and token identifier', async () => {
      const tokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const tokenIdentifier = tokens.data[0].identifier;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/history/${tokenIdentifier}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });
  });

  describe('GET /accounts/:address/transactions', () => {
    const properties = [
      'txHash',
      'gasLimit',
      'gasPrice',
      'gasUsed',
      'miniBlockHash',
      'nonce',
      'receiver',
      'receiverShard',
      'round',
      'sender',
      'senderShard',
      'signature',
      'status',
      'value',
      'fee',
      'timestamp',
      'data',
      'function',
      'action',
    ];
    it('should return transactions for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return paginated results with from and size parameters', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeLessThanOrEqual(2);
    });

    it('should return transactions with properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions`);

      for (const property of properties) {
        expect(response.data[0]).toHaveProperty(property);
      }
    });

    it('should return transactions with sender parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?sender=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with receiver parameter', async () => {
      const receiverAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?receiver=${receiverAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with senderShard parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?senderShard=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with receiverShard parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?receiverShard=4294967295`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with miniBlockHash parameter', async () => {
      const miniBlockHashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=1`);
      const miniBlockHash = miniBlockHashes.data[0].miniBlockHash;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?miniBlockHash=${miniBlockHash}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with hashes parameter', async () => {
      const hashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=2`);
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?hashes=${hashes.data[0].txHash},${hashes.data[1].txHash}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return transactions with status parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?status=success`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with function parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?function=issue`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with round parameter', async () => {
      const rounds = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=1`);
      const round = rounds.data[0].round;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?round=${round}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with logs when withLogs parameter is used', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=50&withLogs=true`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return transactions with scResults when withScResults parameter is used', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=50&withScResults=true`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      const hasScResults = response.data.some((transaction: any) => transaction.results && transaction.results.length > 0);
      expect(hasScResults).toBe(true);
    });

    it('should return transactions with operations when withOperations parameter is used', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=50&withOperations=true`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      const hasOperations = response.data.some((transaction: any) => transaction.operations && transaction.operations.length > 0);
      expect(hasOperations).toBe(true);
    });

    it('should return transactions with block info when withBlockInfo parameter is used', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=50&withBlockInfo=true`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      const hasBlockInfo = response.data.some((transaction: any) =>
        transaction.senderBlockHash &&
        transaction.senderBlockNonce &&
        transaction.receiverBlockHash &&
        transaction.receiverBlockNonce
      );
      expect(hasBlockInfo).toBe(true);
    });

    it('should return 400 Bad Request when size > 50 with withScResults parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=51&withScResults=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 400 Bad Request when size > 50 with withOperations parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=51&withOperations=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 400 Bad Request when size > 50 with withLogs parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=51&withLogs=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 400 Bad Request when size > 50 with withBlockInfo parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=51&withBlockInfo=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return transactions with senderOrReceiver parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?senderOrReceiver=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/transactions/count', () => {
    it('should return the total number of transactions for a given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with sender parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?sender=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with receiver parameter', async () => {
      const receiverAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?receiver=${receiverAddress}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with senderShard parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?senderShard=1`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with receiverShard parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?receiverShard=4294967295`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with miniBlockHash parameter', async () => {
      const miniBlockHashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=1`);
      const miniBlockHash = miniBlockHashes.data[0].miniBlockHash;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?miniBlockHash=${miniBlockHash}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(1);
    });

    it('should return the total number of transactions for a given address with hashes parameter', async () => {
      const hashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=2`);
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?hashes=${hashes.data[0].txHash},${hashes.data[1].txHash}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of transactions for a given address with status parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?status=success`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with function parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?function=issue`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of transactions for a given address with round parameter', async () => {
      const rounds = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions?size=1`);
      const round = rounds.data[0].round;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?round=${round}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(1);
    });

    it('should return the total number of transactions for a given address with senderOrReceiver parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transactions/count?senderOrReceiver=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/transfers', () => {
    it('should return transfers for a given address', async () => {
      const countResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count`);
      const expectedCount = countResponse.data;

      expect(expectedCount).toBeGreaterThan(0);

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=500`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(expectedCount);
    });

    it('should have transfers count / list greater than 0', async () => {
      const countResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count`);
      expect(countResponse.status).toBe(200);
      expect(countResponse.data).toBeGreaterThan(0);

      const transfersResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers`);
      expect(transfersResponse.status).toBe(200);
      expect(transfersResponse.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
    });

    it('should return transfers with sender parameter', async () => {
      const countResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?sender=${config.aliceAddress}`);
      const expectedCount = countResponse.data;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?sender=${config.aliceAddress}&size=500`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(expectedCount);

      for (const transfer of response.data) {
        expect(transfer.sender).toBe(config.aliceAddress);
      }
    });

    it('should return transfers with receiver parameter', async () => {
      const receiverAddress = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?receiver=${receiverAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transfer of response.data) {
        expect(transfer.receiver).toBe(receiverAddress);
      }
    });

    it('should return transfers with token parameter', async () => {
      const accountTokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const token = accountTokens.data[0].identifier;

      const countResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?token=${token}`);
      const expectedCount = countResponse.data;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?token=${token}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(expectedCount);

      for (const transfer of response.data) {
        expect(transfer.action.arguments.transfers[0].token).toBe(token);
        expect(transfer.function).toBe('ESDTTransfer');
      }
    });

    it('should return transfers with senderShard parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?senderShard=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transfer of response.data) {
        expect(transfer.senderShard).toBe(1);
      }
    });

    it('should return transfers with receiverShard parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?receiverShard=4294967295`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transfer of response.data) {
        expect(transfer.receiverShard).toBe(4294967295);
      }
    });

    it('should return transfers with miniBlockHash parameter', async () => {
      const miniBlockHashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=1`);
      const miniBlockHash = miniBlockHashes.data[0].miniBlockHash;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?miniBlockHash=${miniBlockHash}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transfer of response.data) {
        expect(transfer.miniBlockHash).toBe(miniBlockHash);
      }
    });

    it('should return transfers with hashes parameter', async () => {
      const hashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=2`);
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?hashes=${hashes.data[0].txHash},${hashes.data[1].txHash}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
      expect(response.data).toContainEqual(hashes.data[0]);
      expect(response.data).toContainEqual(hashes.data[1]);
    });

    it('should return transfers with status parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?status=success`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transfer of response.data) {
        expect(transfer.status).toBe('success');
      }
    });

    it('should return transfers with round parameter', async () => {
      const rounds = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=1`);
      const round = rounds.data[0].round;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?round=${round}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transfer of response.data) {
        expect(transfer.round).toBe(round);
      }
    });

    it('should return transfers with senderOrReceiver parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?senderOrReceiver=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transfer of response.data) {
        expect(transfer.sender === config.aliceAddress || transfer.receiver === config.aliceAddress).toBe(true);
      }
    });

    it('should return transfers with withLogs parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?withLogs=true`);
      expect(response.status).toBe(200);

      const hasLogs = response.data.some((transfer: any) => transfer.logs);
      expect(hasLogs).toBe(true);

      const hasValidLogs = response.data.some((transfer: any) => {
        if (!transfer.logs) {
          return false;
        }

        const hasRequiredLogProps = ['events', 'address'].every(prop =>
          Object.prototype.hasOwnProperty.call(transfer.logs, prop)
        );
        if (!hasRequiredLogProps) {
          return false;
        }

        if (!Array.isArray(transfer.logs.events)) {
          return false;
        }

        return transfer.logs.events.some((event: any) =>
          ['address', 'identifier', 'topics', 'data'].every(prop =>
            Object.prototype.hasOwnProperty.call(event, prop)
          )
        );
      });

      expect(hasValidLogs).toBe(true);
    });

    it('should return transfers with withOperations parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?withOperations=true`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
      const hasOperations = response.data.some((transfer: any) => transfer.operations && transfer.operations.length > 0);
      expect(hasOperations).toBe(true);

      const transferWithOperations = response.data.find((transfer: any) => transfer.operations && transfer.operations.length > 0);
      expect(transferWithOperations.operations).toBeDefined();
      expect(Array.isArray(transferWithOperations.operations)).toBe(true);
      expect(transferWithOperations.operations.length).toBeGreaterThan(0);

      const operation = transferWithOperations.operations[0];
      const expectedProperties = ['id', 'action', 'type', 'sender', 'receiver', 'value'];
      const foundProperties = expectedProperties.filter(prop => prop in operation);
      expect(foundProperties.length).toBeGreaterThan(0);
      expect(foundProperties.length).toBeLessThanOrEqual(expectedProperties.length);
    });

    it('should return transfers with expected properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      const expectedProperties = [
        'txHash',
        'gasLimit',
        'gasPrice',
        'gasUsed',
        'miniBlockHash',
        'nonce',
        'receiver',
        'receiverShard',
        'round',
        'sender',
        'senderShard',
        'signature',
        'status',
        'value',
        'fee',
        'timestamp',
        'function',
        'action',
        'type',
        'data',
      ];

      const transfer = response.data[0];
      for (const property of expectedProperties) {
        expect(transfer).toHaveProperty(property);
      }

      expect(transfer.action).toHaveProperty('category');
      expect(transfer.action).toHaveProperty('name');
      expect(transfer.action).toHaveProperty('description');
    });
  });

  describe('GET /accounts/:address/transfers/count', () => {
    it('should return the total number of transfers for a given address', async () => {
      const accountTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=500`);
      const expectedCount = accountTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with sender parameter', async () => {
      const accountSenderTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?sender=${config.aliceAddress}&size=500`);
      const expectedCount = accountSenderTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?sender=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with receiver parameter', async () => {
      const accountReceiverTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?receiver=${config.aliceAddress}&size=500`);
      const expectedCount = accountReceiverTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?receiver=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with token parameter', async () => {
      const accountTokens = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/tokens`);
      const token = accountTokens.data[0].identifier;

      const accountTokenTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?token=${token}`);
      const expectedCount = accountTokenTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?token=${token}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with senderShard parameter', async () => {
      const accountSenderShardTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?senderShard=1&size=500`);
      const expectedCount = accountSenderShardTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?senderShard=1`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with receiverShard parameter', async () => {
      const accountReceiverShardTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?receiverShard=4294967295`);
      const expectedCount = accountReceiverShardTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?receiverShard=4294967295`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with miniBlockHash parameter', async () => {
      const miniBlockHashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=1`);
      const miniBlockHash = miniBlockHashes.data[0].miniBlockHash;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?miniBlockHash=${miniBlockHash}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(1);
    });

    it('should return the total number of transfers for a given address with hashes parameter', async () => {
      const hashes = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=2`);
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?hashes=${hashes.data[0].txHash},${hashes.data[1].txHash}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of transfers for a given address with status parameter', async () => {
      const accountSuccessTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?status=success&size=500`);
      const expectedCount = accountSuccessTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?status=success`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of transfers for a given address with round parameter', async () => {
      const rounds = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?size=1`);
      const round = rounds.data[0].round;
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?round=${round}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(1);
    });

    it('should return the total number of transfers for a given address with senderOrReceiver parameter', async () => {
      const accountSenderOrReceiverTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?senderOrReceiver=${config.aliceAddress}&size=500`);
      const expectedCount = accountSenderOrReceiverTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?senderOrReceiver=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number for a given status', async () => {
      const accountSuccessTransfers = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers?status=success&size=500`);
      const expectedCount = accountSuccessTransfers.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/transfers/count?status=success`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(expectedCount);
    });
  });

  describe('GET /accounts/:address/nfts', () => {
    it('should return accounts nfts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(25);
    });

    it('should return accounts nfts paginated', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?from=0&size=10`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(10);
    });

    it('should return different results for different from values', async () => {
      const firstResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?from=0&size=1`);
      const secondResponse = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?from=1&size=1`);

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(firstResponse.data.length).toBe(1);
      expect(secondResponse.data.length).toBe(1);
      expect(firstResponse.data[0].identifier).not.toBe(secondResponse.data[0].identifier);
    });

    it('should return accounts nfts for a size > 25', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=26`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(26);
    });

    it('should return accounts nfts filtered by search parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1`);
      const nft = accountNfts.data[0];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?search=${nft.identifier}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
      expect(response.data[0].identifier).toStrictEqual(nft.identifier);
    });

    it('should return accounts nfts filtered by identifiers parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=2`);
      const nfts = accountNfts.data;
      const firstNft = nfts[0].identifier;
      const secondNft = nfts[1].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?identifiers=${firstNft},${secondNft}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
      expect(response.data[0].identifier).toStrictEqual(firstNft);
      expect(response.data[1].identifier).toStrictEqual(secondNft);
    });

    it('should return accounts nfts filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?type=${NftType.NonFungibleESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).toStrictEqual(NftType.NonFungibleESDT);
      }
    });

    it('should return accounts sfts filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?type=${NftType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).toStrictEqual(NftType.SemiFungibleESDT);
      }
    });

    it('should return accounts MetaESDTs filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?type=${NftType.MetaESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).toStrictEqual(NftType.MetaESDT);
      }
    });

    it('should return accounts nftsV2 filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?subType=${NftSubType.NonFungibleESDTv2}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.subType).toStrictEqual(NftSubType.NonFungibleESDTv2);
      }
    });

    it('should return accounts sft filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?subType=${NftSubType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.subType).toStrictEqual(NftSubType.SemiFungibleESDT);
      }
    });

    it('should return accounts MetaESDTs filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?subType=${NftSubType.MetaESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.subType).toStrictEqual(NftSubType.MetaESDT);
      }
    });

    it('should return accounts nfts filtered by collection parameter', async () => {
      const accountCollections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections`);
      const collection = accountCollections.data[0].collection;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?collection=${collection}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return accounts nfts filtered by collections parameter', async () => {
      const accountCollections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections?size=2`);
      const collections = accountCollections.data.map((c: any) => c.collection).join(',');

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?collections=${collections}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(10);
    });

    it('should return accounts nfts filtered by name parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1`);
      const nftName = accountNfts.data[0].name;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?name=${nftName}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.name).toStrictEqual(nftName);
      }
    });

    it('should return accounts nfts filtered by tags parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1`);
      const nftTags = accountNfts.data[0].tags;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?tags=${nftTags}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.tags).toEqual(nftTags);
      }
    });

    it('should return accounts nfts filtered by creator parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?creator=${config.aliceAddress}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.creator).toStrictEqual(config.aliceAddress);
      }
    });

    it('should return accounts nfts filtered by hasUris parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?hasUris=true`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.uris).toBeDefined();
        expect(nft.uris.length).toBeGreaterThan(0);
        expect(nft.uris).toEqual([
          "aHR0cHM6Ly9leGFtcGxlLmNvbS9uZnQucG5n",
          "aHR0cHM6Ly9leGFtcGxlLmNvbS9uZnQuanNvbg==",
        ]);
      }
    });

    it('should return acoount SFT filtered by withSupply parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?withSupply=true&type=${NftType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).toStrictEqual(NftType.SemiFungibleESDT);
        expect(nft.supply).toBeDefined();
      }
    });

    it('should return acoount NFT filtered by withSupply parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?withSupply=true&type=${NftType.NonFungibleESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(nft.supply).not.toBeDefined();
      }
    });

    it('should return acoount MetaESDT filtered by withSupply parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?withSupply=true&type=${NftType.MetaESDT}`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).toStrictEqual(NftType.MetaESDT);
        expect(nft.supply).toBeDefined();
      }
    });

    it('should return accounts nfts without MetaESDTs', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?excludeMetaESDT=true`);
      expect(response.status).toBe(200);

      for (const nft of response.data) {
        expect(nft.type).not.toStrictEqual(NftType.MetaESDT);
      }

      expect(response.data.every((nft: any) =>
        [NftType.NonFungibleESDT, NftType.SemiFungibleESDT].includes(nft.type)
      )).toBe(true);
    });
  });

  describe('GET /accounts/:address/nfts/count', () => {
    it('should return the total number of nfts for a given address', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=100`);
      const expectedCount = accountNfts.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of nfts for a given address filtered by search parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1&type=${NftType.NonFungibleESDT}`);
      const nft = accountNfts.data[0];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?search=${nft.name}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of nfts for a given address filtered by identifiers parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=2`);
      const nfts = accountNfts.data;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?identifiers=${nfts[0].identifier},${nfts[1].identifier}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of nfts for a given address filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?type=${NftType.NonFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of sfts for a given address filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?type=${NftType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of metaesdt  for a given address filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?type=${NftType.MetaESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of nfts for a given address filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?subType=${NftSubType.NonFungibleESDTv2}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of sfts for a given address filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?subType=${NftSubType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of metaesdt for a given address filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?subType=${NftSubType.MetaESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of nfts for a given address filtered by collection parameter', async () => {
      const accountCollections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections`);
      const collection = accountCollections.data[0].collection;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?collection=${collection}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the total number of nfts for a given address filtered by collections parameter', async () => {
      const accountCollections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections?size=2`);
      const collections = accountCollections.data.map((c: any) => c.collection).join(',');

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?collections=${collections}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of nfts for a given address filtered by name parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1`);
      const nftName = accountNfts.data[0].name;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/count?name=${nftName}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/nfts/c alternative', () => {
    it('should return the total number of nfts for a given address', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=100`);
      const expectedCount = accountNfts.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return the total number of nfts for a given address filtered by search parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=2&type=${NftType.NonFungibleESDT}`);
      const nft = accountNfts.data[0];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?search=${nft.name}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });

    it('should return the total number of nfts for a given address filtered by identifiers parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=2`);
      const nfts = accountNfts.data;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?identifiers=${nfts[0].identifier},${nfts[1].identifier}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of nfts for a given address filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?type=${NftType.NonFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of sfts for a given address filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?type=${NftType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of metaesdt  for a given address filtered by type parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?type=${NftType.MetaESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of nfts for a given address filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?subType=${NftSubType.NonFungibleESDTv2}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of sfts for a given address filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?subType=${NftSubType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of metaesdt for a given address filtered by subType parameter', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?subType=${NftSubType.MetaESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of nfts for a given address filtered by collection parameter', async () => {
      const accountCollections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections`);
      const collection = accountCollections.data[0].collection;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?collection=${collection}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the total number of nfts for a given address filtered by collections parameter', async () => {
      const accountCollections = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/collections?size=2`);
      const collections = accountCollections.data.map((c: any) => c.collection).join(',');

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?collections=${collections}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(10);
    });

    it('should return the total number of nfts for a given address filtered by name parameter', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1`);
      const nftName = accountNfts.data[0].name;

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/c?name=${nftName}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /accounts/:address/nfts/:nft', () => {
    it('should return the nft details for a given address and nft', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1`);
      const nft = accountNfts.data[0];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/${nft.identifier}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.identifier).toStrictEqual(nft.identifier);
    });

    it('should return the MetaESDT details with the proper fields', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1&type=${NftType.MetaESDT}`);
      const nft = accountNfts.data[0];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/${nft.identifier}`);
      expect(response.status).toBe(200);

      const expectedFields = [
        'identifier',
        'collection',
        'type',
        'subType',
        'name',
        'creator',
        'tags',
      ];

      for (const field of expectedFields) {
        expect(response.data).toHaveProperty(field);
      }
    });

    it('should return the NonFungibleESDT details with the proper fields', async () => {
      const accountNfts = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts?size=1&type=${NftType.NonFungibleESDT}`);
      const nft = accountNfts.data[0];

      const response = await axios.get(`${config.apiServiceUrl}/accounts/${config.aliceAddress}/nfts/${nft.identifier}?fields=identifier,name,type,subType,creator,collection,tags,uris,supply`);
      expect(response.status).toBe(200);

      const expectedFields = [
        'identifier',
        'collection',
        'type',
        'subType',
        'name',
        'creator',
        'uris',
        'tags',
      ];

      for (const field of expectedFields) {
        expect(response.data).toHaveProperty(field);
      }
    });
  });
});
