import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";

@Injectable()
export class DataApiService {
  private readonly quotesHistoricalLatestUrl: string;
  private readonly stakingUsersHistoricalUrl: string;


  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.quotesHistoricalLatestUrl = `${this.apiConfigService.getDataLatestUrl()}/quoteshistorical/egld`;
    this.stakingUsersHistoricalUrl = `${this.apiConfigService.getDataLatestUrl()}/stakinghistorical/total`;
  };
  
  async getQuotesHistorical(quoteUrl: string): Promise<Data[]> {
    const { data } = await this.apiService.get(`${this.quotesHistoricalUrl}/${quoteUrl}`);

    return data;
  }

  async getQuotesHistoricalTimestamp(quoteUrl: string, timestamp: number): Promise<number> {
    const { data } = await this.apiService.get(`https://data.elrond.com/closing/quoteshistorical/egld/${quoteUrl}/${timestamp}`);

    return data;
  }

  async getQuotesHistoricalLatest(quoteUrl: string): Promise<number> {
    const { data } = await this.apiService.get(`${this.quotesHistoricalLatestUrl}/${quoteUrl}`);

    return data;
  }

  async getStakingUsersHistorical(stakeUrl: string): Promise<number> {
    const { data } = await this.apiService.get(`${this.stakingUsersHistoricalUrl}/${stakeUrl}`);

    return data;
  }
}