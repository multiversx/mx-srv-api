import { NftSupply } from './entities/nft.supply';
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, NotFoundException, Param, Query, Res, Response } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NftMediaService } from "src/queue.worker/nft.worker/queue/job-services/media/nft.media.service";
import { Nft } from "./entities/nft";
import { NftFilter } from "./entities/nft.filter";
import { NftOwner } from "./entities/nft.owner";
import { NftType } from "./entities/nft.type";
import { NftService } from "./nft.service";
import { QueryPagination } from 'src/common/entities/query.pagination';
import { NftQueryOptions } from './entities/nft.query.options';
import { ParseAddressPipe, ParseBoolPipe, ParseArrayPipe, ParseIntPipe, ParseNftPipe, ParseCollectionPipe, ApplyComplexity, ParseAddressArrayPipe, ParseBlockHashPipe, ParseEnumPipe, ParseRecordPipe, ParseNftArrayPipe, ParseCollectionArrayPipe, ParseEnumArrayPipe } from '@multiversx/sdk-nestjs-common';
import { TransactionDetailed } from '../transactions/entities/transaction.detailed';
import { TransactionStatus } from '../transactions/entities/transaction.status';
import { SortOrder } from 'src/common/entities/sort.order';
import { TransactionQueryOptions } from '../transactions/entities/transactions.query.options';
import { TransactionService } from '../transactions/transaction.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { Transaction } from '../transactions/entities/transaction';
import { ScamType } from 'src/common/entities/scam-type.enum';
import { TransferService } from '../transfers/transfer.service';
import { NftSubType } from './entities/nft.sub.type';

@Controller()
@ApiTags('nfts')
export class NftController {
  constructor(
    private readonly nftService: NftService,
    private readonly nftMediaService: NftMediaService,
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService,
  ) { }

