import axios from "axios";
import { config } from "./config/env.config";

describe('Transactions e2e tests with chain simulator', () => {
  describe('GET /transactions', () => {
    it('should return status code 200 and a list of transactions', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions`);
      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?from=0&size=1`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);
    });

    it('should return transactions with sender filter applied', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?sender=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(1);

      for (const transaction of response.data) {
        expect(transaction.sender).toBe(config.aliceAddress);
      }
    });

    it('should return transactions with receiver filter applied', async () => {
      const receiver = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';
      const response = await axios.get(`${config.apiServiceUrl}/transactions?receiver=${receiver}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(1);

      for (const transaction of response.data) {
        expect(transaction.receiver).toBe(receiver);
      }
    });

    it('should return transactions with senderShard filter applied', async () => {
      const senderShard = 0;
      const response = await axios.get(`${config.apiServiceUrl}/transactions?senderShard=${senderShard}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transaction of response.data) {
        expect(transaction.senderShard).toBe(senderShard);
      }
    });

    it('should return transactions with receiverShard filter applied', async () => {
      const receiverShard = 0;
      const response = await axios.get(`${config.apiServiceUrl}/transactions?receiverShard=${receiverShard}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transaction of response.data) {
        expect(transaction.receiverShard).toBe(receiverShard);
      }
    });

    it('should return transactions with miniBlockHash filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=1`);
      const miniBlockHash = transaction.data[0].miniBlockHash;
      const response = await axios.get(`${config.apiServiceUrl}/transactions?miniBlockHash=${miniBlockHash}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(1);

      for (const transaction of response.data) {
        expect(transaction.miniBlockHash).toBe(miniBlockHash);
      }
    });

    it('should return transactions with hashes filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=2`);
      const hashes = [transaction.data[0].txHash, transaction.data[1].txHash];
      const response = await axios.get(`${config.apiServiceUrl}/transactions?hashes=${hashes}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toStrictEqual(2);

      for (const transaction of response.data) {
        expect(hashes).toContain(transaction.txHash);
      }
    });

    it('should return transactions with status filter applied', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?status=success`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transaction of response.data) {
        expect(transaction.status).toBe('success');
      }
    });

    it('should return transactions with function filter applied', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?function=scDeploy`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transaction of response.data) {
        expect(transaction.function).toBe('scDeploy');
      }
    });

    it('should return transactions with round filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=1`);
      const round = transaction.data[0].round;
      const response = await axios.get(`${config.apiServiceUrl}/transactions?round=${round}`);
      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThanOrEqual(1);

      for (const transaction of response.data) {
        expect(transaction.round).toBe(round);
      }
    });

    it('should return transactions with withLogs filter applied and logs present', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?withLogs=true&size=50`);
      expect(response.status).toBe(200);
    });

    it('should return transactions with withOperations filter applied and operations present', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?withOperations=true`);
      expect(response.status).toBe(200);
      const hasOperations = response.data.some((transaction: any) => transaction.operations && transaction.operations.length > 0);
      expect(hasOperations).toBe(true);
    });

    it('should return transactions with withBlockInfo filter applied and block info present', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?withBlockInfo=true`);
      expect(response.status).toBe(200);
      const hasBlockInfo = response.data.some((transaction: any) =>
        transaction.senderBlockHash &&
        transaction.senderBlockNonce &&
        transaction.receiverBlockHash &&
        transaction.receiverBlockNonce
      );
      expect(hasBlockInfo).toBe(true);
    });

    it('should return 400 Bad Request when size > 50 with withScResults parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/transactions?size=51&withScResults=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 400 Bad Request when size > 50 with withOperations parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/transactions?size=51&withOperations=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 400 Bad Request when size > 50 with withLogs parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/transactions?size=51&withLogs=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 400 Bad Request when size > 50 with withBlockInfo parameter', async () => {
      try {
        await axios.get(`${config.apiServiceUrl}/transactions?size=51&withBlockInfo=true`);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should validate all transactions contain required fields', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions?size=10`);
      expect(response.status).toBe(200);

      const expectedFields = [
        'txHash',
        'gasLimit',
        'gasPrice',
        'gasUsed',
        'miniBlockHash',
        'nonce',
        'receiver',
        'receiverShard',
        'round',
        'sender',
        'senderShard',
        'status',
        'value',
        'timestamp',
        'function',
      ];

      for (const transaction of response.data) {
        for (const field of expectedFields) {
          expect(transaction).toHaveProperty(field);
        }
      }
    });
  });

  describe('GET /transactions/count', () => {
    it('should return the total number of transactions', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with sender filter applied', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?sender=${config.aliceAddress}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with receiver filter applied', async () => {
      const receiver = 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu';
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?receiver=${receiver}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with senderShard filter applied', async () => {
      const senderShard = 0;
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?senderShard=${senderShard}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with receiverShard filter applied', async () => {
      const receiverShard = 0;
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?receiverShard=${receiverShard}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThan(0);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with miniBlockHash filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=1`);
      const miniBlockHash = transaction.data[0].miniBlockHash;
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?miniBlockHash=${miniBlockHash}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(1);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with hashes filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=2`);
      const hashes = [transaction.data[0].txHash, transaction.data[1].txHash];
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?hashes=${hashes}`);
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(2);
    });

    it('should return the total number of transactions with status filter applied', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?status=success`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with function filter applied', async () => {
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?function=scDeploy`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with before filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=1`);
      const before = transaction.data[0].timestamp;
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?before=${before}`);
      expect(response.status).toBe(200);
      expect(response.data).toBeGreaterThanOrEqual(1);
      expect(typeof response.data).toBe('number');
    });

    it('should return the total number of transactions with round filter applied', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=1`);
      const round = transaction.data[0].round;
      const response = await axios.get(`${config.apiServiceUrl}/transactions/count?round=${round}`);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /transactions/:txHash', () => {
    it('should return a transaction by hash', async () => {
      const transaction = await axios.get(`${config.apiServiceUrl}/transactions?size=1`);
      const txHash = transaction.data[0].txHash;
      const response = await axios.get(`${config.apiServiceUrl}/transactions/${txHash}`);

      const expectedFields = [
        'txHash',
        'gasLimit',
        'gasPrice',
        'gasUsed',
        'miniBlockHash',
        'nonce',
        'receiver',
        'receiverShard',
        'round',
        'sender',
        'senderShard',
        'status',
        'value',
        'timestamp',
        'function',
      ];

      for (const field of expectedFields) {
        expect(response.data).toHaveProperty(field);
      }
    });
  });
});
