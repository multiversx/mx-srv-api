import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, NotFoundException, Param, Query, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { CollectionService } from "./collection.service";
import { Nft } from "../nfts/entities/nft";
import { NftService } from "../nfts/nft.service";
import { NftFilter } from "../nfts/entities/nft.filter";
import { NftQueryOptions } from "../nfts/entities/nft.query.options";
import { ParseAddressPipe, ParseArrayPipe, ParseCollectionPipe, ParseBoolPipe, ParseEnumArrayPipe, ParseIntPipe, ApplyComplexity, ParseAddressArrayPipe, ParseBlockHashPipe, ParseEnumPipe, ParseRecordPipe, ParseNftArrayPipe, ParseCollectionArrayPipe } from '@multiversx/sdk-nestjs-common';
import { QueryPagination } from "src/common/entities/query.pagination";
import { CollectionFilter } from "./entities/collection.filter";
import { CollectionAccount } from "./entities/collection.account";
import { TransactionDetailed } from "../transactions/entities/transaction.detailed";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionQueryOptions } from "../transactions/entities/transactions.query.options";
import { TransactionService } from "../transactions/transaction.service";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { NftRank } from "src/common/assets/entities/nft.rank";
import { SortCollectionNfts } from "./entities/sort.collection.nfts";
import { NftCollectionDetailed } from "./entities/nft.collection.detailed";
import { Response } from "express";
import { SortCollections } from "./entities/sort.collections";
import { ParseArrayPipeOptions } from "@multiversx/sdk-nestjs-common/lib/pipes/entities/parse.array.options";
import { TransferService } from "../transfers/transfer.service";
import { NftSubType } from "../nfts/entities/nft.sub.type";

