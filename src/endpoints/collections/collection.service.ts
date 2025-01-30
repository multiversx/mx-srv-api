import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { EsdtService } from "../esdt/esdt.service";
import { CollectionFilter } from "./entities/collection.filter";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { AssetsService } from "../../common/assets/assets.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { NftCollectionWithRoles } from "./entities/nft.collection.with.roles";
import { TokenProperties } from "../tokens/entities/token.properties";
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "../../common/assets/entities/token.assets";
import { EsdtAddressService } from "../esdt/esdt.address.service";
import { CollectionRoles } from "../tokens/entities/collection.roles";
import { TokenHelpers } from "src/utils/token.helpers";
import { NftCollectionAccount } from "./entities/nft.collection.account";
import { BinaryUtils, TokenUtils } from "@multiversx/sdk-nestjs-common";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { IndexerService } from "src/common/indexer/indexer.service";
import { Collection } from "src/common/indexer/entities";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { NftRankAlgorithm } from "src/common/assets/entities/nft.rank.algorithm";
import { NftRank } from "src/common/assets/entities/nft.rank";
import { TokenDetailed } from "../tokens/entities/token.detailed";
import { NftCollectionDetailed } from "./entities/nft.collection.detailed";
import { CollectionLogo } from "./entities/collection.logo";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { NftType as ElasticNftType } from "src/common/indexer/entities/nft.type";
import { NftSubType } from "../nfts/entities/nft.sub.type";

