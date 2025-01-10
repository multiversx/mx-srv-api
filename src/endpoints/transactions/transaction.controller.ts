import { QueryConditionOptions } from '@multiversx/sdk-nestjs-elastic';
import { ParseBlockHashPipe, ParseBoolPipe, ParseEnumPipe, ParseIntPipe, ParseTransactionHashPipe, ParseAddressAndMetachainPipe, ApplyComplexity, ParseAddressArrayPipe, ParseArrayPipe, ParseAddressPipe } from '@multiversx/sdk-nestjs-common';
import { BadRequestException, Body, Controller, DefaultValuePipe, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { SortOrder } from 'src/common/entities/sort.order';
import { TransactionDecodeDto } from './entities/dtos/transaction.decode.dto';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionSendResult } from './entities/transaction.send.result';
import { TransactionStatus } from './entities/transaction.status';
import { TransactionQueryOptions } from './entities/transactions.query.options';
import { TransactionService } from './transaction.service';
import { ParseArrayPipeOptions } from '@multiversx/sdk-nestjs-common/lib/pipes/entities/parse.array.options';

@Controller()
@ApiTags('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Get("/transactions")
  @ApiOperation({ summary: 'Transaction list', description: 'Returns a list of transactions available on the blockchain.' })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Round number', required: false })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'fields', description: 'List of fields to filter by', required: false, isArray: true, style: 'form', explode: false })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'condition', description: 'Condition for elastic search queries', required: false, deprecated: true })
  @ApiQuery({ name: 'withScResults', description: 'Return results for transactions. When "withScResults" parameter is applied, complexity estimation is 200', required: false, type: Boolean })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transactions. When "withOperations" parameter is applied, complexity estimation is 200', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transactions. When "withLogs" parameter is applied, complexity estimation is 200', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withBlockInfo', description: 'Returns sender / receiver block details', required: false, type: Boolean })
  @ApiQuery({ name: 'relayer', description: 'Search by a relayer address', required: false })
  @ApiQuery({ name: 'isRelayed', description: 'Returns relayed transactions details', required: false, type: Boolean })
  @ApiQuery({ name: 'withActionTransferValue', description: 'Returns value in USD and EGLD for transferred tokens within the action attribute', required: false })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  getTransactions(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('sender', ParseAddressAndMetachainPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('relayer', ParseAddressPipe) relayer?: string,
    @Query('token') token?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('condition') condition?: QueryConditionOptions,
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
    @Query('isRelayed', ParseBoolPipe) isRelayed?: boolean,
    @Query('withActionTransferValue', ParseBoolPipe) withActionTransferValue?: boolean,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ) {
    const options = TransactionQueryOptions.applyDefaultOptions(size, { withScResults, withOperations, withLogs, withScamInfo, withUsername, withBlockInfo, withActionTransferValue });

    const transactionFilter = new TransactionFilter({
      sender,
      receivers: receiver,
      token,
      functions,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      before,
      after,
      condition,
      order,
      relayer,
      isRelayed,
      round,
      withRelayedScresults: withRelayedScresults,
    });
    TransactionFilter.validate(transactionFilter, size);
    return this.transactionService.getTransactions(transactionFilter,
      new QueryPagination({ from, size }),
      options,
      undefined,
      fields,
    );
  }

  @Get("/transactions/count")
  @ApiOperation({ summary: "Transactions count", description: 'Returns the total number of transactions' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'sender', description: 'Address of the transaction sender', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transaction hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'condition', description: 'Condition for elastic search queries', required: false, deprecated: true })
  @ApiQuery({ name: 'function', description: 'Filter transactions by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Round number', required: false })
  @ApiQuery({ name: 'isRelayed', description: 'Returns relayed transactions details', required: false, type: Boolean })
  @ApiQuery({ name: 'relayer', description: 'Filter by a relayer address', required: false })
  @ApiQuery({ name: 'withRelayedScresults', description: 'If set to true, will include smart contract results that resemble relayed transactions', required: false, type: Boolean })
  getTransactionCount(
    @Query('sender', ParseAddressAndMetachainPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('token') token?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('condition') condition?: QueryConditionOptions,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('relayer', ParseAddressPipe) relayer?: string,
    @Query('isRelayed', ParseBoolPipe) isRelayed?: boolean,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ): Promise<number> {
    return this.transactionService.getTransactionCount(new TransactionFilter({
      sender,
      receivers: receiver,
      token,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      functions,
      before,
      after,
      condition,
      relayer,
      isRelayed,
      round,
      withRelayedScresults: withRelayedScresults,
    }));
  }

  @Get("/transactions/c")
  @ApiExcludeEndpoint()
  getTransactionCountAlternative(
    @Query('sender', ParseAddressAndMetachainPipe) sender?: string,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('token') token?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('condition') condition?: QueryConditionOptions,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('relayer', ParseAddressPipe) relayer?: string,
    @Query('isRelayed', ParseBoolPipe) isRelayed?: boolean,
    @Query('withRelayedScresults', ParseBoolPipe) withRelayedScresults?: boolean,
  ): Promise<number> {
    return this.transactionService.getTransactionCount(new TransactionFilter({
      sender,
      receivers: receiver,
      token,
      senderShard,
      receiverShard,
      miniBlockHash,
      hashes,
      status,
      functions,
      before,
      after,
      condition,
      isRelayed,
      relayer,
      round,
      withRelayedScresults: withRelayedScresults,
    }));
  }

  @Get('/transactions/:txHash')
  @ApiOperation({ summary: 'Transaction details', description: 'Return transaction details for a given transaction hash' })
  @ApiOkResponse({ type: TransactionDetailed })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiQuery({ name: 'fields', description: 'List of fields to filter by', required: false, isArray: true, style: 'form', explode: false })
  @ApiQuery({ name: 'withActionTransferValue', description: 'Returns value in USD and EGLD for transferred tokens within the action attribute', required: false })
  async getTransaction(
    @Param('txHash', ParseTransactionHashPipe) txHash: string,
    @Query('fields', ParseArrayPipe) fields?: string[],
    @Query('withActionTransferValue', ParseBoolPipe) withActionTransferValue?: boolean,
  ): Promise<TransactionDetailed> {
    const transaction = await this.transactionService.getTransaction(txHash, fields, withActionTransferValue);

    if (transaction === null) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  @Post('/transactions')
  @ApiOperation({ summary: 'Send transaction', description: 'Posts a signed transaction on the blockchain' })
  @ApiCreatedResponse({ type: TransactionSendResult })
  async createTransaction(@Body() transaction: TransactionCreate): Promise<TransactionSendResult> {
    if (!transaction.sender) {
      throw new BadRequestException('Sender must be provided');
    }

    if (!transaction.receiver) {
      throw new BadRequestException('Receiver must be provided');
    }

    if (!transaction.signature) {
      throw new BadRequestException('Signature must be provided');
    }

    const result = await this.transactionService.createTransaction(transaction);

    if (typeof result === 'string' || result instanceof String) {
      throw new BadRequestException(result);
    }

    return result;
  }

  @Post('/transactions/decode')
  @ApiOperation({ summary: 'Decode transaction', description: 'Decodes transaction action, given a minimum set of transaction details' })
  @ApiCreatedResponse({ type: TransactionDecodeDto })
  async decodeTransaction(@Body() transaction: TransactionDecodeDto): Promise<TransactionDecodeDto> {
    if (!transaction.sender) {
      throw new BadRequestException('Sender must be provided');
    }

    if (!transaction.receiver) {
      throw new BadRequestException('Receiver must be provided');
    }

    return await this.transactionService.decodeTransaction(transaction);
  }
}
