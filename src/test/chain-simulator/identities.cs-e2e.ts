import axios from "axios";
import { config } from "./config/env.config";

describe('Identities e2e tests with chain simulator', () => {
  describe('GET /identities', () => {
    it('should return status code 200 and a list of identities', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/identities`);
      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/identities?size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBe(1);
    });

    it('should return identities with expected properties', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/identities`);
      expect(response.status).toBe(200);

      const expectedProps = [
        'locked',
        'distribution',
        'name',
        'score',
        'validators',
        'stake',
        'topUp',
        'stakePercent',
        'rank',
      ];

      for (const identity of response.data) {
        for (const expectedProp of expectedProps) {
          expect(identity).toHaveProperty(expectedProp);
        }
      }
    });
  });
});
