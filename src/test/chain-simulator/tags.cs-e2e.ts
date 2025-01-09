import axios from 'axios';
import { config } from "./config/env.config";

describe('Tags e2e tests with chain simulator', () => {
  describe('GET /tags', () => {
    it('should return the tags', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/tags`);
      const expectedProperties = ['tag', 'count'];

      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);

      for (const tag of response.data) {
        expect(Object.keys(tag)).toStrictEqual(expectedProperties);
      }
    });

    it('should return the tags with pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/tags?size=1&from=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should support different pagination sizes', async () => {
      const firstSet = await axios.get(`${config.apiServiceUrl}/tags?from=0&size=1`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/tags?from=1&size=1`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);

      expect(firstSet.data.length).toStrictEqual(1);
      expect(secondSet.data.length).toStrictEqual(1);
    });

    it('should return the tags with search', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/tags?search=test`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      expect(response.data[0].tag).toStrictEqual('test');
    });
  });

  describe('GET /tags/count', () => {
    it('should return the tags count', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/tags/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
      expect(response.data).toStrictEqual(2);
    });
  });

  describe('GET /tags/:tag', () => {
    it('should return the tag details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/tags/test`);
      expect(response.status).toBe(200);
      expect(response.data.tag).toBe('test');
      expect(response.data.count).toBeGreaterThanOrEqual(0);
      expect(typeof response.data.count).toBe('number');
    });
  });
});
