import axios from 'axios';
import { config } from "./config/env.config";

// TODO: Uncomment this test once the legacy delegation legacy contract is deployed
describe.skip('Delegation legacy e2e tests with chain simulator', () => {
  describe('GET /delegations-legacy', () => {
    it('should return status code 200 and a delegation legacy object details', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/delegation-legacy`);
      const properties = Object.keys(response.data);

      expect(response.status).toBe(200);
      const expectedProperties = [
        'totalWithdrawOnlyStake',
        'totalWaitingStake',
        'totalActiveStake',
        'totalUnstakedStake',
        'totalDeferredPaymentStake',
        'numUsers',
      ];

      expect(properties).toEqual(expectedProperties);
    });
  });
});
