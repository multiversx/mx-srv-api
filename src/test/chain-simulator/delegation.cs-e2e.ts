import axios from 'axios';
import { config } from "./config/env.config";

describe('Delegation e2e tests with chain simulator', () => {
  describe('GET /delegations', () => {
    it('should return status code 200 and a delegation object details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/delegation`);
      const properties = Object.keys(response.data);

      expect(response.status).toBe(200);
      expect(properties).toEqual(['stake', 'topUp', 'locked', 'minDelegation']);
    });
  });
});
