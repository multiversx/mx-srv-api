import axios from 'axios';
import { config } from './config/env.config';

describe('Pool e2e tests with chain simulator', () => {
  describe('GET /pool', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/pool`);
      const txsPool = response.data;

      expect(response.status).toBe(200);
      expect(txsPool).toBeInstanceOf(Array);
    });

    it('should return the transaction pool', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/pool`,
      );
      const pool = response.data;
      const expectedProperties = [
        'txHash',
        'nonce',
        'receiver',
        'gasPrice',
        'gasLimit',
      ];

      for (const tx of pool) {
        for (const property of expectedProperties) {
          expect(tx).toHaveProperty(property);
        }
      }
    });
  });

  describe('GET /pool/:txhash', () => {
    it('should return status code 200 and the transaction', async () => {
      const poolResponse = await axios.get(
        `${config.apiServiceUrl}/pool?size=1`,
      );
      const response = await axios.get(
        `${config.apiServiceUrl}/pool/${poolResponse.data[0].txHash}`,
      );
      const tx = response.data;

      expect(response.status).toBe(200);
      expect(tx).toHaveProperty(
        'txHash',
        poolResponse.data[0].txHash,
      );
    });

    it('should return status code 404 for non-existent tx hash', async () => {
      const nonExistentTxHash = '0000000000000000000000000000000000000000000000000000000000000000';
      try {
        await axios.get(
          `${config.apiServiceUrl}/pool/${nonExistentTxHash}`,
        );
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
