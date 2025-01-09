import axios from 'axios';
import { config } from './config/env.config';
import { NftType } from 'src/common/indexer/entities/nft.type';

describe('Collections e2e tests with chain simulator', () => {
  describe('GET /collections', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections`);
      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should filter by search term', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?search=NFTCollection1`);
      expect(response.status).toBe(200);
      expect(response.data.some((collection: any) => collection.name.includes('NFTCollection1'))).toBe(true);
    });

    it('should filter by identifiers', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections?identifiers=${[collection[0], collection[1]]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toBe(2);
    });

    it('should filter by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?type=NonFungibleESDT`);
      expect(response.status).toBe(200);
      expect(response.data.every((collection: any) => collection.type === 'NonFungibleESDT')).toBe(true);
    });

    it('should exclude MetaESDT collections when specified', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?excludeMetaESDT=true`);
      expect(response.status).toBe(200);
      expect(response.data.every((collection: any) => collection.type !== 'MetaESDT')).toBe(true);
    });

    it('should sort collections', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections?sort=timestamp&order=desc`);
      expect(response.status).toBe(200);

      const timestamps = response.data.map((collection: any) => collection.timestamp);
      const sortedTimestamps = [...timestamps].sort((a, b) => b - a);
      expect(timestamps).toEqual(sortedTimestamps);
    });
  });

  describe('GET /collections/count', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/count`);

      expect(response.status).toBe(200);
    });

    it('should return total count of collections', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/count`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by search term', async () => {
      const searchTerm = 'NFTCollection1';
      const response = await axios.get(`${config.apiServiceUrl}/collections/count?search=${searchTerm}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by type', async () => {
      const type = NftType.NonFungibleESDT;
      const response = await axios.get(`${config.apiServiceUrl}/collections/count?type=${type}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });
  });

  describe('GET /collections/c (alternative endpoint)', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/c`);

      expect(response.status).toBe(200);
    });

    it('should return total count of collections', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/collections/c`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by search term', async () => {
      const searchTerm = 'NFTCollection1';
      const response = await axios.get(`${config.apiServiceUrl}/collections/c?search=${searchTerm}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return filtered collection count by type', async () => {
      const type = NftType.NonFungibleESDT;
      const response = await axios.get(`${config.apiServiceUrl}/collections/c?type=${type}`);

      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });
  });

  describe('GET /collections/:collection', () => {
    it('should return status code 200', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.collection).toBe(collection[0]);
    });
  });

  describe('GET /collections/:collections/nfts', () => {
    it('should return all nfts for a collection', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should support pagination', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?from=0&size=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return different NFTs with same pagination size', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const firstSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?from=0&size=1`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?from=1&size=1`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);

      expect(firstSet.data.length).toStrictEqual(1);
      expect(secondSet.data.length).toStrictEqual(1);

      expect(firstSet.data[0].identifier).not.toEqual(secondSet.data[0].identifier);
    });

    it('should return nfts with search term', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?search=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return nfts by identifiers', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=2&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts`);
      const collectionNftIdentifiers = collectionNft.data.map((nft: any) => nft.identifier);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?identifiers=${[collectionNftIdentifiers[0], collectionNftIdentifiers[1]]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
    });

    it('should return nfts with name', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);
      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?search=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return nfts with tags', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?tags=test`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return nfts with creator', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?creator=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return nfts with isWhitelistedStorage false', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?isWhitelistedStorage=false`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return nfts that have uris', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?hasUris=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      expect(response.data.every((nft: any) =>
        nft.uris &&
        Array.isArray(nft.uris) &&
        nft.uris.includes('aHR0cHM6Ly9leGFtcGxlLmNvbS9uZnQucG5n') &&
        nft.uris.includes('aHR0cHM6Ly9leGFtcGxlLmNvbS9uZnQuanNvbg==')
      )).toBe(true);
    });

    it('should return nfts with nonceBefore', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?nonceBefore=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
      expect(response.data[0].nonce).toBe(1);
    });

    it('should return nfts with nonceBefore', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?nonceBefore=2`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);
      expect(response.data[0].nonce).toBe(2);
      expect(response.data[1].nonce).toBe(1);
    });

    it('should return nfts with nonceAfter', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?nonceAfter=2`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(4);
      expect(response.data[0].nonce).toBe(5);
      expect(response.data[1].nonce).toBe(4);
      expect(response.data[2].nonce).toBe(3);
      expect(response.data[3].nonce).toBe(2);
    });

    it('should return nfts with withOwner', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?withOwner=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
      expect(response.data.supply).toBeUndefined();

      expect(response.data.every((nft: any) => nft.owner === config.aliceAddress)).toBe(true);
      expect(response.data.every((nft: any) => nft.type === NftType.NonFungibleESDT)).toBe(true);
    });

    it('should return nfts with withSupply', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=SemiFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts?withSupply=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
      expect(response.data.owner).toBeUndefined();

      expect(response.data.every((nft: any) => nft.supply === "10")).toBe(true);
      expect(response.data.every((nft: any) => nft.type === NftType.SemiFungibleESDT)).toBe(true);
    });
  });

  describe('GET /collections/:collection/nfts/count', () => {
    it('should return nfts count for a collection', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with search term', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?search=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return nfts count for a collection with name', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios.get(`${config.apiServiceUrl}/collections/${collection}/nfts`);
      const collectionNftName = collectionNft.data.map((nft: any) => nft.name);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?name=${collectionNftName[0]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return nfts count for a collection with tags', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?tags=test`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with identifiers', async () => {
      const collectionsIdentifiers = await axios
        .get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);

      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const collectionNft = await axios
        .get(`${config.apiServiceUrl}/collections/${collection}/nfts`);

      const collectionNftIdentifiers = collectionNft.data.map((nft: any) => nft.identifier);

      const response = await axios
        .get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?identifiers=${[collectionNftIdentifiers[0], collectionNftIdentifiers[1]]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return nfts count for a collection with creator', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?creator=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with isWhitelistedStorage', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?isWhitelistedStorage=false`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with hasUris', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?hasUris=true`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return nfts count for a collection with nonceBefore', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const firstSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?nonceBefore=1`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?nonceBefore=2`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);
      expect(firstSet.data).toStrictEqual(1);
      expect(secondSet.data).toStrictEqual(2);
    });

    it('should return nfts count for a collection with nonceAfter', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/nfts/count?nonceAfter=2`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(4);
    });
  });

  describe('GET /collections/:collection/accounts', () => {
    it('should return accounts for a collection', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/accounts`);

      for (const account of response.data) {
        expect(account.address).toBe(config.aliceAddress);
        expect(account.balance).toStrictEqual("1");
      }
    });

    it('should return accounts for a collection with from and size', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/accounts?from=0&size=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const account of response.data) {
        expect(account.address).toBe(config.aliceAddress);
        expect(account.balance).toStrictEqual("1");
      }
    });

    it('should return accounts for a collection with identifier', async () => {
      const collectionsIdentifiers = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collection = collectionsIdentifiers.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collection[0]}/accounts?identifier=${collection[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const account of response.data) {
        expect(account.address).toBe(config.aliceAddress);
        expect(account.balance).toStrictEqual("1");
      }
    });
  });

  describe('GET /collections/:collection/transactions', () => {
    it('should return transactions for a collection of type NFT', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return transactions for a collection of type SFT', async () => {
      const collectionSFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=SemiFungibleESDT`);
      const collectionSFTDetails = collectionSFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionSFTDetails[0]}/transactions`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return transactions for a collection of type MetaESDT', async () => {
      const collectionMetaESDT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=MetaESDT`);
      const collectionMetaESDTDetails = collectionMetaESDT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionMetaESDTDetails[0]}/transactions`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return transactions for a collection of type NFT and contains properties', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);

      expect(response.status).toBe(200);

      const expectedProps = [
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

      for (const transaction of response.data) {
        for (const prop of expectedProps) {
          expect(transaction).toHaveProperty(prop);
        }
      }
    });

    it('should return transactions for a collection of type NFT with a specific sender', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?sender=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.sender).toStrictEqual(config.aliceAddress);
      }
    });

    it('should return transactions for a collection of type NFT with a specific receiver', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?receiver=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.receiver).toStrictEqual(config.aliceAddress);
      }
    });

    it('should return transactions for a collection of type NFT with a specific senderShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?senderShard=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.senderShard).toStrictEqual(1);
      }
    });

    it('should return transactions for a collection of type NFT with a specific receiverShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?receiverShard=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.receiverShard).toStrictEqual(1);
      }
    });

    it('should return transactions for a collection of type NFT with a specific miniBlockHash', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);
      const txCollectionMiniBlockHash = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const miniBlockHash = txCollectionMiniBlockHash.data.map((transaction: any) => transaction.miniBlockHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?miniBlockHash=${miniBlockHash[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transaction of response.data) {
        expect(transaction.miniBlockHash).toStrictEqual(miniBlockHash[0]);
      }
    });

    it('should return transactions for a collection of type NFT with specific hashes', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionHashes = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const hashes = txCollectionHashes.data.map((transaction: any) => transaction.txHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?hashes=${hashes[0]},${hashes[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);

      const returnedHashes = response.data.map((transaction: any) => transaction.txHash);
      expect(returnedHashes).toContain(hashes[0]);
      expect(returnedHashes).toContain(hashes[1]);
    });

    it('should return transactions for a collection of type NFT with a specific status', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?status=success`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.status).toStrictEqual('success');
      }
    });

    it('should return transactions for a collection of type NFT with a specific function', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?function=ESDTNFTCreate`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.function).toStrictEqual('ESDTNFTCreate');
      }
    });

    it('should return transactions for a collection of type NFT with a specific before', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionBefore = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const before = txCollectionBefore.data.map((transaction: any) => transaction.timestamp);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?before=${before[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(4);

      const returnedTimestamps = response.data.map((transaction: any) => transaction.timestamp);
      expect(returnedTimestamps).toContain(before[1]);
    });

    it('should return transactions for a collection of type NFT with a specific after', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionAfter = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const after = txCollectionAfter.data.map((transaction: any) => transaction.timestamp);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?after=${after[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);

      const returnedTimestamps = response.data.map((transaction: any) => transaction.timestamp);
      expect(returnedTimestamps).toContain(after[1]);
    });

    it('should return transactions for a collection of type NFT with a specific round', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionRound = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const round = txCollectionRound.data.map((transaction: any) => transaction.round);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?round=${round[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transaction of response.data) {
        expect(transaction.round).toStrictEqual(round[1]);
      }
    });

    it('should return transactions for a collection of type NFT paginated', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?from=0&size=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return different transactions when using different pagination parameters', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const firstPage = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?from=0&size=1`);
      const secondPage = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?from=1&size=2`);

      expect(firstPage.status).toBe(200);
      expect(secondPage.status).toBe(200);

      expect(firstPage.data.length).toStrictEqual(1);
      expect(secondPage.data.length).toStrictEqual(2);

      const firstPageHash = firstPage.data[0].txHash;
      const secondPageHashes = secondPage.data.map((tx: any) => tx.txHash);

      expect(secondPageHashes).not.toContain(firstPageHash);
    });

    it('should return transactions for a collection of type NFT with operations when withOperations is true', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?withOperations=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.operations).toBeDefined();
      }
    });

    it('should throw 400 bad request when withOperations=true and size=51', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      try {
        await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?withOperations=true&size=51`);
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return transactions for a collection of type NFT with operations when withLogs is true', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?withLogs=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transaction of response.data) {
        expect(transaction.logs).toBeDefined();
      }
    });

    it('should throw 400 bad request when withLogs=true and size=51', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      try {
        await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions?withLogs=true&size=51`);
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /collections/:collection/transactions/count', () => {
    it('should return the count of transactions for a collection of type NFT', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transactions for a collection of type NFT with a specific sender', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?sender=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transactions for a collection of type NFT with a specific receiver', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?receiver=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transactions for a collection of type NFT with a specific senderShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?senderShard=1`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transactions for a collection of type NFT with a specific receiverShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?receiverShard=1`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transactions for a collection of type NFT with a specific miniBlockHash', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);
      const txCollectionMiniBlockHash = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const miniBlockHash = txCollectionMiniBlockHash.data.map((transaction: any) => transaction.miniBlockHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?miniBlockHash=${miniBlockHash[0]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return the count of transactions for a collection of type NFT with a specific hashes', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionHashes = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const hashes = txCollectionHashes.data.map((transaction: any) => transaction.txHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?hashes=${hashes[0]},${hashes[1]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the count of transactions for a collection of type NFT with a specific status', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?status=success`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transaction for a collection of type NFT with a specific round', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionRound = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions`);
      const round = txCollectionRound.data.map((transaction: any) => transaction.round);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transactions/count?round=${round[1]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });
  });

  describe('GET /collections/:collection/transfers', () => {
    it('should return transfers for a collection of type NFT', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return transfers for a collection of type SFT', async () => {
      const collectionSFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=SemiFungibleESDT`);
      const collectionSFTDetails = collectionSFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionSFTDetails[0]}/transfers`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return transfers for a collection of type MetaESDT', async () => {
      const collectionMetaESDT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=MetaESDT`);
      const collectionMetaESDTDetails = collectionMetaESDT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionMetaESDTDetails[0]}/transfers`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return transfers for a collection of type NFT and contains properties', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);

      expect(response.status).toBe(200);

      const expectedProps = [
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

      for (const transfer of response.data) {
        for (const prop of expectedProps) {
          expect(transfer).toHaveProperty(prop);
        }
      }
    });

    it('should return transfers for a collection of type NFT with a specific sender', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?sender=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.sender).toStrictEqual(config.aliceAddress);
      }
    });

    it('should return transfers for a collection of type NFT with a specific receiver', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?receiver=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.receiver).toStrictEqual(config.aliceAddress);
      }
    });

    it('should return transfers for a collection of type NFT with a specific senderShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?senderShard=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.senderShard).toStrictEqual(1);
      }
    });

    it('should return transfers for a collection of type NFT with a specific receiverShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?receiverShard=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.receiverShard).toStrictEqual(1);
      }
    });

    it('should return transfers for a collection of type NFT with a specific miniBlockHash', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);
      const txCollectionMiniBlockHash = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const miniBlockHash = txCollectionMiniBlockHash.data.map((transaction: any) => transaction.miniBlockHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?miniBlockHash=${miniBlockHash[0]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transfer of response.data) {
        expect(transfer.miniBlockHash).toStrictEqual(miniBlockHash[0]);
      }
    });

    it('should return transfers for a collection of type NFT with specific hashes', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionHashes = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const hashes = txCollectionHashes.data.map((transaction: any) => transaction.txHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?hashes=${hashes[0]},${hashes[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);

      const returnedHashes = response.data.map((transfer: any) => transfer.txHash);
      expect(returnedHashes).toContain(hashes[0]);
      expect(returnedHashes).toContain(hashes[1]);
    });

    it('should return transfers for a collection of type NFT with a specific status', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?status=success`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.status).toStrictEqual('success');
      }
    });

    it('should return transfers for a collection of type NFT with a specific function', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?function=ESDTNFTCreate`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.function).toStrictEqual('ESDTNFTCreate');
      }
    });

    it('should return transfers for a collection of type NFT with a specific before', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionBefore = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const before = txCollectionBefore.data.map((transaction: any) => transaction.timestamp);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?before=${before[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(4);

      const returnedTimestamps = response.data.map((transfer: any) => transfer.timestamp);
      expect(returnedTimestamps).toContain(before[1]);
    });

    it('should return transfers for a collection of type NFT with a specific after', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionAfter = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const after = txCollectionAfter.data.map((transaction: any) => transaction.timestamp);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?after=${after[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);

      const returnedTimestamps = response.data.map((transfer: any) => transfer.timestamp);
      expect(returnedTimestamps).toContain(after[1]);
    });

    it('should return transfers for a collection of type NFT with a specific round', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionRound = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const round = txCollectionRound.data.map((transaction: any) => transaction.round);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?round=${round[1]}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transfer of response.data) {
        expect(transfer.round).toStrictEqual(round[1]);
      }
    });

    it('should return transfers for a collection of type NFT paginated', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?from=0&size=1`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return different transfers when using different pagination parameters', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const firstPage = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?from=0&size=1`);
      const secondPage = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?from=1&size=2`);

      expect(firstPage.status).toBe(200);
      expect(secondPage.status).toBe(200);

      expect(firstPage.data.length).toStrictEqual(1);
      expect(secondPage.data.length).toStrictEqual(2);

      const firstPageHash = firstPage.data[0].txHash;
      const secondPageHashes = secondPage.data.map((tx: any) => tx.txHash);

      expect(secondPageHashes).not.toContain(firstPageHash);
    });

    it('should return transfers for a collection of type NFT with operations when withOperations is true', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?withOperations=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.operations).toBeDefined();
      }
    });

    it('should throw 400 bad request when withOperations=true and size=51', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      try {
        await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?withOperations=true&size=51`);
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return transfers for a collection of type NFT with operations when withLogs is true', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?withLogs=true`);

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(5);

      for (const transfer of response.data) {
        expect(transfer.logs).toBeDefined();
      }
    });

    it('should throw 400 bad request when withLogs=true and size=51', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      try {
        await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers?withLogs=true&size=51`);
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /collections/:collection/transfers/count', () => {
    it('should return the count of transfers for a collection of type NFT', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transfers for a collection of type NFT with a specific sender', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?sender=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transfers for a collection of type NFT with a specific receiver', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?receiver=${config.aliceAddress}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transfers for a collection of type NFT with a specific senderShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?senderShard=1`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transfers for a collection of type NFT with a specific receiverShard', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?receiverShard=1`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transfers for a collection of type NFT with a specific miniBlockHash', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);
      const txCollectionMiniBlockHash = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const miniBlockHash = txCollectionMiniBlockHash.data.map((transaction: any) => transaction.miniBlockHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?miniBlockHash=${miniBlockHash[0]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return the count of transfers for a collection of type NFT with a specific hashes', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionHashes = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const hashes = txCollectionHashes.data.map((transaction: any) => transaction.txHash);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?hashes=${hashes[0]},${hashes[1]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the count of transfers for a collection of type NFT with a specific status', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?status=success`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(5);
    });

    it('should return the count of transfers for a collection of type NFT with a specific round', async () => {
      const collectionNFT = await axios.get(`${config.apiServiceUrl}/collections?size=1&type=NonFungibleESDT`);
      const collectionNFTDetails = collectionNFT.data.map((collection: any) => collection.collection);

      const txCollectionRound = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers`);
      const round = txCollectionRound.data.map((transaction: any) => transaction.round);

      const response = await axios.get(`${config.apiServiceUrl}/collections/${collectionNFTDetails[0]}/transfers/count?round=${round[1]}`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });
  });
});