  @Get("/nfts")
  @ApiOperation({ summary: 'Global NFTs', description: 'Returns a list of Non-Fungible / Semi-Fungible / MetaESDT tokens available on blockchain' })
  @ApiOkResponse({ type: [Nft] })
  @ApplyComplexity({ target: Nft })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT)', required: false })
  @ApiQuery({ name: 'subType', description: 'Filter by subType', required: false })
  @ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
  @ApiQuery({ name: 'collections', description: 'Get all tokens by token collections, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'isNsfw', description: 'Filter by NSFW status', required: false, type: Boolean })
  @ApiQuery({ name: 'isScam', description: 'Filter by scam status', required: false, type: Boolean })
  @ApiQuery({ name: 'scamType', description: 'Filter by type (scam/potentialScam)', required: false })
  @ApiQuery({ name: 'traits', description: 'Filter NFTs by traits. Key-value format (<key1>:<value1>;<key2>:<value2>)', required: false, type: Boolean })
  @ApiQuery({ name: 'before', description: 'Return all NFTs before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all NFTs after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'withOwner', description: 'Return owner where type = NonFungibleESDT', required: false, type: Boolean })
  @ApiQuery({ name: 'withSupply', description: 'Return supply where type = SemiFungibleESDT', required: false, type: Boolean })
  async getNfts(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('identifiers', ParseNftArrayPipe) identifiers?: string[],
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('subType', new ParseEnumArrayPipe(NftSubType)) subType?: NftSubType[],
    @Query('collection', ParseCollectionPipe) collection?: string,
    @Query('collections', ParseCollectionArrayPipe) collections?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', ParseBoolPipe) isNsfw?: boolean,
    @Query('isScam', ParseBoolPipe) isScam?: boolean,
    @Query('scamType', new ParseEnumPipe(ScamType)) scamType?: ScamType,
    @Query('traits', ParseRecordPipe) traits?: Record<string, string>,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('withOwner', ParseBoolPipe) withOwner?: boolean,
    @Query('withSupply', ParseBoolPipe) withSupply?: boolean,
  ): Promise<Nft[]> {
    return await this.nftService.getNfts(
      new QueryPagination({ from, size }),
      new NftFilter({
        search,
        identifiers,
        type,
        subType,
        collection,
        collections,
        name,
        tags,
        creator,
        hasUris,
        isWhitelistedStorage,
        isNsfw,
        isScam,
        scamType,
        traits,
        before,
        after,
      }),
      new NftQueryOptions({ withOwner, withSupply }),
    );
  }

  @Get("/nfts/count")
  @ApiOperation({ summary: 'Global NFT count', description: 'Returns the total number of Non-Fungible / Semi-Fungible / MetaESDT tokens' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by type (NonFungibleESDT/SemiFungibleESDT/MetaESDT)', required: false })
  @ApiQuery({ name: 'subType', description: 'Filter by subType', required: false })
  @ApiQuery({ name: 'collection', description: 'Get all tokens by token collection', required: false })
  @ApiQuery({ name: 'collections', description: 'Get all tokens by token collections, comma-separated', required: false })
  @ApiQuery({ name: 'name', description: 'Get all nfts by name', required: false })
  @ApiQuery({ name: 'tags', description: 'Filter by one or more comma-separated tags', required: false })
  @ApiQuery({ name: 'creator', description: 'Return all NFTs associated with a given creator', required: false })
  @ApiQuery({ name: 'isWhitelistedStorage', description: 'Return all NFTs that are whitelisted in storage', required: false, type: Boolean })
  @ApiQuery({ name: 'hasUris', description: 'Return all NFTs that have one or more uris', required: false, type: Boolean })
  @ApiQuery({ name: 'isNsfw', description: 'Filter by NSFW status', required: false, type: Boolean })
  @ApiQuery({ name: 'traits', description: 'Filter NFTs by traits. Key-value format (<key1>:<value1>;<key2>:<value2>)', required: false, type: Boolean })
  @ApiQuery({ name: 'before', description: 'Return all NFTs before given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'after', description: 'Return all NFTs after given timestamp', required: false, type: Number })
  @ApiQuery({ name: 'isScam', description: 'Filter by scam status', required: false, type: Boolean })
  @ApiQuery({ name: 'scamType', description: 'Filter by type (scam/potentialScam)', required: false })
  async getNftCount(
    @Query('search') search?: string,
    @Query('identifiers', ParseNftArrayPipe) identifiers?: string[],
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('subType', new ParseEnumArrayPipe(NftSubType)) subType?: NftSubType[],
    @Query('collection', ParseCollectionPipe) collection?: string,
    @Query('collections', ParseCollectionArrayPipe) collections?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', ParseBoolPipe) isNsfw?: boolean,
    @Query('traits', ParseRecordPipe) traits?: Record<string, string>,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('isScam', ParseBoolPipe) isScam?: boolean,
    @Query('scamType', new ParseEnumPipe(ScamType)) scamType?: ScamType,
  ): Promise<number> {
    return await this.nftService.getNftCount(
      new NftFilter({
        search,
        identifiers,
        type,
        subType,
        collection,
        collections,
        name,
        tags,
        creator,
        isWhitelistedStorage,
        hasUris,
        isNsfw,
        traits,
        before,
        after,
        isScam,
        scamType,
      }));
  }

  @Get("/nfts/c")
  @ApiExcludeEndpoint()
  async getNftCountAlternative(
    @Query('search') search?: string,
    @Query('identifiers', ParseNftArrayPipe) identifiers?: string[],
    @Query('type', new ParseEnumArrayPipe(NftType)) type?: NftType[],
    @Query('subType', new ParseEnumArrayPipe(NftSubType)) subType?: NftSubType[],
    @Query('collection', ParseCollectionPipe) collection?: string,
    @Query('collections', ParseCollectionArrayPipe) collections?: string[],
    @Query('name') name?: string,
    @Query('tags', ParseArrayPipe) tags?: string[],
    @Query('creator', ParseAddressPipe) creator?: string,
    @Query('isWhitelistedStorage', ParseBoolPipe) isWhitelistedStorage?: boolean,
    @Query('hasUris', ParseBoolPipe) hasUris?: boolean,
    @Query('isNsfw', ParseBoolPipe) isNsfw?: boolean,
    @Query('traits', ParseRecordPipe) traits?: Record<string, string>,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('isScam', ParseBoolPipe) isScam?: boolean,
    @Query('scamType', new ParseEnumPipe(ScamType)) scamType?: ScamType,
  ): Promise<number> {
    return await this.nftService.getNftCount(new NftFilter({ search, identifiers, type, subType, collection, collections, name, tags, creator, isWhitelistedStorage, hasUris, isNsfw, traits, before, after, isScam, scamType }));
  }

  @Get('/nfts/:identifier')
  @ApiOperation({ summary: 'NFT details', description: 'Returns the details of an Non-Fungible / Semi-Fungible / MetaESDT token for a given identifier' })
  @ApiOkResponse({ type: Nft })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getNft(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<Nft> {
    const token = await this.nftService.getSingleNft(identifier);
    if (token === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  @Get('/nfts/:identifier/thumbnail')
  @ApiOperation({ summary: 'NFT thumbnail', description: 'Returns nft thumbnail' })
  @ApiOkResponse({ type: Nft })
  @ApiNotFoundResponse({ description: 'NFT thumbnail not found' })
  async resolveNftThumbnail(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Res() response: Response
  ) {
    const nfts = await this.nftService.getNftsInternal(new QueryPagination({ from: 0, size: 1 }), new NftFilter(), identifier);
    if (nfts.length === 0) {
      throw new NotFoundException('NFT not found');
    }

    const media = await this.nftMediaService.getMedia(nfts[0].identifier);
    if (!media || media.length === 0) {
      // @ts-ignore
      response.redirect(this.nftService.DEFAULT_MEDIA[0].thumbnailUrl);
    } else {
      // @ts-ignore
      response.redirect(media[0].thumbnailUrl);
    }
  }

  @Get('/nfts/:identifier/supply')
  @ApiOperation({ summary: 'NFT supply', description: 'Returns Non-Fungible / Semi-Fungible / MetaESDT token supply details' })
  @ApiOkResponse({ type: NftSupply })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getNftSupply(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<{ supply: string; }> {
    const totalSupply = await this.nftService.getNftSupply(identifier);
    if (!totalSupply) {
      throw new NotFoundException();
    }

    return { supply: totalSupply };
  }

  @Get('/nfts/:identifier/accounts')
  @ApiOperation({ summary: 'NFT accounts', description: 'Returns a list of addresses that hold balances for a specific Non-Fungible / Semi-Fungible / MetaESDT token' })
  @ApiOkResponse({ type: [NftOwner] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getNftAccounts(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<NftOwner[]> {
    const owners = await this.nftService.getNftOwners(identifier, new QueryPagination({ from, size }));
    if (owners === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }

    return owners;
  }

  @Get('/nfts/:identifier/accounts/count')
  @ApiOperation({ summary: 'NFT accounts count', description: 'Returns number of addresses that hold balances for a specific Non-Fungible / Semi-Fungible / MetaESDT token' })
  @ApiOkResponse({ type: Number })
  async getNftAccountsCount(
    @Param('identifier', ParseNftPipe) identifier: string
  ): Promise<number> {
    const ownersCount = await this.nftService.getNftOwnersCount(identifier);
    if (ownersCount === undefined) {
      throw new HttpException('NFT not found', HttpStatus.NOT_FOUND);
    }
    return ownersCount;
  }

  @Get("/nfts/:identifier/transactions")
  @ApiOperation({ summary: 'NFT transactions', description: `Returns a list of transactions for a NonFungibleESDT or SemiFungibleESDT.` })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiNotFoundResponse({ description: 'Token not found' })
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
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  async getNftTransactions(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', ParseArrayPipe) functions?: string[],
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,

    @Query('withScResults', ParseBoolPipe) withScResults?: boolean,
    @Query('withOperations', ParseBoolPipe) withOperations?: boolean,
    @Query('withLogs', ParseBoolPipe) withLogs?: boolean,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ) {
    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScResults, withOperations, withLogs, withScamInfo, withUsername });

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
      withRelayedScresults,
    });
    TransactionFilter.validate(transactionFilter, size);

    return await this.transactionService.getTransactions(transactionFilter, new QueryPagination({ from, size }), options);
  }

  @Get("/nfts/:identifier/transactions/count")
  @ApiOperation({ summary: 'NFT transactions count', description: 'Returns the total number of transactions for a specific NonFungibleESDT or SemiFungibleESDT' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  async getNftTransactionsCount(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ) {

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
      withRelayedScresults,
    }));
  }

  @Get("/nfts/:identifier/transfers")
  @ApiOperation({ summary: 'NFT transfers', description: `Returns a list of transfers for a NonFungibleESDT or SemiFungibleESDT.` })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiNotFoundResponse({ description: 'Token not found' })
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
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transfers', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transfers', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transfers', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transfers', required: false, type: Boolean })
  async getNftTransfers(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', ParseArrayPipe) functions?: string[],
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withScResults', ParseBoolPipe) withScResults?: boolean,
    @Query('withOperations', ParseBoolPipe) withOperations?: boolean,
    @Query('withLogs', ParseBoolPipe) withLogs?: boolean,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
  ) {
    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScResults, withOperations, withLogs, withScamInfo, withUsername });

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
    }), new QueryPagination({ from, size }), options);
  }

  @Get("/nfts/:identifier/transfers/count")
  @ApiOperation({ summary: 'NFT transfers count', description: 'Returns the total number of transfers for a specific NonFungibleESDT or SemiFungibleESDT' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'sender', description: 'Address of the transfers sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfers hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transfers (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  async getNftTransfersCount(
    @Param('identifier', ParseNftPipe) identifier: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
  ) {

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
    }));
  }
}
