import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api.config.module";
import { GatewayModule } from "../external-calls-services/gateway.module";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => GatewayModule)
  ],
  providers: [
    MetricsService,
  ],
  exports: [
    MetricsService,
  ]
})
export class MetricsModule { }