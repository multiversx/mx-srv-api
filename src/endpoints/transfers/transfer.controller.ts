import { ParseBlockHashPipe, ParseEnumPipe, ParseIntPipe, ParseArrayPipe, ParseAddressArrayPipe, ParseBoolPipe, ApplyComplexity, ParseAddressPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionDetailed } from "../transactions/entities/transaction.detailed";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionStatus } from "../transactions/entities/transaction.status";
import { TransactionQueryOptions } from "../transactions/entities/transactions.query.options";
import { TransferService } from "./transfer.service";
import { ParseArrayPipeOptions } from "@multiversx/sdk-nestjs-common/lib/pipes/entities/parse.array.options";

@Controller()
@ApiTags('transfers')
export class TransferController {
  constructor(
    private readonly transferService: TransferService,
  ) { }

  @Get("/transfers")
  @ApiOperation({ summary: 'Value transfers', description: 'Returns both transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account' })
  @ApplyComplexity({ target: TransactionDetailed })
  @ApiOkResponse({ type: [Transaction] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sender', description: 'Search by multiple sender addresses, comma-separated', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'order', description: 'Sort order (asc/desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'fields', description: 'List of fields to filter by', required: false, isArray: true, style: 'form', explode: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Round number', required: false })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'relayer', description: 'Filter by relayer address', required: false })
  @ApiQuery({ name: 'isRelayed', description: 'Returns relayed transactions details', required: false, type: Boolean })
  @ApiQuery({ name: 'withScamInfo', description: 'Returns scam information', required: false, type: Boolean })
  @ApiQuery({ name: 'withUsername', description: 'Integrates username in assets for all addresses present in the transactions', required: false, type: Boolean })
  @ApiQuery({ name: 'withBlockInfo', description: 'Returns sender / receiver block details', required: false, type: Boolean })
  @ApiQuery({ name: 'withLogs', description: 'Return logs for transfers. When "withLogs" parameter is applied, complexity estimation is 200', required: false })
  @ApiQuery({ name: 'withOperations', description: 'Return operations for transfers. When "withOperations" parameter is applied, complexity estimation is 200', required: false })
  @ApiQuery({ name: 'withActionTransferValue', description: 'Returns value in USD and EGLD for transferred tokens within the action attribute', required: false })
  @ApiQuery({ name: 'withRefunds', description: 'Include refund transactions', required: false })
  async getAccountTransfers(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('sender', ParseAddressArrayPipe) sender?: string[],
    @Query('token') token?: string,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('fields', ParseArrayPipe) fields?: string[],
    @Query('relayer', ParseAddressPipe) relayer?: string,
    @Query('isRelayed', ParseBoolPipe) isRelayed?: boolean,
    @Query('withScamInfo', ParseBoolPipe) withScamInfo?: boolean,
    @Query('withUsername', ParseBoolPipe) withUsername?: boolean,
    @Query('withBlockInfo', ParseBoolPipe) withBlockInfo?: boolean,
    @Query('withLogs', ParseBoolPipe) withLogs?: boolean,
    @Query('withOperations', ParseBoolPipe) withOperations?: boolean,
    @Query('withActionTransferValue', ParseBoolPipe) withActionTransferValue?: boolean,
    @Query('withRefunds', ParseBoolPipe) withRefunds?: boolean,
  ): Promise<Transaction[]> {
    const options = TransactionQueryOptions.applyDefaultOptions(
      size, new TransactionQueryOptions({ withScamInfo, withUsername, withBlockInfo, withLogs, withOperations, withActionTransferValue }),
    );

    return await this.transferService.getTransfers(new TransactionFilter({
      senders: sender,
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
      order,
      relayer,
      isRelayed,
      round,
      withRefunds,
    }),
      new QueryPagination({ from, size }),
      options,
      fields
    );
  }

  @Get("/transfers/count")
  @ApiOperation({ summary: 'Account transfer count', description: 'Return total count of tranfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult)' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'sender', description: 'Search by multiple sender addresses, comma-separated', required: false })
  @ApiQuery({ name: 'receiver', description: 'Search by multiple receiver addresses, comma-separated', required: false })
  @ApiQuery({ name: 'token', description: 'Identifier of the token', required: false })
  @ApiQuery({ name: 'senderShard', description: 'Id of the shard the sender address belongs to', required: false })
  @ApiQuery({ name: 'receiverShard', description: 'Id of the shard the receiver address belongs to', required: false })
  @ApiQuery({ name: 'miniBlockHash', description: 'Filter by miniblock hash', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of transfer hashes', required: false })
  @ApiQuery({ name: 'status', description: 'Status of the transaction (success / pending / invalid / fail)', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'function', description: 'Filter transfers by function name', required: false })
  @ApiQuery({ name: 'before', description: 'Before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'After timestamp', required: false })
  @ApiQuery({ name: 'round', description: 'Round number', required: false })
  @ApiQuery({ name: 'isRelayed', description: 'Returns relayed transactions details', required: false, type: Boolean })
  @ApiQuery({ name: 'withRefunds', description: 'Include refund transactions', required: false })
  async getAccountTransfersCount(
    @Query('sender', ParseAddressArrayPipe) sender?: string[],
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('token') token?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('isRelayed', ParseBoolPipe) isRelayed?: boolean,
    @Query('withRefunds', ParseBoolPipe) withRefunds?: boolean,
  ): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({
      senders: sender,
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
      isRelayed,
      round,
      withRefunds,
    }));
  }

  @Get("/transfers/c")
  @ApiExcludeEndpoint()
  async getAccountTransfersCountAlternative(
    @Query('sender', ParseAddressArrayPipe) sender?: string[],
    @Query('receiver', ParseAddressArrayPipe) receiver?: string[],
    @Query('token') token?: string,
    @Query('senderShard', ParseIntPipe) senderShard?: number,
    @Query('receiverShard', ParseIntPipe) receiverShard?: number,
    @Query('miniBlockHash', ParseBlockHashPipe) miniBlockHash?: string,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('status', new ParseEnumPipe(TransactionStatus)) status?: TransactionStatus,
    @Query('function', new ParseArrayPipe(new ParseArrayPipeOptions({ allowEmptyString: true }))) functions?: string[],
    @Query('before', ParseIntPipe) before?: number,
    @Query('after', ParseIntPipe) after?: number,
    @Query('round', ParseIntPipe) round?: number,
    @Query('withRefunds', ParseBoolPipe) withRefunds?: boolean,
  ): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({
      senders: sender,
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
      round,
      withRefunds,
    }));
  }
}
