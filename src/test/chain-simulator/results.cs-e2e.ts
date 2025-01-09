import axios from 'axios';
import { config } from './config/env.config';

describe('Smart Contract Results e2e tests with chain simulator', () => {
  describe('GET /results', () => {
    it('should return status code 200 and a list of smart contract results', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/results`);
      const results = response.data;
      expect(response.status).toBe(200);
      expect(results).toBeInstanceOf(Array);
    });

    it('should return filtered smart contract results by sender', async () => {
      const sender =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${config.apiServiceUrl}/results?sender=${sender}`,
      );
      const results = response.data;
      expect(response.status).toBe(200);
      for (const result of results) {
        expect(result.sender).toBe(sender);
      }
    });

    it('should return filtered smart contract results by receiver', async () => {
      const receiver =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${config.apiServiceUrl}/results?receiver=${receiver}`,
      );
      const results = response.data;
      expect(response.status).toBe(200);
      for (const result of results) {
        expect(result.receiver).toBe(receiver);
      }
    });

    // Skipped due to the lack of smart contract results with function 'transfer'
    it.skip('should return filtered smart contract results by function', async () => {
      const functionName = 'transfer';
      const response = await axios.get(
        `${config.apiServiceUrl}/results?function=${functionName}`,
      );
      const results = response.data;
      expect(response.status).toBe(200);
      for (const result of results) {
        expect(result.function).toBe(functionName);
      }
    });
  });

  describe('GET /results/count', () => {
    it('should return status code 200 and the total count of smart contract results', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/results/count`);
      const count = response.data;
      expect(response.status).toBe(200);
      expect(count).toBeGreaterThanOrEqual(1);
      expect(typeof count).toBe('number');
    });

    it('should return filtered smart contract results count by sender', async () => {
      const sender =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${config.apiServiceUrl}/results/count?sender=${sender}`,
      );
      const count = response.data;
      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });

    it('should return filtered smart contract results count by receiver', async () => {
      const receiver =
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
      const response = await axios.get(
        `${config.apiServiceUrl}/results/count?receiver=${receiver}`,
      );
      const count = response.data;
      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });

    it('should return filtered smart contract results count by function', async () => {
      const functionName = 'transfer';
      const response = await axios.get(
        `${config.apiServiceUrl}/results/count?function=${functionName}`,
      );
      const count = response.data;
      expect(response.status).toBe(200);
      expect(typeof count).toBe('number');
    });
  });

  describe('GET /results/:scHash', () => {
    it('should return status code 200 and smart contract result details (test )', async () => {
      const results = await axios.get(`${config.apiServiceUrl}/results`);
      const hash = results.data[0].hash;

      const response = await axios.get(`${config.apiServiceUrl}/results/${hash}`);
      const result = response.data;

      expect(response.status).toBe(200);
      expect(result).toHaveProperty('hash', hash);
    });

    it('should return status code 400 for invalid smart contract hash', async () => {
      const scHash = 'nonExistentHash';
      try {
        await axios.get(`${config.apiServiceUrl}/results/${scHash}`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});
