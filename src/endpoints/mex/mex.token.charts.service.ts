import { Injectable } from "@nestjs/common";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { gql } from 'graphql-request';
import { MexTokenChart } from "./entities/mex.token.chart";

@Injectable()
export class MexTokenChartsService {
  private readonly logger = new OriginLogger(MexTokenChartsService.name);

  constructor(
    private readonly graphQlService: GraphQlService
  ) { }

  async getTokenPricesHourResolution(tokenIdentifier: string): Promise<MexTokenChart[]> {
    const query = gql`
      query tokenPricesHourResolution {
        values24h(
          series: "${tokenIdentifier}",
          metric: "priceUSD"
        ) {
          timestamp
          value
        }
      }
    `;

    try {
      const data = await this.graphQlService.getExchangeServiceData(query);
      return this.convertToMexTokenChart(data?.values24h) || [];
    } catch (error) {
      this.logger.error(`An error occurred while fetching hourly token prices for ${tokenIdentifier}`, error);
      return [];
    }
  }

  async getTokenPricesDayResolution(tokenIdentifier: string, start: string): Promise<MexTokenChart[]> {
    const query = gql`
      query tokenPriceDayResolution {
        latestCompleteValues(
          series: "${tokenIdentifier}",
          metric: "priceUSD",
          start: "${start}"
        ) {
          timestamp
          value
        }
      }
    `;

    try {
      const data = await this.graphQlService.getExchangeServiceData(query);
      return this.convertToMexTokenChart(data?.latestCompleteValues) || [];
    } catch (error) {
      this.logger.error(`An error occurred while fetching daily token prices for ${tokenIdentifier}`, error);
      return [];
    }
  }

  private convertToMexTokenChart(data: { timestamp: string; value: string }[]): MexTokenChart[] {
    return data?.map(item => new MexTokenChart({
      timestamp: Math.floor(new Date(item.timestamp).getTime() / 1000),
      value: Number(item.value),
    })) || [];
  }
}
