import axios from 'axios';
import { config } from '../config/env.config';
import { DeployScArgs } from './chain.simulator.operations';
import { fundAddress } from './chain.simulator.operations';
import { deploySc } from './chain.simulator.operations';
import fs from 'fs';
export class ChainSimulatorUtils {
  static async waitForEpoch(targetEpoch: number = 2, maxRetries: number = 50) {
    try {
      // First check if simulator is running
      await this.checkSimulatorHealth(maxRetries);

      let retries = 0;
      while (retries < maxRetries) {
        try {
          const networkStatus = await axios.get(`${config.chainSimulatorUrl}/network/status/4294967295`);
          const currentEpoch = networkStatus.data.erd_epoch_number;

          if (currentEpoch >= targetEpoch) {
            return true;
          }

          await axios.post(
            `${config.chainSimulatorUrl}/simulator/generate-blocks-until-epoch-reached/${targetEpoch}`,
            {},
          );

          // Verify we reached the target epoch
          const stats = await axios.get(`${config.apiServiceUrl}/stats`);
          const newEpoch = stats.data.epoch;

          if (newEpoch >= targetEpoch) {
            return true;
          }

          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw new Error(`Failed to reach epoch ${targetEpoch} after ${maxRetries} retries`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      throw new Error(`Failed to reach epoch ${targetEpoch} after ${maxRetries} retries`);
    } catch (error) {
      console.error('Error in waitForEpoch:', error);
      throw error;
    }
  }

  private static async checkSimulatorHealth(maxRetries: number = 50): Promise<boolean> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(`${config.chainSimulatorUrl}/simulator/observers`);
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error('Chain simulator not started or not responding!');
        }
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return false;
  }

  public static async deployPingPongSc(deployer: string): Promise<string> {
    try {
      const contractCodeRaw = fs.readFileSync('./src/test/chain-simulator/utils/contracts/ping-pong-egld.wasm');
      const contractArgs = [
        '0de0b6b3a7640000',
      ];

      await fundAddress(config.chainSimulatorUrl, deployer);

      const scAddress = await deploySc(new DeployScArgs({
        chainSimulatorUrl: config.chainSimulatorUrl,
        deployer: deployer,
        contractCodeRaw: contractCodeRaw,
        hexArguments: contractArgs,
      }));

      console.log(`Deployed ping pong SC. Address: ${scAddress} with deployer: ${deployer}`);
      return scAddress;
    } catch (error) {
      console.error('Error deploying ping pong SC:', error);
      throw error;
    }
  }
}