@Controller()
@ApiTags('collections')
export class CollectionController {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly nftService: NftService,
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService
  ) { }

  @Get("/collections")
  @ApiOperation({ summary: 'Collections', description: 'Returns non-fungible/semi-fungible/meta-esdt collections' })
  @ApiOkResponse({ type: [NftCollection] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by collection identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'subType', description: 'Filter by type (NonFungibleESDTv2/DynamicNonFungibleESDT/DynamicSemiFungibleESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter collections where the given address has a creator role', required: false, deprecated: true })
  @ApiQuery({ name: 'before', description: 'Return all collections before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all collections after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'canCreate', description: 'Filter by address with canCreate role', required: false })
  @ApiQuery({ name: 'canBurn', description: 'Filter by address with canBurn role', required: false })
  @ApiQuery({ name: 'canAddQuantity', description: 'Filter by address with canAddQuantity role', required: false })
  @ApiQuery({ name: 'canUpdateAttributes', description: 'Filter by address with canUpdateAttributes role', required: false })
  @ApiQuery({ name: 'canAddUri', description: 'Filter by address with canAddUri role', required: false })
  @ApiQuery({ name: 'canTransferRole', description: 'Filter by address with canTransferRole role', required: false })
  @ApiQuery({ name: 'excludeMetaESDT', description: 'Do not include collections of type "MetaESDT" in the response', required: false })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: SortCollections })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  async getNftCollections(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseCollectionArrayPipe) identifiers?: string[],
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('subType', new ParseEnumArrayPipe(NftSubType)) subType?: NftSubType[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('canCreate', ParseAddressPipe) canCreate?: string,
    @Query('canBurn', ParseAddressPipe) canBurn?: string,
    @Query('canAddQuantity', ParseAddressPipe) canAddQuantity?: string,
    @Query('canUpdateAttributes', ParseAddressPipe) canUpdateAttributes?: string,
    @Query('canAddUri', ParseAddressPipe) canAddUri?: string,
    @Query('canTransferRole', ParseAddressPipe) canTransferRole?: string,
    @Query('excludeMetaESDT', ParseBoolPipe) excludeMetaESDT?: boolean,
    @Query('sort', new ParseEnumPipe(SortCollections)) sort?: SortCollections,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<NftCollection[]> {
    return await this.collectionService.getNftCollections(new QueryPagination({ from, size }), new CollectionFilter({
      search,
      type,
      subType,
      identifiers,
      canCreate: canCreate ?? creator,
      before,
      after,
      canBurn,
      canAddQuantity,
      canUpdateAttributes,
      canAddUri,
      canTransferRole,
      excludeMetaESDT,
      sort,
      order,
    }));
  }

  @Get("/collections/count")
  @ApiOperation({ summary: 'Collection count', description: 'Returns non-fungible/semi-fungible/meta-esdt collection count' })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'creator', description: 'Filter collections where the given address has a creator role', required: false, deprecated: true })
  @ApiQuery({ name: 'before', description: 'Return all collections before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all collections after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'canCreate', description: 'Filter by address with canCreate role', required: false })
  @ApiQuery({ name: 'canBurn', description: 'Filter by address with canBurn role', required: false })
  @ApiQuery({ name: 'canAddQuantity', description: 'Filter by address with canAddQuantity role', required: false })
  @ApiQuery({ name: 'canUpdateAttributes', description: 'Filter by address with canUpdateAttributes role', required: false })
  @ApiQuery({ name: 'canAddUri', description: 'Filter by address with canAddUri role', required: false })
  @ApiQuery({ name: 'canTransferRole', description: 'Filter by address with canTransferRole role', required: false })
  @ApiQuery({ name: 'excludeMetaESDT', description: 'Do not include collections of type "MetaESDT" in the response', required: false })
  @ApiOkResponse({ type: Number })
  async getCollectionCount(
    @Query('search') search?: string,
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('subType', new ParseEnumArrayPipe(NftSubType)) subType?: NftSubType[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('canCreate', ParseAddressPipe) canCreate?: string,
    @Query('canBurn', ParseAddressPipe) canBurn?: string,
    @Query('canAddQuantity', ParseAddressPipe) canAddQuantity?: string,
    @Query('canUpdateAttributes', ParseAddressPipe) canUpdateAttributes?: string,
    @Query('canAddUri', ParseAddressPipe) canAddUri?: string,
    @Query('canTransferRole', ParseAddressPipe) canTransferRole?: string,
    @Query('excludeMetaESDT', ParseBoolPipe) excludeMetaESDT?: boolean,
  ): Promise<number> {
    return await this.collectionService.getNftCollectionCount(new CollectionFilter({
      search,
      type,
      subType,
      canCreate: canCreate ?? creator,
      before,
      after,
      canBurn,
      canAddQuantity,
      canUpdateAttributes,
      canAddUri,
      canTransferRole,
      excludeMetaESDT,
    }));
  }

  @Get("/collections/c")
  @ApiExcludeEndpoint()
  async getCollectionCountAlternative(
    @Query('search') search?: string,
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('canCreate', ParseAddressPipe) canCreate?: string,
    @Query('canBurn', ParseAddressPipe) canBurn?: string,
    @Query('canAddQuantity', ParseAddressPipe) canAddQuantity?: string,
    @Query('canUpdateAttributes', ParseAddressPipe) canUpdateAttributes?: string,
    @Query('canAddUri', ParseAddressPipe) canAddUri?: string,
    @Query('canTransferRole', ParseAddressPipe) canTransferRole?: string,
    @Query('excludeMetaESDT', ParseBoolPipe) excludeMetaESDT?: boolean,
  ): Promise<number> {
    return await this.collectionService.getNftCollectionCount(new CollectionFilter({
      search,
      type,
      canCreate: canCreate ?? creator,
      before,
      after,
      canBurn,
      canAddQuantity,
      canUpdateAttributes,
      canAddUri,
      canTransferRole,
      excludeMetaESDT,
    }));
  }

  @Get('/collections/:collection')
  @ApiOperation({ summary: 'Collection details', description: 'Returns non-fungible/semi-fungible/meta-esdt collection details' })
  @ApiOkResponse({ type: NftCollectionDetailed })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  async getNftCollection(
    @Param('collection', ParseCollectionPipe) collection: string,
  ): Promise<NftCollectionDetailed> {
    const nftCollection = await this.collectionService.getNftCollection(collection);
    if (nftCollection === undefined) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return nftCollection;
  }

  @Get('/collections/:collection/ranks')
  @ApiOperation({ summary: 'Collection ranks', description: 'Returns NFT ranks in case the custom ranking preferred algorithm was set' })
  @ApiOkResponse({ type: NftRank, isArray: true })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  async getNftCollectionRanks(
    @Param('collection', ParseCollectionPipe) collection: string
  ): Promise<NftRank[]> {
    const ranks = await this.collectionService.getNftCollectionRanks(collection);
    if (ranks === undefined) {
      throw new HttpException('Ranks for collection not found', HttpStatus.NOT_FOUND);
    }

    return ranks;
  }

  @Get("/collections/:collection/nfts")
  @ApiOperation({ summary: 'Collection NFTs', description: 'Returns non-fungible/semi-fungible/meta-esdt tokens that belong to a collection' })
  @ApiOkResponse({ type: [Nft] })
  @ApplyComplexity({ target: Nft })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'isNsfw', description: 'Filter by NSFW status', required: false, type: Boolean })
  @ApiQuery({ name: 'traits', description: 'Filter NFTs by traits. Key-value format (<key1>:<value1>;<key2>:<value2>)', required: false, type: Boolean })
  @ApiQuery({ name: 'nonceBefore', description: 'Return all NFTs with given nonce before the given number', required: false, type: Number })
  @ApiQuery({ name: 'nonceAfter', description: 'Return all NFTs with given nonce after the given number', required: false, type: Number })
  @ApiQuery({ name: 'withOwner', description: 'Return owner where type = NonFungibleESDT', required: false, type: Boolean })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false, type: Boolean })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: SortCollectionNfts })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  async getNfts(
    @Param('collection', ParseCollectionPipe) collection: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseNftArrayPipe) identifiers?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', ParseBoolPipe) isNsfw?: boolean,
    @Query('traits', ParseRecordPipe) traits?: Record<string, string>,
    @Query('nonceBefore', ParseIntPipe) nonceBefore?: number,
    @Query('nonceAfter', ParseIntPipe) nonceAfter?: number,
    @Query('withOwner', ParseBoolPipe) withOwner?: boolean,
    @Query('withSupply', ParseBoolPipe) withSupply?: boolean,
    @Query('sort', new ParseEnumPipe(SortCollectionNfts)) sort?: SortCollectionNfts,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<Nft[]> {
    const isCollection = await this.collectionService.isCollection(collection);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.nftService.getNfts(
      new QueryPagination({ from, size }),
      new NftFilter({ search, identifiers, collection, name, tags, creator, hasUris, isWhitelistedStorage, isNsfw, traits, nonceBefore, nonceAfter, sort, order }),
      new NftQueryOptions({ withOwner, withSupply }),
    );
  }

  @Get("/collections/:collection/nfts/count")
  @ApiOperation({ summary: 'Collection NFT count', description: 'Returns non-fungible/semi-fungible/meta-esdt token count that belong to a collection' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token collection not found' })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'traits', description: 'Filter NFTs by traits. Key-value format (<key1>:<value1>;<key2>:<value2>)', required: false, type: Boolean })
  @ApiQuery({ name: 'nonceBefore', description: 'Return all NFTs with given nonce before the given number', required: false, type: Number })
  @ApiQuery({ name: 'nonceAfter', description: 'Return all NFTs with given nonce after the given number', required: false, type: Number })
  async getNftCount(
    @Param('collection', ParseCollectionPipe) collection: string,
    @Query('search') search?: string,
    @Query('identifiers', ParseNftArrayPipe) identifiers?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', ParseBoolPipe) hasUris?: boolean,
    @Query('traits', ParseRecordPipe) traits?: Record<string, string>,
    @Query('nonceBefore', ParseIntPipe) nonceBefore?: number,
    @Query('nonceAfter', ParseIntPipe) nonceAfter?: number,
  ): Promise<number> {
    const isCollection = await this.collectionService.isCollection(collection);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.nftService.getNftCount(new NftFilter({ search, identifiers, collection, name, tags, creator, isWhitelistedStorage, hasUris, traits, nonceBefore, nonceAfter }));
  }

  @Get('/collections/:identifier/accounts')
  @ApiOperation({ summary: 'Collection accounts', description: 'Returns a list of addresses and balances for a specific collection' })
  @ApiOkResponse({ type: [CollectionAccount] })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getNftAccounts(
    @Param('identifier', ParseCollectionPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<CollectionAccount[]> {
    const owners = await this.nftService.getCollectionOwners(identifier, new QueryPagination({ from, size }));
    if (!owners) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return owners;
  }

  @Get("/collections/:collection/transactions")
  @ApiOperation({ summary: 'Collection transactions', description: `Returns a list of transactions for a specific collection.` })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  async getCollectionTransactions(
    @Param('collection', ParseCollectionPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withScResults', ParseBoolPipe) withScResults?: boolean,
    @Query('withOperations', ParseBoolPipe) withOperations?: boolean,
    @Query('withLogs', ParseBoolPipe) withLogs?: boolean,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ) {
    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScResults, withOperations, withLogs, withScamInfo, withUsername });

    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    const transactionFilter = new TransactionFilter({
      sender,
      receivers: receiver,
      token: identifier,
      functions,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      before,
      after,
      order,
      round,
      withRelayedScresults,
    });
    TransactionFilter.validate(transactionFilter, size);

    return await this.transactionService.getTransactions(transactionFilter, new QueryPagination({ from, size }), options);
  }

  @Get("/collections/:collection/transactions/count")
  @ApiOperation({ summary: 'NFT transactions count', description: 'Returns the total number of transactions for a specific collection' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  async getCollectionTransactionsCount(
    @Param('collection', ParseCollectionPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ) {
    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.transactionService.getTransactionCount(new TransactionFilter({
      sender,
      receivers: receiver,
      token: identifier,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      before,
      after,
      round,
      withRelayedScresults,
    }));
  }

  @Get("/collections/:collection/transfers")
  @ApiOperation({ summary: 'Collection transactions', description: `Returns a list of transactions for a specific collection.` })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  async getCollectionTransfers(
    @Param('collection', ParseCollectionPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withScResults', ParseBoolPipe) withScResults?: boolean,
    @Query('withOperations', ParseBoolPipe) withOperations?: boolean,
    @Query('withLogs', ParseBoolPipe) withLogs?: boolean,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
  ) {
    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScResults, withOperations, withLogs, withScamInfo, withUsername });

    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.transferService.getTransfers(new TransactionFilter({
      sender,
      receivers: receiver,
      token: identifier,
      functions,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      before,
      after,
      order,
      round,
    }), new QueryPagination({ from, size }), options);
  }

  @Get("/collections/:collection/transfers/count")
  @ApiOperation({ summary: 'NFT transfers count', description: 'Returns the total number of transfers for a specific collection' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transfer (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  async getCollectionTransfersCount(
    @Param('collection', ParseCollectionPipe) identifier: string,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
  ) {
    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({
      sender,
      receivers: receiver,
      token: identifier,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      before,
      after,
      functions,
      round,
    }));
  }

  @Get('/collections/:identifier/logo/png')
  @ApiOperation({ summary: 'Collection png logo', description: 'Returns collection PNG logo ', deprecated: true })
  async getCollectionLogoPng(
    @Param('identifier', ParseCollectionPipe) identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new NotFoundException('Collection not found');
    }

    const url = await this.collectionService.getLogoPng(identifier);
    if (url === undefined) {
      throw new NotFoundException('Assets not found');
    }

    response.redirect(url);
  }

  @Get('/collections/:identifier/logo/svg')
  @ApiOperation({ summary: 'Collection png logo', description: 'Returns collection SVG logo ', deprecated: true })
  async getTokenLogoSvg(
    @Param('identifier', ParseCollectionPipe) identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const isCollection = await this.collectionService.isCollection(identifier);
    if (!isCollection) {
      throw new NotFoundException('Collection not found');
    }

    const url = await this.collectionService.getLogoSvg(identifier);
    if (url === undefined) {
      throw new NotFoundException('Assets not found');
    }

    response.redirect(url);
  }
}
