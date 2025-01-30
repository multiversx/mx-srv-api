import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IndexerService } from "src/common/indexer/indexer.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class BlsService {
  constructor(
    @Inject(forwardRef(() => IndexerService))
    private readonly indexerService: IndexerService,
    private readonly cachingService: CacheService,
  ) { }

  public async getPublicKeys(shard: number, epoch: number): Promise<string[]> {
    const cachedValue = await this.cachingService.getOrSet(
      CacheInfo.ShardAndEpochBlses(shard, epoch).key,
      async () => await this.getPublicKeysRaw(shard, epoch),
      CacheInfo.ShardAndEpochBlses(shard, epoch).ttl,
    );

    return cachedValue ? cachedValue : [];
  }

  private async getPublicKeysRaw(shard: number, epoch: number): Promise<string[] | undefined> {
    return await this.indexerService.getPublicKeys(shard, epoch);
  }

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    const publicKeys = await this.getPublicKeys(shardId, epoch);

    return publicKeys.indexOf(bls);
  }
}
