import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NftMediaDb } from "src/common/persistence/database/entities/nft.media.db";
import { NftMetadataDb } from "src/common/persistence/database/entities/nft.metadata.db";
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
        extra: {
          connectionLimit: 4
        }
      }),
      inject: [ApiConfigService],
    })
  ]
})
export class DatabaseModule { }