import axios from "axios";
import { config } from "./config/env.config";
import { NftType } from 'src/common/indexer/entities/nft.type';
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";

describe('NFTs e2e tests with chain simulator', () => {
  describe('GET /nfts', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should return all nfts paginated', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?size=5`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toStrictEqual(5);
    });

    it('should return different paginated results for different from values', async () => {
      const firstSet = await axios.get(`${config.apiServiceUrl}/nfts?from=0&size=5`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/nfts?from=5&size=5`);
      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);
      expect(firstSet.data.length).toStrictEqual(5);
      expect(secondSet.data.length).toStrictEqual(5);
      expect(firstSet.data).not.toStrictEqual(secondSet.data);
    });

    it('should return nfts filtered by identifiers', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=2`);
      const identifiers = nfts.data.map((nft: any) => nft.identifier);

      const response = await axios.get(`${config.apiServiceUrl}/nfts?identifiers=${identifiers[0]},${identifiers[1]}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toStrictEqual(2);
      expect(response.data.every((nft: any) => identifiers.includes(nft.identifier))).toBe(true);
    });


    it('should return nfts filtered by different type combinations', async () => {
      // Test NonFungibleESDT filter
      const nonFungibleResponse = await axios.get(`${config.apiServiceUrl}/nfts?type=${NftType.NonFungibleESDT}`);
      expect(nonFungibleResponse.status).toBe(200);
      expect(nonFungibleResponse.data).toBeInstanceOf(Array);
      expect(nonFungibleResponse.data.every((nft: any) => nft.type === NftType.NonFungibleESDT)).toBe(true);

      // Test SemiFungibleESDT filter  
      const semiFungibleResponse = await axios.get(`${config.apiServiceUrl}/nfts?type=${NftType.SemiFungibleESDT}`);
      expect(semiFungibleResponse.status).toBe(200);
      expect(semiFungibleResponse.data).toBeInstanceOf(Array);
      expect(semiFungibleResponse.data.every((nft: any) => nft.type === NftType.SemiFungibleESDT)).toBe(true);

      // Test combined NonFungible and SemiFungible filter
      const combinedResponse = await axios.get(`${config.apiServiceUrl}/nfts?type=${NftType.NonFungibleESDT},${NftType.SemiFungibleESDT}`);
      expect(combinedResponse.status).toBe(200);
      expect(combinedResponse.data).toBeInstanceOf(Array);
      expect(combinedResponse.data.every((nft: any) =>
        [NftType.NonFungibleESDT, NftType.SemiFungibleESDT].includes(nft.type)
      )).toBe(true);
    });

    it('should return nfts filtered by different subType combinations', async () => {
      // Test NonFungibleESDTv2 filter
      const nonFungibleV2Response = await axios.get(`${config.apiServiceUrl}/nfts?subType=${NftSubType.NonFungibleESDTv2}`);
      expect(nonFungibleV2Response.status).toBe(200);
      expect(nonFungibleV2Response.data).toBeInstanceOf(Array);
      expect(nonFungibleV2Response.data.every((nft: any) => nft.subType === NftSubType.NonFungibleESDTv2)).toBe(true);

      // Test SemiFungibleESDT filter
      const semiFungibleResponse = await axios.get(`${config.apiServiceUrl}/nfts?subType=${NftSubType.SemiFungibleESDT}`);
      expect(semiFungibleResponse.status).toBe(200);
      expect(semiFungibleResponse.data).toBeInstanceOf(Array);
      expect(semiFungibleResponse.data.every((nft: any) => nft.subType === NftSubType.SemiFungibleESDT)).toBe(true);

      // Test combined NonFungibleESDTv2 and SemiFungibleESDT filter
      const combinedResponse = await axios.get(`${config.apiServiceUrl}/nfts?subType=${NftSubType.NonFungibleESDTv2},${NftSubType.SemiFungibleESDT}`);
      expect(combinedResponse.status).toBe(200);
      expect(combinedResponse.data).toBeInstanceOf(Array);
      expect(combinedResponse.data.every((nft: any) =>
        [NftSubType.NonFungibleESDTv2, NftSubType.SemiFungibleESDT].includes(nft.subType)
      )).toBe(true);
    });

    it('should return nfts filtered by collection', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/collections?size=1`);
      const collection = collections.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/nfts?collection=${collection[0]}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.collection === collection[0])).toBe(true);
    });

    it('should return nfts filtered by collections', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      const collection = collections.data.map((collection: any) => collection.collection);

      const response = await axios.get(`${config.apiServiceUrl}/nfts?collections=${collection[0]},${collection[1]}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => collection.includes(nft.collection))).toBe(true);
    });

    it('should return nfts filtered by name', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=2`);
      const name = nfts.data.map((nft: any) => nft.name);

      const response = await axios.get(`${config.apiServiceUrl}/nfts?name=${name[0]}`);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.name === name[0])).toBe(true);
    });

    it('should return nfts filtered by tags', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?tags=test,example`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) =>
        nft.tags.includes('test') && nft.tags.includes('example')
      )).toBe(true);
    });

    it('should return nfts filtered by isWhitelistedStorage', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?isWhitelistedStorage=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.isWhitelistedStorage === false)).toBe(true);
    });

    it('should return nfts filtered by hasUris', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?hasUris=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.uris.length > 0)).toBe(true);
    });

    it('should return nfts with owner field defined only for NonFungibleESDT type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?withOwner=true&type=${NftType.NonFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.type === 'NonFungibleESDT')).toBe(true);
      expect(response.data.every((nft: any) => nft.owner !== undefined)).toBe(true);
    });

    it('should return nfts with owner field undefined', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?withOwner=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.owner === undefined)).toBe(true);
    });

    it('should return nfts with supply field defined only for SemiFungibleESDT type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?withSupply=true&type=${NftType.SemiFungibleESDT}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.type === 'SemiFungibleESDT')).toBe(true);
      expect(response.data.every((nft: any) => nft.supply !== undefined)).toBe(true);
    });

    it('should return nfts with supply field undefined', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts?withSupply=false`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.every((nft: any) => nft.supply === undefined)).toBe(true);
    });
  });

  describe('GET /nfts/count', () => {
    let nfts: any;

    beforeAll(async () => {
      nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=10000`);
    });

    it('should return the total number of nfts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts/count`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nfts.data.length);
    });

    it('should return the total number of nfts filtered by type', async () => {
      const nftsByTypeNFT = nfts.data.filter((nft: any) => nft.type === NftType.NonFungibleESDT);
      const responseNFT = await axios.get(`${config.apiServiceUrl}/nfts/count?type=${NftType.NonFungibleESDT}`);
      expect(responseNFT.status).toBe(200);
      expect(responseNFT.data).toStrictEqual(nftsByTypeNFT.length);

      const nftsByTypeSFT = nfts.data.filter((nft: any) => nft.type === NftType.SemiFungibleESDT);
      const responseSFT = await axios.get(`${config.apiServiceUrl}/nfts/count?type=${NftType.SemiFungibleESDT}`);
      expect(responseSFT.status).toBe(200);
      expect(responseSFT.data).toStrictEqual(nftsByTypeSFT.length);
    });

    it('should return the total number of nfts filtered by subType', async () => {
      const nftsBySubTypeNFT = nfts.data.filter((nft: any) => nft.subType === NftSubType.NonFungibleESDTv2);
      const responseNFT = await axios.get(`${config.apiServiceUrl}/nfts/count?subType=${NftSubType.NonFungibleESDTv2}`);
      expect(responseNFT.status).toBe(200);
      expect(responseNFT.data).toStrictEqual(nftsBySubTypeNFT.length);

      const nftsBySubTypeSFT = nfts.data.filter((nft: any) => nft.subType === NftSubType.SemiFungibleESDT);
      const responseSFT = await axios.get(`${config.apiServiceUrl}/nfts/count?subType=${NftSubType.SemiFungibleESDT}`);
      expect(responseSFT.status).toBe(200);
      expect(responseSFT.data).toStrictEqual(nftsBySubTypeSFT.length);
    });

    it('should return the total number of nfts filtered by identifiers', async () => {
      const identifiers = nfts.data.map((nft: any) => nft.identifier);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/count?identifiers=${identifiers[0]},${identifiers[1]}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of nfts filtered by collection', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/collections?size=1`);
      const collection = collections.data.map((collection: any) => collection.collection);

      const nftsByCollection = nfts.data.filter((nft: any) => nft.collection === collection[0]);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/count?collection=${collection[0]}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsByCollection.length);
    });

    it('should return the total number of nfts filtered by collections', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      const collection = collections.data.map((collection: any) => collection.collection);

      const nftsByCollections = nfts.data.filter((nft: any) =>
        collection.includes(nft.collection)
      );
      const response = await axios.get(`${config.apiServiceUrl}/nfts/count?collections=${collection[0]},${collection[1]}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsByCollections.length);
    });

    it('should return the total number of nfts filtered by isWhitelistedStorage', async () => {
      const nftsWhitelisted = nfts.data.filter((nft: any) => nft.isWhitelistedStorage === false);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/count?isWhitelistedStorage=false`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsWhitelisted.length);
    });

    it('should return the total number of nfts filtered by hasUris', async () => {
      const nftsWithUris = nfts.data.filter((nft: any) => nft.uris.length > 0);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/count?hasUris=true`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsWithUris.length);
    });
  });

  describe('GET /nfts/c alternative', () => {
    let nfts: any;

    beforeAll(async () => {
      nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=10000`);
    });

    it('should have nfts count / list greater than 0', async () => {
      const countResponse = await axios.get(`${config.apiServiceUrl}/nfts/c`);
      expect(countResponse.status).toBe(200);
      expect(countResponse.data).toBeGreaterThan(0);

      const nftsResponse = await axios.get(`${config.apiServiceUrl}/nfts/c`);
      expect(nftsResponse.status).toBe(200);
      expect(nftsResponse.data).toBeGreaterThan(0);
    });

    it('should return the total number of nfts', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nfts/c`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nfts.data.length);
    });

    it('should return the total number of nfts filtered by type', async () => {
      const nftsByTypeNFT = nfts.data.filter((nft: any) => nft.type === NftType.NonFungibleESDT);
      const responseNFT = await axios.get(`${config.apiServiceUrl}/nfts/c?type=${NftType.NonFungibleESDT}`);
      expect(responseNFT.status).toBe(200);
      expect(responseNFT.data).toStrictEqual(nftsByTypeNFT.length);

      const nftsByTypeSFT = nfts.data.filter((nft: any) => nft.type === NftType.SemiFungibleESDT);
      const responseSFT = await axios.get(`${config.apiServiceUrl}/nfts/c?type=${NftType.SemiFungibleESDT}`);
      expect(responseSFT.status).toBe(200);
      expect(responseSFT.data).toStrictEqual(nftsByTypeSFT.length);
    });

    it('should return the total number of nfts filtered by subType', async () => {
      const nftsBySubTypeNFT = nfts.data.filter((nft: any) => nft.subType === NftSubType.NonFungibleESDTv2);
      const responseNFT = await axios.get(`${config.apiServiceUrl}/nfts/c?subType=${NftSubType.NonFungibleESDTv2}`);
      expect(responseNFT.status).toBe(200);
      expect(responseNFT.data).toStrictEqual(nftsBySubTypeNFT.length);

      const nftsBySubTypeSFT = nfts.data.filter((nft: any) => nft.subType === NftSubType.SemiFungibleESDT);
      const responseSFT = await axios.get(`${config.apiServiceUrl}/nfts/c?subType=${NftSubType.SemiFungibleESDT}`);
      expect(responseSFT.status).toBe(200);
      expect(responseSFT.data).toStrictEqual(nftsBySubTypeSFT.length);
    });

    it('should return the total number of nfts filtered by identifiers', async () => {
      const identifiers = nfts.data.map((nft: any) => nft.identifier);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/c?identifiers=${identifiers[0]},${identifiers[1]}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of nfts filtered by collection', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/collections?size=1`);
      const collection = collections.data.map((collection: any) => collection.collection);

      const nftsByCollection = nfts.data.filter((nft: any) => nft.collection === collection[0]);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/c?collection=${collection[0]}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsByCollection.length);
    });

    it('should return the total number of nfts filtered by collections', async () => {
      const collections = await axios.get(`${config.apiServiceUrl}/collections?size=2`);
      const collection = collections.data.map((collection: any) => collection.collection);

      const nftsByCollections = nfts.data.filter((nft: any) =>
        collection.includes(nft.collection)
      );
      const response = await axios.get(`${config.apiServiceUrl}/nfts/c?collections=${collection[0]},${collection[1]}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsByCollections.length);
    });

    it('should return the total number of nfts filtered by isWhitelistedStorage', async () => {
      const nftsWhitelisted = nfts.data.filter((nft: any) => nft.isWhitelistedStorage === false);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/c?isWhitelistedStorage=false`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsWhitelisted.length);
    });

    it('should return the total number of nfts filtered by hasUris', async () => {
      const nftsWithUris = nfts.data.filter((nft: any) => nft.uris.length > 0);
      const response = await axios.get(`${config.apiServiceUrl}/nfts/c?hasUris=true`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(nftsWithUris.length);
    });
  });

  describe('GET /nfts/:identifier', () => {
    it('should return the nft details with owner field', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.NonFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}`);
      expect(response.status).toBe(200);

      const expectedNft = {
        ...nfts.data[0],
        owner: response.data.owner,
      };
      expect(response.data).toStrictEqual(expectedNft);
    });

    it('should return the nft details with supply field', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.SemiFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}`);
      expect(response.status).toBe(200);

      const expectedNft = {
        ...nfts.data[0],
        supply: response.data.supply,
      };
      expect(response.data).toStrictEqual(expectedNft);
    });
  });

  describe('GET /nfts/:identifier/supply', () => {
    it('should return the sft supply', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.SemiFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}/supply`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({ supply: "10" });
    });

    it('should return the nft supply', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.NonFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}/supply`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({ supply: "1" });
    });
  });

  describe('GET /nfts/:identifier/accounts', () => {
    it('should return the nft accounts', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.SemiFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}/accounts`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual([{
        address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        balance: "10",
      }]);
    });

    it('should return the nft accounts with pagination', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.SemiFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}/accounts?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual([{
        address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        balance: "10",
      }]);
    });

    it('should return the nft accounts based on identifier', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.SemiFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}/accounts`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual([{
        address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        balance: "10",
      }]);
    });

    it('should return 400 Bad Request for invalid identifier', async () => {
      const invalidIdentifier = 'invalid-identifier';

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${invalidIdentifier}/accounts`)
        .catch(err => err.response);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /nfts/:identifier/accounts/count', () => {
    it('should return the nft accounts count', async () => {
      const nfts = await axios.get(`${config.apiServiceUrl}/nfts?size=1&type=${NftType.SemiFungibleESDT}`);
      const identifier = nfts.data[0].identifier;

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${identifier}/accounts/count`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });

    it('should return 400 Bad Request for invalid identifier', async () => {
      const invalidIdentifier = 'invalid-identifier';

      const response = await axios.get(`${config.apiServiceUrl}/nfts/${invalidIdentifier}/accounts/count`)
        .catch(err => err.response);

      expect(response.status).toBe(400);
    });
  });
});

