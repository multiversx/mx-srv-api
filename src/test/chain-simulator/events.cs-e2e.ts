import { config } from "./config/env.config";
import axios from "axios";

describe('Events e2e tests with chain simulator', () => {
  describe('GET /events', () => {
    it('should return status code 200 and a list of events', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events?from=0&size=2`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toStrictEqual(2);
    });

    it('should return different results for different from/size parameters', async () => {
      const firstSet = await axios.get(`${config.apiServiceUrl}/events?from=0&size=2`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/events?from=1&size=2`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);

      expect(firstSet.data).not.toEqual(secondSet.data);
      expect(firstSet.data[1]).toEqual(secondSet.data[0]);
    });

    it('should return events with expected properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events`);
      const event = response.data[0];
      expect(response.status).toBe(200);

      const requiredProps = [
        'txHash',
        'logAddress',
        'identifier',
        'address',
        'topics',
        'shardID',
        'txOrder',
        'order',
        'timestamp',
      ];

      for (const prop of requiredProps) {
        expect(event).toHaveProperty(prop);
      }

      expect(event.topics).toBeInstanceOf(Array);
    });

    it('should support filtering by address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events?address=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(1);
      expect(response.data[0].address).toBe(config.aliceAddress);
    });

    it('should support filtering by identifier', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events?identifier=completedTxEvent`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(1);
      expect(response.data[0].identifier).toBe('completedTxEvent');
    });

    // TODO: fix this
    it.skip('should support filtering by txHash', async () => {
      const events = await axios.get(`${config.apiServiceUrl}/events`);
      const txHash = events.data[0].txHash;
      const response = await axios.get(`${config.apiServiceUrl}/events?txHash=${txHash}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(1);
    });

    it('should support filtering by shard', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events?shard=0`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(1);
    });
  });

  describe('GET /events/count', () => {
    it('should return status code 200 and the number of events', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events/count`);
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('number');
    });

    it('should return the number of events with the given address', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events/count?address=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(1);
    });

    it('should return the number of events with the given identifier', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events/count?identifier=completedTxEvent`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(1);
    });

    it('should return the number of events with the given shard', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/events/count?shard=0`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(1);
    });
  });
});
