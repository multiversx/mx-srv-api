import { BadRequestException, Injectable } from "@nestjs/common";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { AccountStats } from "./entities/account.stats";
import { AccountStatsFilters } from "./entities/account.stats.filter";
import { Auction } from "./entities/auction";
import { StatusAuction } from "./entities/auction.state.enum";
import { CollectionStats } from "./entities/collection.stats";
import { CollectionStatsFilters } from "./entities/collection.stats.filter";
import { ExploreCollectionsStats } from "./entities/explore.collections.stats";
import { ExploreNftsStats } from "./entities/explore.nfts.stats";
import { ExploreStats } from "./entities/explore.stats";
import { accountAuctionsQuery } from "./graphql/account.auctions.query";
import { accountStatsQuery } from "./graphql/account.stats.query";
import { collectionStatsQuery } from "./graphql/collection.stats.query";
import { collectionsStatsQuery, nftsStatsQuery, statsQuery } from "./graphql/explore.query";

@Injectable()
export class NftMarketplaceService {
  constructor(
    private readonly graphQlService: GraphQlService,
  ) { }

  async getAccountStats(filters: AccountStatsFilters): Promise<AccountStats> {
    const variables = { filters };
    const result: any = await this.graphQlService.getDataFromMarketPlace(accountStatsQuery, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch accountsStats data from Nft Marketplace');
    }
    return {
      address: result.accountStats.address,
      auctions: result.accountStats.auctions,
      claimable: result.accountStats.claimable,
      collected: result.accountStats.collected,
      collections: result.accountStats.collections,
      creations: result.accountStats.creations,
      likes: result.accountStats.likes,
      marketplaceKey: result.accountStats.marketplaceKey,
      orders: result.accountStats.orders,
    };
  }

  async getCollectionStats(filters: CollectionStatsFilters): Promise<CollectionStats> {
    const variables = { filters };
    const result: any = await this.graphQlService.getDataFromMarketPlace(collectionStatsQuery, variables);

    if (!result) {
      throw new BadRequestException('Count not fetch collectionStats data from Nft Marketplace');
    }

    return {
      identifier: result.collectionStats.identifier,
      activeAuctions: result.collectionStats.activeAuctions,
      auctionsEnded: result.collectionStats.auctionsEnded,
      maxPrice: result.collectionStats.maxPrice,
      minPrice: result.collectionStats.minPrice,
      saleAverage: result.collectionStats.saleAverage,
      volumeTraded: result.collectionStats.volumeTraded,
      items: result.collectionStats.items,
    };
  }

  async getExploreNftsStats(): Promise<ExploreNftsStats> {
    const result: any = await this.graphQlService.getDataFromMarketPlace(nftsStatsQuery, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreNftsStats data from Nft Marketplace');
    }

    return {
      buyNowCount: result.exploreNftsStats.buyNowCount,
      liveAuctionsCount: result.exploreNftsStats.liveAuctionsCount,
    };
  }

  async getExploreCollectionsStats(): Promise<ExploreCollectionsStats> {
    const result: any = await this.graphQlService.getDataFromMarketPlace(collectionsStatsQuery, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreCollectionsStats data from Nft Marketplace');
    }

    return {
      verifiedCount: result.exploreCollectionsStats.verifiedCount,
      activeLast30DaysCount: result.exploreCollectionsStats.activeLast30DaysCount,
    };
  }

  async getExploreStats(): Promise<ExploreStats> {
    const result: any = await this.graphQlService.getDataFromMarketPlace(statsQuery, {});

    if (!result) {
      throw new BadRequestException('Count not fetch exploreStats data from Nft Marketplace');
    }

    return {
      artists: result.exploreStats.artists,
      collections: result.exploreStats.collections,
      nfts: result.exploreStats.nfts,
    };
  }

  async getAccountAuctions(address: string, state: StatusAuction): Promise<Auction[]> {
    const result: any = await this.graphQlService.getDataFromMarketPlace(accountAuctionsQuery(address, state), {});
    if (!result) {
      return [];
    }

    const auctions = result.auctions.edges.map((auction: any) => {
      const accountAuction = new Auction();

      accountAuction.auctionId = auction.node.id;
      accountAuction.identifier = auction.node.identifier;
      accountAuction.collection = auction.node.collection;
      accountAuction.status = auction.node.status;
      accountAuction.creationDate = auction.node.creationDate;
      accountAuction.endDate = auction.node.endDate;
      accountAuction.marketplace = auction.node.marketplace.key;
      accountAuction.marketplaceAuctionId = auction.node.marketplaceAuctionId;
      accountAuction.owner = auction.node.owner.address;
      accountAuction.tags = auction.node.tags;

      return accountAuction;
    });

    return auctions;
  }
}
