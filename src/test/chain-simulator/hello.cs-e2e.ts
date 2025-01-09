import axios from "axios";
import { config } from "./config/env.config";

describe('Hello endpoint e2e tests with chain simulator', () => {
  describe('GET /hello', () => {
    it('should return status code 200 and a hello message', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/hello`);

      expect(response.status).toBe(200);
      expect(response.data).toBe('hello');
    });
  });
});
