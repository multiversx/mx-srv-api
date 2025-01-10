import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, Res, UseInterceptors } from "@nestjs/common";
import { ApiExcludeController, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VmQueryRequest } from "../vm.query/entities/vm.query.request";
import { VmQueryService } from "../vm.query/vm.query.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { Response, Request } from "express";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { PluginService } from "src/common/plugins/plugin.service";
import { Constants, ParseAddressPipe, ParseBlockHashPipe, ParseBlsHashPipe, ParseIntPipe, ParseTransactionHashPipe, ParseBoolPipe } from "@multiversx/sdk-nestjs-common";
import { CacheService, NoCache } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { DeepHistoryInterceptor } from "src/interceptors/deep-history.interceptor";
import { DisableFieldsInterceptorOnController } from "@multiversx/sdk-nestjs-http";

@Controller()
@ApiTags('proxy')
@ApiExcludeController()
@DisableFieldsInterceptorOnController()
export class GatewayProxyController {
  private readonly logger = new OriginLogger(GatewayProxyController.name);

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CacheService,
    private readonly pluginService: PluginService,
  ) { }

  @Get('/address/:address')
  async getAddress(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}`, GatewayComponentRequest.addressDetails);
  }

  @Get('/address/:address/balance')
  async getAddressBalance(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/balance`, GatewayComponentRequest.addressBalance);
  }

  @Get('/address/:address/nonce')
  async getAddressNonce(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/nonce`, GatewayComponentRequest.addressNonce);
  }

  @Get('/address/:address/shard')
  async getAddressShard(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/shard`, GatewayComponentRequest.addressShard);
  }

  @Get('/address/:address/keys')
  async getAddressKeys(@Param('address', ParseAddressPipe) address: string) {
    try {
      return await this.gatewayGet(`address/${address}/keys`, GatewayComponentRequest.addressKeys);
    } catch (error: any) {
      this.logger.error(`Error fetching address keys for address ${address}: ${error.message}`);
      throw new BadRequestException(error.response?.data || 'An error occurred while fetching address keys');
    }
  }

  @Get('/address/:address/key/:key')
  async getAddressStorageKey(@Param('address', ParseAddressPipe) address: string, @Param('key') key: string) {
    // eslint-disable-next-line require-await
    return await this.gatewayGet(`address/${address}/key/${key}`, GatewayComponentRequest.addressStorage, undefined, async (error) => {
      if (error?.response?.data?.error?.includes('get value for key error')) {
        throw error;
      }

      return false;
    });
  }

  @Get('/address/:address/transactions')
  async getAddressTransactions(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/transactions`, GatewayComponentRequest.addressTransactions);
  }

  @Get('/address/:address/guardian-data')
  async getAddressGuardianData(@Param('address', ParseAddressPipe) address: string) {
    return await this.gatewayGet(`address/${address}/guardian-data`, GatewayComponentRequest.guardianData);
  }

  @Get('/address/:address/esdt')
  async getAddressEsdt(@Param('address', ParseAddressPipe) address: string) {
    // eslint-disable-next-line require-await
    return await this.gatewayGet(`address/${address}/esdt`, GatewayComponentRequest.addressDetails, undefined, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('account was not found')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/transaction/send')
  async transactionSend(@Body() body: any) {
    if (!body.sender) {
      throw new BadRequestException('Sender must be provided');
    }

    if (!body.receiver) {
      throw new BadRequestException('Receiver must be provided');
    }

    const pluginTransaction = await this.pluginService.processTransactionSend(body);
    if (pluginTransaction) {
      return pluginTransaction;
    }

    // eslint-disable-next-line require-await
    return await this.gatewayPost('transaction/send', GatewayComponentRequest.sendTransaction, body, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('transaction generation failed')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/transaction/simulate')
  async transactionSimulate(@Query('checkSignature', ParseBoolPipe) checkSignature: boolean, @Body() body: any) {
    let url = 'transaction/simulate';
    if (checkSignature !== undefined) {
      url += `?checkSignature=${checkSignature}`;
    }
    return await this.gatewayPost(url, GatewayComponentRequest.simulateTransaction, body);
  }

  @Post('/transaction/send-multiple')
  async transactionSendMultiple(@Body() body: any) {
    return await this.gatewayPost('transaction/send-multiple', GatewayComponentRequest.sendTransactionMultiple, body);
  }

  @Post('/transaction/send-user-funds')
  async transactionSendUserFunds(@Body() body: any) {
    return await this.gatewayPost('transaction/send-user-funds', GatewayComponentRequest.sendUserFunds, body);
  }

  @Post('/transaction/cost')
  async transactionCost(@Body() body: any) {
    return await this.gatewayPost('transaction/cost', GatewayComponentRequest.transactionCost, body);
  }

  @Get('/transaction/pool')
  @NoCache()
  async getTransactionPool(@Req() request: Request) {
    const url = request.url.replace(/^\//, '');
    return await this.gatewayGet(url, GatewayComponentRequest.transactionPool);
  }

  @Get('/transaction/:hash')
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  @ApiQuery({ name: 'withResults', description: 'Include results which correspond to the hash', required: false })
  async getTransaction(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender?: string,
    @Query('withResults') withResults?: string,
  ) {
    return await this.gatewayGet(`transaction/${hash}`, GatewayComponentRequest.transactionDetails, { sender, withResults });
  }

  @Get('/transaction/:hash/process-status')
  async getTransactionProcessStatus(
    @Param('hash', ParseTransactionHashPipe) hash: string,
  ) {
    return await this.gatewayGet(`transaction/${hash}/process-status`, GatewayComponentRequest.transactionProcessStatus);
  }

  @Get('/transaction/:hash/status')
  @ApiQuery({ name: 'sender', description: 'Sender', required: false })
  async getTransactionStatus(
    @Param('hash', ParseTransactionHashPipe) hash: string,
    @Query('sender', ParseAddressPipe) sender: string,
  ) {
    // eslint-disable-next-line require-await
    return await this.gatewayGet(`transaction/${hash}/status`, GatewayComponentRequest.transactionDetails, { sender }, async error => {
      const message = error.response?.data?.error;
      if (message === 'transaction not found') {
        throw error;
      }

      return false;
    });
  }

  @Post('/vm-values/hex')
  async vmValuesHex(@Body() body: any) {
    // eslint-disable-next-line require-await
    return await this.gatewayPost('vm-values/hex', GatewayComponentRequest.vmQuery, body, async (error) => {
      const message = error.response?.data?.error;
      if (message && message.includes('doGetVMValue: no return data')) {
        throw error;
      }

      return false;
    });
  }

  @Post('/vm-values/string')
  async vmValuesString(@Body() body: any) {
    return await this.gatewayPost('vm-values/string', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/int')
  async vmValuesInt(@Body() body: any) {
    return await this.gatewayPost('vm-values/int', GatewayComponentRequest.vmQuery, body);
  }

  @Post('/vm-values/query')
  @ApiResponse({
    status: 201,
    description: 'Returns the result of the query (legacy)',
  })
  @UseInterceptors(DeepHistoryInterceptor)
  async queryLegacy(
    @Body() query: VmQueryRequest,
    @Query('timestamp', ParseIntPipe) timestamp: number | undefined,
  ) {
    try {
      return await this.vmQueryService.vmQueryFullResult(query.scAddress, query.funcName, query.caller, query.args, query.value, timestamp);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/network/status/:shard')
  async getNetworkStatusShard(@Param('shard') shard: string) {
    return await this.gatewayGet(`network/status/${shard}`, GatewayComponentRequest.networkStatus);
  }

  @Get('/network/config')
  async getNetworkConfig() {
    return await this.gatewayGet('network/config', GatewayComponentRequest.networkConfig);
  }

  @Get('/network/economics')
  async getNetworkEconomics() {
    return await this.gatewayGet('network/economics', GatewayComponentRequest.networkEconomics);
  }

  @Get('/network/total-staked')
  async getNetworkTotalStaked() {
    return await this.gatewayGet('network/total-staked', GatewayComponentRequest.networkTotalStaked);
  }

  @Get('/node/heartbeatstatus')
  @NoCache()
  async getNodeHeartbeatStatus(@Res() res: Response) {
    try {
      const heartbeatStatus = await this.cachingService.getOrSet(
        'heartbeatstatus',
        async () => {
          const result = await this.gatewayService.getRaw('node/heartbeatstatus', GatewayComponentRequest.nodeHeartbeat);
          return result.data;
        },
        Constants.oneMinute() * 2,
      );

      res.type('application/json').send(heartbeatStatus);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/node/waiting-epochs-left/:bls')
  async getNodeWaitingEpochsLeft(
    @Param('bls', ParseBlsHashPipe) bls: string,
  ) {
    return await this.gatewayGet(`node/waiting-epochs-left/${bls}`, GatewayComponentRequest.getNodeWaitingEpochsLeft);
  }

  @Get('/validator/statistics')
  @NoCache()
  async getValidatorStatistics(@Res() res: Response) {
    try {
      const validatorStatistics = await this.cachingService.getOrSet(
        'validatorstatistics',
        async () => {
          const result = await this.gatewayService.getRaw('validator/statistics', GatewayComponentRequest.validatorStatistics);
          return result.data;
        },
        Constants.oneMinute() * 2,
      );

      res.type('application/json').send(validatorStatistics);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/validator/auction')
  @NoCache()
  async getValidatorAuction(@Res() res: Response) {
    try {
      const result = await this.gatewayService.getRaw('validator/auction', GatewayComponentRequest.validatorAuction);

      res.type('application/json').send(result.data);
    } catch (error: any) {
      throw new BadRequestException(error.response.data);
    }
  }

  @Get('/block/:shard/by-nonce/:nonce')
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndNonce(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
    @Query('withTxs') withTxs?: string,
  ) {
    return await this.gatewayGet(`block/${shard}/by-nonce/${nonce}`, GatewayComponentRequest.blockByNonce, { withTxs });
  }

  @Get('/block/:shard/by-hash/:hash')
  @ApiQuery({ name: 'withTxs', description: 'Include transactions', required: false })
  async getBlockByShardAndHash(
    @Param('shard') shard: string,
    @Param('hash') hash: number,
    @Query('withTxs') withTxs?: string,
  ) {
    return await this.gatewayGet(`block/${shard}/by-hash/${hash}`, GatewayComponentRequest.blockByHash, { withTxs });
  }

  @Get('/block-atlas/:shard/:nonce')
  async getBlockAtlas(
    @Param('shard') shard: string,
    @Param('nonce') nonce: number,
  ) {
    return await this.gatewayGet(`block-atlas/${shard}/${nonce}`, GatewayComponentRequest.blockAtlas);
  }

  @Get('/hyperblock/by-nonce/:nonce')
  async getHyperblockByNonce(@Param('nonce') nonce: number) {
    try {
      return await this.cachingService.getOrSet(
        `hyperblock/by-nonce/${nonce}`,
        // eslint-disable-next-line require-await
        async () => await this.gatewayGet(`hyperblock/by-nonce/${nonce}`, GatewayComponentRequest.hyperblockByNonce, undefined, async error => {
          const message = error.response?.data?.error;
          if (message === 'sending request error') {
            throw error;
          }

          return false;
        }),
        Constants.oneHour(),
      );
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get('/hyperblock/by-hash/:hash')
  async getHyperblockByHash(@Param('hash', ParseBlockHashPipe) hash: number) {
    return await this.gatewayGet(`hyperblock/by-hash/${hash}`, GatewayComponentRequest.hyperblockByHash);
  }

  @Get('/network/gas-configs')
  async getGasConfigs() {
    return await this.gatewayGet('network/gas-configs', GatewayComponentRequest.gasConfigs);
  }

  private async gatewayGet(url: string, component: GatewayComponentRequest, params: any = undefined, errorHandler?: (error: any) => Promise<boolean>) {
    if (params) {
      url += '?' + Object.keys(params).filter(key => params[key] !== undefined).map(key => `${key}=${params[key]}`).join('&');
    }

    try {
      const result = await this.gatewayService.getRaw(url, component, errorHandler);
      return result.data;
    } catch (error: any) {
      if (error.response) {
        if (error.response.data) {
          throw new BadRequestException(error.response.data);
        }

        throw new BadRequestException(error.response);
      }

      this.logger.error(`Unhandled exception when calling gateway url '${url}'`);
      throw new BadRequestException(`Unhandled exception when calling gateway url '${url}'`);
    }
  }

  private async gatewayPost(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>) {
    try {
      const result = await this.gatewayService.createRaw(url, component, data, errorHandler);
      return result.data;
    } catch (error: any) {
      if (error.response) {
        if (error.response.data) {
          throw new BadRequestException(error.response.data);
        }

        throw new BadRequestException(error.response);
      }

      this.logger.error(`Unhandled exception when calling gateway url '${url}'`);
      throw new BadRequestException(`Unhandled exception when calling gateway url '${url}'`);
    }
  }

  private async forwardGateway(url: string, component: GatewayComponentRequest, params?: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.gatewayGet(url, component, params, errorHandler);
  }

  @Get('/gateway/*')
  async forwardRequest(@Req() request: Request) {
    const url = request.url.startsWith('/') ? request.url.substring(1) : request.url;
    const queryParams = request.query;
    return await this.forwardGateway(
      url.replace('gateway/', ''),
      GatewayComponentRequest.forward,
      queryParams
    );
  }
}
