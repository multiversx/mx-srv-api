import axios from "axios";
import { config } from "./config/env.config";

describe('Websocket config e2e tests with chain simulator', () => {
  describe('GET /websocket/config', () => {
    it('should return status code 200 and websocket config', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/websocket/config`);
      expect(response.status).toBe(200);
      expect(response.data.url).toStrictEqual('socket-api-fra.multiversx.com');
    });
  });
});
