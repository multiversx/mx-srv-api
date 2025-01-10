import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, NotFoundException, Param, Query, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { TransactionService } from "../transactions/transaction.service";
import { TokenAccount } from "./entities/token.account";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenService } from "./token.service";
import { TokenRoles } from "./entities/token.roles";
import { EsdtSupply } from "../esdt/entities/esdt.supply";
import { Transaction } from "../transactions/entities/transaction";
import { TokenSupplyResult } from "./entities/token.supply.result";
import { TokenSort } from "./entities/token.sort";
import { SortTokens } from "src/common/entities/sort.tokens";
import { TransferService } from "../transfers/transfer.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "./entities/token.filter";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionQueryOptions } from "../transactions/entities/transactions.query.options";
import { ParseAddressPipe, ParseBlockHashPipe, ParseBoolPipe, ParseEnumPipe, ParseIntPipe, ParseArrayPipe, ParseTokenPipe, ParseAddressArrayPipe, ApplyComplexity, ParseEnumArrayPipe } from "@multiversx/sdk-nestjs-common";
import { TransactionDetailed } from "../transactions/entities/transaction.detailed";
import { Response } from "express";
import { TokenType } from "src/common/indexer/entities";
import { ParseArrayPipeOptions } from "@multiversx/sdk-nestjs-common/lib/pipes/entities/parse.array.options";
import { MexPairType } from "../mex/entities/mex.pair.type";
import { TokenAssetsPriceSourceType } from "src/common/assets/entities/token.assets.price.source.type";

