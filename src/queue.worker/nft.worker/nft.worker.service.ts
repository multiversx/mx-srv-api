import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { CachingService } from "src/common/caching/caching.service";
import { NftThumbnailService } from "./queue/job-services/thumbnails/nft.thumbnail.service";

@Injectable()
export class NftWorkerService {
  private readonly logger: Logger;

  constructor(
    @InjectQueue('nftQueue') private nftQueue: Queue,
    private readonly cachingService: CachingService,
    private readonly nftThumbnailService: NftThumbnailService,
  ) {
    this.logger = new Logger(NftWorkerService.name);
  }

  async addProcessNftQueueJob(nft: Nft | undefined, settings: ProcessNftSettings): Promise<void> {
    if (!nft) {
      return;
    }

    this.logger.log('before needs processing');

    let needsProcessing = await this.needsProcessing(nft, settings);
    if (!needsProcessing) {
      this.logger.log(`No processing is needed for nft with identifier '${nft.identifier}'`);
      return;
    }
    this.logger.log('after needs processing');

    try {
      const job = await this.nftQueue.add({ identifier: nft.identifier, nft, settings }, {
        priority: 1000,
        attempts: 3,
        timeout: 60000,
        removeOnComplete: true
      });
      this.logger.log({ type: 'producer', jobId: job.id, identifier: job.data.identifier, settings });
    } catch (error) {
      this.logger.error(error);
    }

    this.logger.log('after adding to queue');

  }

  private async needsProcessing(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
    if (!settings.forceRefreshMedia) {
      let mediaKey = CacheInfo.NftMedia(nft.identifier).key;
      let mediaKeyResult = await this.cachingService.getKeys(mediaKey);
      if (mediaKeyResult.length === 0) {
        return true;
      }
    }

    if (!settings.forceRefreshMetadata) {
      let metadataKey = CacheInfo.NftMetadata(nft.identifier).key;
      let metadataKeyResult = await this.cachingService.getKeys(metadataKey);
      if (metadataKeyResult.length === 0) {
        return true;
      }
    }

    if (!settings.forceRefreshThumbnail && !settings.skipRefreshThumbnail) {
      if (nft.media) {
        for (let media of nft.media) {
          let hasThumbnailGenerated = await this.nftThumbnailService.hasThumbnailGenerated(nft.identifier, media.url);
          if (!hasThumbnailGenerated) {
            return true;
          }
        }
      }
    }

    return false;
  }
}