import axios from 'axios';
import { config } from './config/env.config';

describe('Miniblocks e2e tests with chain simulator', () => {
  describe('GET /miniblocks', () => {
    it('should return status code 200', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/miniblocks`);
      expect(response.status).toBe(200);
    });

    it('should handle invalid miniblock requests gracefully', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/miniblocks/invalid`);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return a list of miniblocks', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/miniblocks`);
      const miniblocks = response.data;

      expect(Array.isArray(miniblocks)).toBe(true);
      expect(miniblocks.length).toBeGreaterThan(5);
    });

    it('should return miniblocks with the correct structure', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/miniblocks`);
      const miniblocks = response.data;

      //TBD - senderBlockHash is not in the response
      const expectedProperties = [
        'miniBlockHash',
        'receiverShard',
        'senderShard',
        'timestamp',
        'type',
      ];

      for (const miniblock of miniblocks) {
        for (const property of expectedProperties) {
          expect(miniblock).toHaveProperty(property);
        }
      }
    });
  });

  describe('GET /miniblocks filters', () => {
    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/miniblocks?size=5`);
      const miniblocks = response.data;

      expect(miniblocks.length).toBe(5);
    });

    it('should support filtering by types', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/miniblocks?type=SmartContractResultBlock`,
      );
      const miniblocks = response.data;

      for (const miniblock of miniblocks) {
        expect(miniblock.type).toStrictEqual('SmartContractResultBlock');
      }
    });

    it('should support filtering by types', async () => {
      const response = await axios.get(
        `${config.apiServiceUrl}/miniblocks?type=InvalidBlock`,
      );
      const miniblocks = response.data;

      for (const miniblock of miniblocks) {
        expect(miniblock.type).toStrictEqual('InvalidBlock');
      }
    });

    const typesToTest = ['SmartContractResultBlock', 'InvalidBlock', 'TxBlock'];
    for (const type of typesToTest) {
      it(`should return miniblocks filtered by type: ${type}`, async () => {
        const response = await axios.get(
          `${config.apiServiceUrl}/miniblocks?type=${type}`,
        );
        const miniblocks = response.data;

        for (const miniblock of miniblocks) {
          expect(miniblock.type).toStrictEqual(type);
        }
      });
    }
  });
});
