import { Injectable } from "@nestjs/common";
import { Data } from "src/endpoints/historical/entities/Data";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";


@Injectable()
export class DataService {
    private readonly quotesHistoricalUrl: string;
    private readonly stakingHistoricalUrl: string;
    private readonly stakingUsersHistoricalUrl: string;
    private readonly transactionsHistoricalUrl: string;


    constructor(
        private readonly apiConfigService: ApiConfigService,
        private readonly apiService: ApiService,
    ) {
        this.quotesHistoricalUrl = `${this.apiConfigService.getDataLatestCompleteUrl()}/quoteshistorical/egld`;
        this.stakingHistoricalUrl = `${this.apiConfigService.getDataLatestCompleteUrl()}/stakinghistorical/total`;
        this.stakingUsersHistoricalUrl = `${this.apiConfigService.getDataLatestUrl()}/stakinghistorical/total`;
        this.transactionsHistoricalUrl = `${this.apiConfigService.getDataLatestCompleteUrl()}/transactionshistorical/transactions`;
    };
    
    async getQuotesHistorical(quoteUrl: string): Promise<Data[]> {
        const { data } = await this.apiService.get(`${this.quotesHistoricalUrl}/${quoteUrl}`);

        return data;
    }

    async getStakingHistorical(stakeUrl: string): Promise<Data[]> {
        const { data } = await this.apiService.get(`${this.stakingHistoricalUrl}/${stakeUrl}`);

        return data;
    }

    async getStakingUsersHistorical(stakeUrl: string): Promise<number> {
        const { data } = await this.apiService.get(`${this.stakingUsersHistoricalUrl}/${stakeUrl}`);

        return data;
    }

    async getTransactionsHistorical(transactionsUrl: string): Promise<Data[]> {
        const { data } = await this.apiService.get(`${this.transactionsHistoricalUrl}/${transactionsUrl}`);

        return data;
    }

}