import axios from 'axios';
import { config } from "./config/env.config";

describe('Shards e2e tests with chain simulator', () => {
  describe('GET /shards', () => {
    it('should return status code 200 and a list of shards', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/shards`);

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /shards with pagination', () => {
    it('should return status code 200 and paginated shards with default values', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/shards`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(4);
    });

    it('should return paginated shards with custom size', async () => {
      const size = 2;
      const response = await axios.get(`${config.apiServiceUrl}/shards?size=${size}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(size);
    });

    it('should return paginated shards with custom from', async () => {
      const from = 1;
      const response = await axios.get(`${config.apiServiceUrl}/shards?from=${from}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(3);
    });

    it('should return paginated shards with both from and size', async () => {
      const from = 1;
      const size = 2;
      const response = await axios.get(`${config.apiServiceUrl}/shards?from=${from}&size=${size}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(size);
    });

    it('should validate shard structure and data', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/shards`);
      const shards = response.data;

      for (const shard of shards) {
        expect(shard).toHaveProperty('shard');
        expect(shard).toHaveProperty('validators');
        expect(shard).toHaveProperty('activeValidators');
        expect(typeof shard.shard).toBe('number');
        expect(typeof shard.validators).toBe('number');
        expect(typeof shard.activeValidators).toBe('number');
      }
    });

    it('should contain metachain shard (4294967295)', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/shards`);
      const shards = response.data;
      const metachainShard = shards.find((shard: { shard: number }) => shard.shard === 4294967295);

      expect(metachainShard).toBeDefined();
      expect(metachainShard?.validators).toBeGreaterThanOrEqual(1);
      expect(metachainShard?.activeValidators).toBeGreaterThanOrEqual(1);
    });
  });
});
