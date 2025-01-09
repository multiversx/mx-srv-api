import axios from 'axios';
import { config } from './config/env.config';

describe('Blocks e2e tests with chain simulator', () => {
  describe('GET /blocks', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/blocks`);
      expect(response.status).toBe(200);
    });

    it('should handle invalid block requests gracefully', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/blocks/invalid`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /blocks/count', () => {
    it('should return blocks count', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/blocks/count`);
      const count = response.data;

      expect(count).toBeGreaterThan(0);
    });

    it('should return blocks count filter by shard', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/blocks/count?shard=1`,
      );
      const count = response.data;

      expect(count).toBeGreaterThan(0);
    });

    it('should return blocks count filter by epoch', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/blocks/count?epoch=1`,
      );
      const count = response.data;

      expect(count).toBeGreaterThan(1);
    });

    it('should return blocks count 0 if epoch value is to high', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/blocks/count?epoch=10000`,
      );
      const count = response.data;

      expect(count).toStrictEqual(0);
    });

    it('should return blocks count filter by nonce', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/blocks/count?nonce=0`,
      );
      const count = response.data;

      expect(count).toBeGreaterThan(0);
    });

    it('should return blocks count 0 if nonce value is to high', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/blocks/count?nonce=10000`,
      );
      const count = response.data;

      expect(count).toStrictEqual(0);
    });
  });

  describe('GET /blocks filter tests', () => {
    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/blocks?size=10`);
      const blocks = response.data;

      expect(blocks).toBeInstanceOf(Array);
      expect(blocks.length).toBeLessThanOrEqual(10);
    });

    it('should filter blocks by shard', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/blocks?shard=1`);
      const blocks = response.data;

      for (const block of blocks) {
        expect(block.shard).toBe(1);
      }
    });

    it('should filter blocks by epoch', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/blocks?epoch=2`);
      const blocks = response.data;

      for (const block of blocks) {
        expect(block.epoch).toBe(2);
      }
    });
  });

  describe('GET /blocks/latest', () => {
    it('should return the latest block data', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/blocks/latest`);
      const block = response.data;

      const expectedProperties = [
        'hash',
        'epoch',
        'nonce',
        'prevHash',
        'pubKeyBitmap',
        'round',
        'shard',
        'size',
        'sizeTxs',
        'stateRootHash',
        'timestamp',
        'txCount',
        'gasConsumed',
        'gasRefunded',
        'gasPenalized',
        'maxGasLimit',
      ];

      for (const property of expectedProperties) {
        expect(block).toHaveProperty(property);
        expect(block[property]).not.toBeNull();
      }

      const typeValidation = {
        hash: 'string',
        epoch: 'number',
        nonce: 'number',
        prevHash: 'string',
        pubKeyBitmap: 'string',
        round: 'number',
        shard: 'number',
        size: 'number',
        sizeTxs: 'number',
        stateRootHash: 'string',
        timestamp: 'number',
        txCount: 'number',
        gasConsumed: 'number',
        gasRefunded: 'number',
        gasPenalized: 'number',
        maxGasLimit: 'number',
      };

      Object.entries(typeValidation).forEach(([key, type]) => {
        expect(typeof block[key]).toBe(type);
      });
    });
  });
});