@Injectable()
export class CollectionService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly esdtService: EsdtService,
    private readonly assetsService: AssetsService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => EsdtAddressService))
    private readonly esdtAddressService: EsdtAddressService,
    private readonly persistenceService: PersistenceService,
  ) { }

  async isCollection(identifier: string): Promise<boolean> {
    const collection = await this.indexerService.getCollection(identifier);
    return collection !== undefined;
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    const tokenCollections = await this.indexerService.getNftCollections(pagination, filter);
    return await this.processNftCollections(tokenCollections);
  }

  async getNftCollectionsByIds(identifiers: Array<string>): Promise<NftCollection[]> {
    const tokenCollections = await this.indexerService.getNftCollectionsByIds(identifiers);
    return await this.processNftCollections(tokenCollections);
  }

  private async processNftCollections(tokenCollections: Collection[]): Promise<NftCollection[]> {
    const collectionsIdentifiers = tokenCollections.map((collection) => collection.token);

    const indexedCollections: Record<string, any> = {};
    for (const collection of tokenCollections) {
      indexedCollections[collection.token] = collection;
    }

    const nftCollections: NftCollection[] = await this.applyPropertiesToCollections(collectionsIdentifiers);

    for (const nftCollection of nftCollections) {
      const indexedCollection = indexedCollections[nftCollection.collection];
      if (!indexedCollection) {
        continue;
      }

      this.applyPropertiesToCollectionFromElasticSearch(nftCollection, indexedCollection);
    }

    return nftCollections;
  }

  applyPropertiesToCollectionFromElasticSearch(nftCollection: NftCollection, indexedCollection: Collection) {
    switch (indexedCollection.type) {
      case ElasticNftType.NonFungibleESDT:
      case ElasticNftType.NonFungibleESDTv2:
      case ElasticNftType.DynamicNonFungibleESDT:
        nftCollection.type = NftType.NonFungibleESDT;
        break;
      case ElasticNftType.MetaESDT:
      case ElasticNftType.DynamicMetaESDT:
        nftCollection.type = NftType.MetaESDT;
        break;
      case ElasticNftType.SemiFungibleESDT:
      case ElasticNftType.DynamicSemiFungibleESDT:
        nftCollection.type = NftType.SemiFungibleESDT;
        break;
    }

    nftCollection.subType = indexedCollection.type as NftSubType;
    nftCollection.timestamp = indexedCollection.timestamp;

    if (nftCollection.type.in(NftType.NonFungibleESDT, NftType.SemiFungibleESDT)) {
      nftCollection.isVerified = indexedCollection.api_isVerified;
      nftCollection.nftCount = indexedCollection.api_nftCount;
      nftCollection.holderCount = indexedCollection.api_holderCount;

      if (indexedCollection.nft_scamInfoType && indexedCollection.nft_scamInfoType !== 'none') {
        nftCollection.scamInfo = new ScamInfo({
          type: indexedCollection.nft_scamInfoType,
          info: indexedCollection.nft_scamInfoDescription,
        });
      }
    }
  }

  async applyPropertiesToCollections(collectionsIdentifiers: string[]): Promise<NftCollection[]> {
    const nftCollections: NftCollection[] = [];
    const collectionsProperties = await this.batchGetCollectionsProperties(collectionsIdentifiers);
    const collectionsAssets = await this.batchGetCollectionsAssets(collectionsIdentifiers);

    for (const collectionIdentifier of collectionsIdentifiers) {
      const collectionProperties = collectionsProperties[collectionIdentifier];
      if (!collectionProperties) {
        continue;
      }

      const nftCollection = new NftCollection();

      // @ts-ignore
      nftCollection.type = collectionProperties.type;
      nftCollection.name = collectionProperties.name;
      if (TokenUtils.isSovereignIdentifier(collectionIdentifier)) {
        nftCollection.collection = collectionIdentifier.split('-').slice(0, 3).join('-');
        nftCollection.ticker = collectionIdentifier.split('-')[1];
      } else {
        nftCollection.collection = collectionIdentifier.split('-').slice(0, 2).join('-');
        nftCollection.ticker = collectionIdentifier.split('-')[0];
      }

      nftCollection.canFreeze = collectionProperties.canFreeze;
      nftCollection.canWipe = collectionProperties.canWipe;
      nftCollection.canPause = collectionProperties.canPause;
      nftCollection.canTransferNftCreateRole = collectionProperties.canTransferNFTCreateRole;
      nftCollection.canChangeOwner = collectionProperties.canChangeOwner;
      nftCollection.canUpgrade = collectionProperties.canUpgrade;
      nftCollection.canAddSpecialRoles = collectionProperties.canAddSpecialRoles;
      nftCollection.owner = collectionProperties.owner;

      if (nftCollection.type === NftType.MetaESDT) {
        nftCollection.decimals = collectionProperties.decimals;
      }

      nftCollection.assets = collectionsAssets[collectionIdentifier];

      nftCollections.push(nftCollection);
    }

    return nftCollections;
  }

  async batchGetCollectionsProperties(identifiers: string[]): Promise<{ [key: string]: TokenProperties | undefined }> {
    if (this.apiConfigService.getCollectionPropertiesFromGateway()) {
      return await this.getCollectionProperties(identifiers);
    }

    return await this.getEsdtProperties(identifiers);
  }

  async batchGetCollectionsAssets(identifiers: string[]): Promise<{ [key: string]: TokenAssets | undefined }> {
    const collectionsAssets: { [key: string]: TokenAssets | undefined } = {};

    await this.cachingService.batchApplyAll(
      identifiers,
      identifier => CacheInfo.EsdtAssets(identifier).key,
      identifier => this.assetsService.getTokenAssets(identifier),
      (identifier, properties) => collectionsAssets[identifier] = properties,
      CacheInfo.EsdtAssets('').ttl
    );

    return collectionsAssets;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.indexerService.getNftCollectionCount(filter);
  }

  async getNftCollectionRanks(identifier: string): Promise<NftRank[] | undefined> {
    const elasticCollection = await this.indexerService.getCollection(identifier);
    if (!elasticCollection) {
      return undefined;
    }

    const assets = await this.assetsService.getTokenAssets(identifier);
    if (!assets) {
      return undefined;
    }

    if (assets.preferredRankAlgorithm !== NftRankAlgorithm.custom) {
      return undefined;
    }

    return await this.assetsService.getCollectionRanks(identifier);
  }

  async getNftCollection(identifier: string): Promise<NftCollectionDetailed | undefined> {
    const elasticCollection = await this.indexerService.getCollection(identifier);
    if (!elasticCollection) {
      return undefined;
    }

    if (!TokenUtils.isCollection(identifier)) {
      return undefined;
    }

    if (!Object.values(ElasticNftType).includes(elasticCollection.type as NftType)) {
      return undefined;
    }

    const [collection] = await this.applyPropertiesToCollections([identifier]);

    if (!collection) {
      return undefined;
    }

    const collectionDetailed = ApiUtils.mergeObjects(new NftCollectionDetailed(), collection);
    collectionDetailed.type = elasticCollection.type as NftType;
    collectionDetailed.timestamp = elasticCollection.timestamp;

    this.applyPropertiesToCollectionFromElasticSearch(collectionDetailed, elasticCollection);

    collectionDetailed.traits = await this.persistenceService.getCollectionTraits(identifier) ?? [];

    await this.applyCollectionRoles(collectionDetailed, elasticCollection);

    return collectionDetailed;
  }

  async applyCollectionRoles(collection: NftCollectionDetailed | TokenDetailed, elasticCollection: any) {
    collection.roles = await this.getNftCollectionRolesFromGateway(elasticCollection);
    const isTransferProhibitedByDefault = collection.roles?.some(x => x.canTransfer === true) === true;
    collection.canTransfer = !isTransferProhibitedByDefault;
    if (collection.canTransfer) {
      for (const role of collection.roles) {
        role.canTransfer = undefined;
      }
    }
  }

  async getNftCollectionRoles(elasticCollection: any): Promise<CollectionRoles[]> {
    return await this.getNftCollectionRolesFromElasticResponse(elasticCollection);
  }

  async getNftCollectionRolesFromGateway(elasticCollection: any): Promise<CollectionRoles[]> {
    return await this.getNftCollectionRolesFromEsdtContract(elasticCollection.token);
  }

  private getNftCollectionRolesFromElasticResponse(elasticCollection: any): CollectionRoles[] {
    if (!elasticCollection.roles) {
      return [];
    }

    const allRoles: CollectionRoles[] = [];
    for (const role of Object.keys(elasticCollection.roles)) {
      const addresses = elasticCollection.roles[role].distinct();

      for (const address of addresses) {
        const foundAddressRoles = allRoles.find((addressRole) => addressRole.address === address);
        if (foundAddressRoles) {
          TokenHelpers.setCollectionRole(foundAddressRoles, role);
          continue;
        }

        const addressRole = new CollectionRoles();
        addressRole.address = address;
        TokenHelpers.setCollectionRole(addressRole, role);

        allRoles.push(addressRole);
      }
    }

    return allRoles;
  }

  private async getNftCollectionRolesFromEsdtContract(identifier: string): Promise<CollectionRoles[]> {
    const collectionRolesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getSpecialRoles',
      undefined,
      [BinaryUtils.stringToHex(identifier)]
    );

    if (!collectionRolesEncoded) {
      return [];
    }

    const allRoles: CollectionRoles[] = [];

    for (const rolesForAddressEncoded of collectionRolesEncoded) {
      const rolesForAddressDecoded = BinaryUtils.base64Decode(rolesForAddressEncoded);
      const components = rolesForAddressDecoded.split(':');

      const roleForAddress = new CollectionRoles();
      roleForAddress.address = components[0];
      const roles = components[1].split(',');
      for (const role of roles) {
        TokenHelpers.setCollectionRole(roleForAddress, role);
      }

      allRoles.push(roleForAddress);
    }

    return allRoles;
  }

  async getCollectionForAddressWithRole(address: string, collection: string): Promise<NftCollectionWithRoles | undefined> {
    const filter: CollectionFilter = { collection };

    const collections = await this.esdtAddressService.getCollectionsForAddress(address, filter, new QueryPagination({ from: 0, size: 1 }));
    if (collections.length === 0) {
      return undefined;
    }

    return collections[0];
  }

  async getCollectionsWithRolesForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<NftCollectionWithRoles[]> {
    return await this.esdtAddressService.getCollectionsForAddress(address, filter, pagination);
  }

  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    const collections = await this.getCollectionsForAddress(address, filter, new QueryPagination({ from: 0, size: 10000 }));

    return collections.length;
  }

  async getCollectionForAddress(address: string, identifier: string): Promise<NftCollectionAccount | undefined> {
    if (!TokenUtils.isCollection(identifier)) {
      return undefined;
    }

    const collections = await this.getCollectionsForAddress(address, new CollectionFilter({ collection: identifier }), new QueryPagination({ from: 0, size: 1 }));

    const collection = collections.find(x => x.collection === identifier);
    if (!collection) {
      return undefined;
    }

    return collection;
  }

  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<NftCollectionAccount[]> {
    const collectionsRaw = await this.indexerService.getCollectionsForAddress(address, filter, pagination);

    const collections = await this.getNftCollections(
      new QueryPagination({ from: 0, size: collectionsRaw.length }),
      new CollectionFilter({ identifiers: collectionsRaw.map((x: any) => x.collection) })
    );
    const accountCollections = collections.map(collection => ApiUtils.mergeObjects(new NftCollectionAccount(), collection));

    for (const collection of accountCollections) {
      const item = collectionsRaw.find(x => x.collection === collection.collection);
      if (item) {
        collection.count = item.count;
      }
    }

    return accountCollections;
  }

  async getCollectionCountForAddressWithRoles(address: string, filter: CollectionFilter): Promise<number> {
    return await this.esdtAddressService.getCollectionCountForAddressFromElastic(address, filter);
  }

  private async getCollectionLogo(identifier: string): Promise<CollectionLogo | undefined> {
    const assets = await this.assetsService.getTokenAssets(identifier);
    if (!assets) {
      return;
    }

    return new CollectionLogo({ pngUrl: assets.pngUrl, svgUrl: assets.svgUrl });
  }

  async getLogoPng(identifier: string): Promise<string | undefined> {
    const collectionLogo = await this.getCollectionLogo(identifier);
    if (!collectionLogo) {
      return;
    }

    return collectionLogo.pngUrl;
  }

  async getLogoSvg(identifier: string): Promise<string | undefined> {
    const collectionLogo = await this.getCollectionLogo(identifier);
    if (!collectionLogo) {
      return;
    }

    return collectionLogo.svgUrl;
  }

  private async getCollectionProperties(identifiers: string[]): Promise<{ [key: string]: TokenProperties | undefined }> {
    const collectionsProperties: { [key: string]: TokenProperties | undefined } = {};

    await this.cachingService.batchApplyAll(
      identifiers,
      identifier => CacheInfo.CollectionProperties(identifier).key,
      identifier => this.esdtService.getCollectionProperties(identifier),
      (identifier, properties) => collectionsProperties[identifier] = properties,
      CacheInfo.CollectionProperties('').ttl
    );

    return collectionsProperties;
  }

  private async getEsdtProperties(identifiers: string[]): Promise<{ [key: string]: TokenProperties | undefined }> {
    const collectionsProperties: { [key: string]: TokenProperties | undefined } = {};

    await this.cachingService.batchApplyAll(
      identifiers,
      identifier => CacheInfo.EsdtProperties(identifier).key,
      identifier => this.esdtService.getEsdtTokenProperties(identifier),
      (identifier, properties) => collectionsProperties[identifier] = properties,
      CacheInfo.EsdtProperties('').ttl
    );

    return collectionsProperties;
  }
}
