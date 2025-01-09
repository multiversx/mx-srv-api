import axios from 'axios';
import { config } from './config/env.config';

describe('Network e2e tests with chain simulator', () => {
  describe('GET /constants', () => {
    it('should return status code 200 constants details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/constants`);
      const results = response.data;

      expect(response.status).toBe(200);
      expect(results).toEqual(
        expect.objectContaining({
          chainId: expect.any(String),
          gasPerDataByte: expect.any(Number),
          minGasLimit: expect.any(Number),
          minGasPrice: expect.any(Number),
          minTransactionVersion: expect.any(Number),
        })
      );
    });

    it.skip('shoult return status code 200 and economics details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/economics`);
      const results = response.data;

      expect(response.status).toBe(200);
      expect(results).toEqual(
        expect.objectContaining({
          totalSupply: expect.any(Number),
          circulatingSupply: expect.any(Number),
          staked: expect.any(Number),
          price: expect.any(Number),
          marketCap: expect.any(Number),
          apr: expect.any(Number),
          topUpApr: expect.any(Number),
          baseApr: expect.any(Number),
          tokenMarketCap: expect.any(Number),
        })
      );
    });

    it('should return status code 200 and stats details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/stats`);
      const results = response.data;

      expect(response.status).toBe(200);
      expect(results).toEqual(
        expect.objectContaining({
          accounts: expect.any(Number),
          blocks: expect.any(Number),
          epoch: expect.any(Number),
          refreshRate: expect.any(Number),
          roundsPassed: expect.any(Number),
          roundsPerEpoch: expect.any(Number),
          shards: expect.any(Number),
          transactions: expect.any(Number),
          scResults: expect.any(Number),
        })
      );
    });

    it.skip('should return status code 200 and about details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/about`);
      const results = response.data;

      expect(response.status).toBe(200);
      expect(results).toEqual(
        expect.objectContaining({
          appVersion: expect.any(String),
          features: expect.any(Object),
          network: expect.any(String),
          pluginsVersion: expect.any(String),
          version: expect.any(String),
          scamEngineVersion: expect.any(String),
        })
      );
    });
  });
});
