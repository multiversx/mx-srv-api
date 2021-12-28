import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NftMediaDb } from "src/queue.worker/nft.worker/queue/job-services/media/entities/nft.media.db";
import { NftMetadataDb } from "src/queue.worker/nft.worker/queue/job-services/metadata/entities/nft.metadata.db";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiConfigService } from "../api-config/api.config.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => ({
        type: 'mysql',
        ...apiConfigService.getDatabaseConnection(),
        entities: [NftMetadataDb, NftMediaDb],
        keepConnectionAlive: true,
        synchronize: true,
      }),
      inject: [ApiConfigService],
    })
  ]
})
export class DatabaseModule { }