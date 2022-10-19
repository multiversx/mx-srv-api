import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { StatusMetricsModule } from "src/common/metrics/status.metrics.module";
import { EndpointsServicesModule } from "src/endpoints/endpoints.services.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { CronsApiStatusCheckerService } from "./api.status.checker.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
    StatusMetricsModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    CronsApiStatusCheckerService, ElasticIndexerService,
  ],
})
export class CronsApiStatusCheckerModule { }
