import axios from "axios";
import { config } from "./config/env.config";
import { ChainSimulatorUtils } from "./utils/test.utils";
import { NodeType } from "src/endpoints/nodes/entities/node.type";
import { NodeStatus } from "src/endpoints/nodes/entities/node.status";

describe('Nodes e2e tests with chain simulator', () => {
  beforeAll(async () => {
    await ChainSimulatorUtils.waitForEpoch(2);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  describe('GET /nodes', () => {
    it('should return status code 200 and a list of nodes', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nodes`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should return different paginated results for different from values', async () => {
      const firstSet = await axios.get(`${config.apiServiceUrl}/nodes?from=0&size=2`);
      const secondSet = await axios.get(`${config.apiServiceUrl}/nodes?from=1&size=2`);

      expect(firstSet.status).toBe(200);
      expect(secondSet.status).toBe(200);
      expect(firstSet.data).toBeInstanceOf(Array);
      expect(secondSet.data).toBeInstanceOf(Array);
      expect(firstSet.data).not.toEqual(secondSet.data);

      expect(firstSet.data.length).toBe(2);
      expect(secondSet.data.length).toBe(2);
    });

    it('should return nodes filtered by keys', async () => {
      const keys = await axios.get(`${config.apiServiceUrl}/nodes`);
      const firstKey = keys.data[0].bls;
      const secondKey = keys.data[1].bls;

      const response = await axios.get(`${config.apiServiceUrl}/nodes?keys=${firstKey},${secondKey}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(2);

      expect(response.data[0].bls).toBe(firstKey);
      expect(response.data[1].bls).toBe(secondKey);
    });

    it('should return nodes filtered by search', async () => {
      const keys = await axios.get(`${config.apiServiceUrl}/nodes`);
      const firstKey = keys.data[0].bls;

      const response = await axios.get(`${config.apiServiceUrl}/nodes?search=${firstKey}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      expect(response.data.length).toStrictEqual(1);
      expect(response.data[0].bls).toStrictEqual(firstKey);
    });

    it('should return nodes filtered by online', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nodes?online=true`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      for (const node of response.data) {
        expect(node.online).toStrictEqual(true);
      }
    });

    it('should return nodes filtered by type', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nodes?type=validator`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      for (const node of response.data) {
        expect(node.type).toStrictEqual(NodeType.validator);
      }
    });

    it('should return nodes filtered by status', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nodes?status=eligible`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      for (const node of response.data) {
        expect(node.status).toStrictEqual(NodeStatus.eligible);
      }
    });

    it('should return nodes filtered by shard', async () => {
      const shards = [0, 1, 4294967295];

      for (const shard of shards) {
        const response = await axios.get(`${config.apiServiceUrl}/nodes?shard=${shard}`);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);

        for (const node of response.data) {
          expect(node.shard).toStrictEqual(shard);
        }
      }
    });

    it('should return nodes filtered / sorted by tempRating in ascending order', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/nodes?sort=tempRating&order=asc`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      for (let i = 0; i < response.data.length - 1; i++) {
        expect(response.data[i].tempRating).toBeLessThanOrEqual(response.data[i + 1].tempRating);
      }
    });
  });

  describe('GET /nodes/count', () => {
    it('should return status code 200 and a number of nodes', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes`);
      const expectedCount = nodesResponse.data.length;

      const countResponse = await axios.get(`${config.apiServiceUrl}/nodes/count`);
      expect(countResponse.status).toBe(200);
      expect(countResponse.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by search', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?search=node`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/count?search=node`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by online', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?online=true`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/count?online=true`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by type', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?type=validator`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/count?type=validator`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by status', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?status=eligible`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/count?status=eligible`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by shard', async () => {
      const shards = [0, 1, 4294967295];

      for (const shard of shards) {
        const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?shard=${shard}`);
        const expectedCount = nodesResponse.data.length;

        const response = await axios.get(`${config.apiServiceUrl}/nodes/count?shard=${shard}`);
        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual(expectedCount);
      }
    });

    it('should return nodes count filtered by owner', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes`);
      const owner = nodesResponse.data[0].owner;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/count?owner=${owner}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });
  });

  describe('GET /nodes/count alternative', () => {
    it('should return status code 200 and a number of nodes', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes`);
      const expectedCount = nodesResponse.data.length;

      const countResponse = await axios.get(`${config.apiServiceUrl}/nodes/c`);
      expect(countResponse.status).toBe(200);
      expect(countResponse.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by search', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?search=node`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/c?search=node`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by online', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?online=true`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/c?online=true`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by type', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?type=validator`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/c?type=validator`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by status', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?status=eligible`);
      const expectedCount = nodesResponse.data.length;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/c?status=eligible`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(expectedCount);
    });

    it('should return nodes count filtered by shard', async () => {
      const shards = [0, 1, 4294967295];

      for (const shard of shards) {
        const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes?shard=${shard}`);
        const expectedCount = nodesResponse.data.length;

        const response = await axios.get(`${config.apiServiceUrl}/nodes/c?shard=${shard}`);
        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual(expectedCount);
      }
    });

    it('should return nodes count filtered by owner', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes`);
      const owner = nodesResponse.data[0].owner;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/c?owner=${owner}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
    });
  });

  describe('GET /nodes/:bls', () => {
    it('should return status code 200 and a node', async () => {
      const nodesResponse = await axios.get(`${config.apiServiceUrl}/nodes`);
      const bls = nodesResponse.data[0].bls;

      const response = await axios.get(`${config.apiServiceUrl}/nodes/${bls}`);
      expect(response.status).toBe(200);

      const expectedProps = [
        'bls',
        'rating',
        'tempRating',
        'ratingModifier',
        'shard',
        'type',
        'status',
        'online',
        'nonce',
        'instances',
        'owner',
        'stake',
        'topUp',
        'locked',
        'leaderFailure',
        'leaderSuccess',
        'validatorFailure',
        'validatorIgnoredSignatures',
        'validatorSuccess',
        'position',
      ];

      for (const prop of expectedProps) {
        expect(response.data).toHaveProperty(prop);
        expect(response.data[prop]).toBeDefined();
      }
    });

    it('should return status code 404 if the node is not found', async () => {
      const bls = '05ca60d1e19f52dbf9e68e03c74272c174ee007663da989fe91c5b0446dcb04de7837b7560d5a66faeb0281dbf672c085da0acad0f4c2d8c3297a1d4d51417b3ff703884b4792bc303eed92789c257bf38dd4a14ec58a0175f6659a06a295304';
      try {
        await axios.get(`${config.apiServiceUrl}/nodes/${bls}`);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return status code 400 if the bls key is not valid', async () => {
      const invalidBls = 'invalid-bls-key';
      try {
        await axios.get(`${config.apiServiceUrl}/nodes/${invalidBls}`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});