@Controller()
@ApiTags('tokens')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly transactionService: TransactionService,
    private readonly transferService: TransferService,
  ) { }

  @Get("/tokens")
  @ApiOperation({ summary: 'Tokens', description: 'Returns all tokens available on the blockchain' })
  @ApiOkResponse({ type: [TokenDetailed] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'type', description: 'Token type', required: false, enum: TokenType })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: SortTokens })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'includeMetaESDT', description: 'Include MetaESDTs in response', required: false, type: Boolean })
  @ApiQuery({ name: 'mexPairType', description: 'Token Mex Pair', required: false, enum: MexPairType })
  @ApiQuery({ name: 'priceSource', description: 'Token Price Source', required: false, enum: TokenAssetsPriceSourceType })
  async getTokens(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('type', new ParseEnumPipe(TokenType)) type?: TokenType,
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('identifier', ParseTokenPipe) identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('sort', new ParseEnumPipe(TokenSort)) sort?: TokenSort,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('includeMetaESDT', ParseBoolPipe) includeMetaESDT?: boolean,
    @Query('mexPairType', new ParseEnumArrayPipe(MexPairType)) mexPairType?: MexPairType[],
    @Query('priceSource', new ParseEnumPipe(TokenAssetsPriceSourceType)) priceSource?: TokenAssetsPriceSourceType,
  ): Promise<TokenDetailed[]> {

    return await this.tokenService.getTokens(
      new QueryPagination({ from, size }),
      new TokenFilter({ type, search, name, identifier, identifiers, includeMetaESDT, sort, order, mexPairType, priceSource })
    );
  }

  @Get("/tokens/count")
  @ApiOperation({ summary: 'Tokens count', description: 'Return total number of tokens available on blockchain' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by collection identifier', required: false })
  @ApiQuery({ name: 'name', description: 'Search by token name', required: false })
  @ApiQuery({ name: 'type', description: 'Token type', required: false, enum: TokenType })
  @ApiQuery({ name: 'identifier', description: 'Search by token identifier', required: false })
  @ApiQuery({ name: 'identifiers', description: 'Search by multiple token identifiers, comma-separated', required: false })
  @ApiQuery({ name: 'includeMetaESDT', description: 'Include MetaESDTs in response', required: false, type: Boolean })
  @ApiQuery({ name: 'mexPairType', description: 'Token Mex Pair', required: false, enum: MexPairType })
  @ApiQuery({ name: 'priceSource', description: 'Token Price Source', required: false, enum: TokenAssetsPriceSourceType })
  async getTokenCount(
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('type', new ParseEnumPipe(TokenType)) type?: TokenType,
    @Query('identifier', ParseTokenPipe) identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('includeMetaESDT', ParseBoolPipe) includeMetaESDT?: boolean,
    @Query('mexPairType', new ParseEnumArrayPipe(MexPairType)) mexPairType?: MexPairType[],
    @Query('priceSource', new ParseEnumPipe(TokenAssetsPriceSourceType)) priceSource?: TokenAssetsPriceSourceType,
  ): Promise<number> {
    return await this.tokenService.getTokenCount(new TokenFilter({ type, search, name, identifier, identifiers, includeMetaESDT, mexPairType, priceSource }));
  }

  @Get("/tokens/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('type', new ParseEnumPipe(TokenType)) type?: TokenType,
    @Query('identifier', ParseTokenPipe) identifier?: string,
    @Query('identifiers', ParseArrayPipe) identifiers?: string[],
    @Query('includeMetaESDT', ParseBoolPipe) includeMetaESDT?: boolean,
    @Query('mexPairType', new ParseEnumArrayPipe(MexPairType)) mexPairType?: MexPairType[],
    @Query('priceSource', new ParseEnumPipe(TokenAssetsPriceSourceType)) priceSource?: TokenAssetsPriceSourceType,
  ): Promise<number> {
    return await this.tokenService.getTokenCount(new TokenFilter({ type, search, name, identifier, identifiers, includeMetaESDT, mexPairType, priceSource }));
  }

  @Get('/tokens/:identifier')
  @ApiOperation({ summary: 'Token', description: 'Returns token details based on a specific token identifier' })
  @ApiQuery({ name: 'denominated', description: 'Return results denominated', required: false })
  @ApiOkResponse({ type: TokenDetailed })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getToken(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('denominated', ParseBoolPipe) denominated?: boolean,
  ): Promise<TokenDetailed> {
    const supplyOptions = { denominated };
    const token = await this.tokenService.getToken(identifier, supplyOptions);
    if (token === undefined) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  @Get('/tokens/:identifier/supply')
  @ApiOperation({ summary: 'Token supply', description: 'Returns general supply information for a specific token' })
  @ApiQuery({ name: 'denominated', description: 'Return results denominated', required: false })
  @ApiOkResponse({ type: EsdtSupply })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenSupply(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('denominated', ParseBoolPipe) denominated?: boolean,
  ): Promise<TokenSupplyResult> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const getSupplyResult = await this.tokenService.getTokenSupply(identifier, { denominated });
    if (!getSupplyResult) {
      throw new NotFoundException('Token not found');
    }

    return getSupplyResult;
  }

  @Get("/tokens/:identifier/accounts")
  @ApiOperation({ summary: 'Token accounts', description: 'Returns a list of accounts that hold a specific token' })
  @ApiOkResponse({ type: [TokenAccount] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getTokenAccounts(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<TokenAccount[]> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const accounts = await this.tokenService.getTokenAccounts(new QueryPagination({ from, size }), identifier);
    if (!accounts) {
      throw new NotFoundException('Token not found');
    }

    return accounts;
  }

  @Get("/tokens/:identifier/accounts/count")
  @ApiOperation({ summary: 'Token accounts count', description: 'Returns the total number of accounts that hold a specific token' })
  @ApiOkResponse({ type: Number })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenAccountsCount(
    @Param('identifier', ParseTokenPipe) identifier: string,
  ): Promise<number> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const count = await this.tokenService.getTokenAccountsCount(identifier);
    if (count === undefined) {
      throw new NotFoundException('Token not found');
    }

    return count;
  }

  @Get("/tokens/:identifier/transactions")
  @ApiOperation({ summary: 'Token transactions', description: `Returns a list of transactions for a specific token.` })
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
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'withScResults', description: 'Return scResults for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withBlockInfo', description: 'Returns sender / receiver block details', required: false, type: Boolean })
  @ApiQuery({ name: 'withActionTransferValue', description: 'Returns value in USD and EGLD for transferred tokens within the action attribute', required: false })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  async getTokenTransactions(
    @Param('identifier', ParseTokenPipe) identifier: string,
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
    @Query('fields', ParseArrayPipe) fields?: string[],
    @Query('withScResults', ParseBoolPipe) withScResults?: boolean,
    @Query('withOperations', ParseBoolPipe) withOperations?: boolean,
    @Query('withLogs', ParseBoolPipe) withLogs?: boolean,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
    @Query('withBlockInfo', ParseBoolPipe) withBlockInfo?: boolean,
    @Query('withActionTransferValue', ParseBoolPipe) withActionTransferValue?: boolean,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ) {
    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScResults, withOperations, withLogs, withScamInfo, withUsername, withBlockInfo, withActionTransferValue });

    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
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

    return await this.transactionService.getTransactions(
      transactionFilter,
      new QueryPagination({ from, size }),
      options,
      undefined,
      fields,
    );
  }

  @Get("/tokens/:identifier/transactions/count")
  @ApiOperation({ summary: 'Token transactions count', description: 'Returns the total number of transactions for a specific token' })
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
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  async getTokenTransactionsCount(
    @Param('identifier', ParseTokenPipe) identifier: string,
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
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
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

  @Get("/tokens/:identifier/roles")
  @ApiOperation({ summary: 'Token roles', description: 'Returns a list of accounts that can perform various actions on a specific token', deprecated: true })
  @ApiOkResponse({ type: [TokenRoles] })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenRoles(
    @Param('identifier', ParseTokenPipe) identifier: string,
  ): Promise<TokenRoles[]> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new HttpException('Token not found', HttpStatus.NOT_FOUND);
    }

    const roles = await this.tokenService.getTokenRoles(identifier);
    if (!roles) {
      throw new HttpException('Token roles not found', HttpStatus.NOT_FOUND);
    }

    return roles;
  }

  @Get("/tokens/:identifier/roles/:address")
  @ApiOperation({ summary: 'Token address roles', description: 'Returns roles details for a specific address of a given token', deprecated: true })
  @ApiOkResponse({ type: TokenRoles })
  @ApiNotFoundResponse({ description: 'Token not found' })
  async getTokenRolesForAddress(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<TokenRoles> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    const roles = await this.tokenService.getTokenRolesForIdentifierAndAddress(identifier, address);
    if (!roles) {
      throw new NotFoundException('Token not found');
    }

    return roles;
  }

  @Get("/tokens/:identifier/transfers")
  @ApiOperation({ summary: 'Token value transfers', description: 'Returns both transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account' })
  @ApiOkResponse({ type: [Transaction] })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  @ApiQuery({ name: 'fields', description: 'List of fields to filter by', required: false, isArray: true, style: 'form', explode: false })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withBlockInfo', description: 'Returns sender / receiver block details', required: false, type: Boolean })
  @ApiQuery({ name: 'withActionTransferValue', description: 'Returns value in USD and EGLD for transferred tokens within the action attribute', required: false })
  async getTokenTransfers(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressArrayPipe) sender?: string[],
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
    @Query('fields', ParseArrayPipe) fields?: string[],
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
    @Query('withBlockInfo', ParseBoolPipe) withBlockInfo?: boolean,
    @Query('withActionTransferValue', ParseBoolPipe) withActionTransferValue?: boolean,
  ): Promise<Transaction[]> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScamInfo, withUsername, withBlockInfo, withActionTransferValue });

    return await this.transferService.getTransfers(new TransactionFilter({
      senders: sender,
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
    }),
      new QueryPagination({ from, size }),
      options,
      fields
    );
  }

  @Get("/tokens/:identifier/transfers/count")
  @ApiOperation({ summary: 'Account transfer count', description: 'Return total count of transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult)' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'sender', description: 'Address of the transfer sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Filter by round number', required: false })
  async getTokenTransfersCount(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('sender', ParseAddressArrayPipe) sender?: string[],
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
  ): Promise<number> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({
      senders: sender,
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
      round,
    }));
  }

  @Get("/tokens/:identifier/transfers/c")
  @ApiExcludeEndpoint()
  async getAccountTransfersCountAlternative(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Query('sender', ParseAddressArrayPipe) sender?: string[],
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
  ): Promise<number> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({
      senders: sender,
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
      round,
    }));
  }

  @Get('/tokens/:identifier/logo/png')
  async getTokenLogoPng(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    const url = await this.tokenService.getLogoPng(identifier);
    if (url === undefined) {
      throw new NotFoundException('Assets not found');
    }

    response.redirect(url);
  }

  @Get('/tokens/:identifier/logo/svg')
  async getTokenLogoSvg(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const isToken = await this.tokenService.isToken(identifier);
    if (!isToken) {
      throw new NotFoundException('Token not found');
    }

    const url = await this.tokenService.getLogoSvg(identifier);
    if (url === undefined) {
      throw new NotFoundException('Assets not found');
    }

    response.redirect(url);
  }
}
