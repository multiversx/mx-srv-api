import axios from "axios";
import { config } from "./config/env.config";

describe('Stake e2e tests with chain simulator', () => {
  describe('GET /stake', () => {
    let stakeResponse: any;

    beforeEach(async () => {
      stakeResponse = await axios.get(`${config.apiServiceUrl}/stake`);
    });

    it('should return status code 200 and a stake object', () => {
      expect(stakeResponse.status).toBe(200);
      expect(stakeResponse.data).toBeInstanceOf(Object);
    });

    it('should return the correct total number of validators', () => {
      expect(stakeResponse.data.totalValidators).toBeGreaterThanOrEqual(0);
    });

    it('should return the correct number of active validators', () => {
      expect(stakeResponse.data.activeValidators).toBeGreaterThanOrEqual(0);
    });

    it('should return the correct number of total observers', () => {
      expect(stakeResponse.data.totalObservers).toBeGreaterThanOrEqual(0);
    });

    it('should return the correct queue size', () => {
      expect(stakeResponse.data.queueSize).toBeGreaterThanOrEqual(0);
    });

    it('should return all expected properties in the response', () => {
      const expectedProperties = [
        'totalValidators',
        'activeValidators',
        'totalObservers',
        'queueSize',
        'totalStaked',
      ];

      for (const property of expectedProperties) {
        expect(stakeResponse.data).toHaveProperty(property);
      }
    });
  });
});
