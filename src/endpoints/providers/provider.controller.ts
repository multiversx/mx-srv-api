import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query, Res } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProviderService } from "./provider.service";
import { Provider } from "./entities/provider";
import { ParseAddressArrayPipe, ParseAddressPipe, ParseBoolPipe } from "@multiversx/sdk-nestjs-common";
import { ProviderFilter } from "./entities/provider.filter";
import { Response } from "express";
import { ProviderQueryOptions } from "./entities/provider.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ProviderAccounts } from "./entities/provider.accounts";

@Controller()
@ApiTags('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) { }

  @Get("/providers")
  @ApiOperation({ summary: 'Providers', description: 'Returns a list of all providers' })
  @ApiOkResponse({ type: [Provider] })
  @ApiQuery({ name: 'identity', description: 'Search by identity', required: false })
  @ApiQuery({ name: 'owner', description: 'Search by owner', required: false })
  @ApiQuery({ name: 'providers', description: 'Search by multiple providers address', required: false })
  @ApiQuery({ name: 'withIdentityInfo', description: 'Returns identity data for providers', required: false })
  @ApiQuery({ name: 'withLatestInfo', description: 'Returns providers details with latest info', required: false })
  async getProviders(
    @Query('identity') identity?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('providers', ParseAddressArrayPipe) providers?: string[],
    @Query('withIdentityInfo', ParseBoolPipe) withIdentityInfo?: boolean,
    @Query('withLatestInfo', ParseBoolPipe) withLatestInfo?: boolean,
  ): Promise<Provider[]> {
    const options = ProviderQueryOptions.applyDefaultOptions(owner, { withIdentityInfo, withLatestInfo });

    return await this.providerService.getProviders(
      new ProviderFilter({ identity, providers, owner }), options);
  }

  @Get('/providers/:address/accounts')
  @ApiOperation({ summary: 'Provider', description: 'Returns provider delegators accounts for a given provider address' })
  @ApiOkResponse({ type: Provider })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getProviderAccounts(
    @Param('address', ParseAddressPipe) address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,): Promise<ProviderAccounts[]> {
    const provider = await this.providerService.getProviderAccounts(address, new QueryPagination({ from, size }));

    if (provider === undefined) {
      throw new HttpException(`Provider '${address}' not found`, HttpStatus.NOT_FOUND);
    }

    return provider;
  }

  @Get('/providers/:address/accounts/count')
  @ApiOperation({ summary: 'Provider', description: 'Returns provider total number of delegators' })
  @ApiOkResponse({ type: Provider })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  async getProviderAccountsCount(@Param('address', ParseAddressPipe) address: string): Promise<number> {
    const provider = await this.providerService.getProviderAccountsCount(address);
    if (provider === undefined) {
      throw new HttpException(`Provider '${address}' not found`, HttpStatus.NOT_FOUND);
    }

    return provider;
  }

  @Get('/providers/:address')
  @ApiOperation({ summary: 'Provider', description: 'Returns provider details for a given address' })
  @ApiOkResponse({ type: Provider })
  @ApiNotFoundResponse({ description: 'Provider not found' })
  async getProvider(@Param('address', ParseAddressPipe) address: string): Promise<Provider> {
    const provider = await this.providerService.getProvider(address);
    if (provider === undefined) {
      throw new HttpException(`Provider '${address}' not found`, HttpStatus.NOT_FOUND);
    }

    return provider;
  }

  @Get('/providers/:address/avatar')
  @ApiOperation({ summary: 'Provider avatar', description: 'Returns the avatar for a specific provider address' })
  @ApiNotFoundResponse({ description: 'Provider avatar not found' })
  async getIdentityAvatar(
    @Param('address') address: string,
    @Res() response: Response
  ): Promise<void> {
    const url = await this.providerService.getProviderAvatar(address);

    if (!url) {
      throw new HttpException('Provider avatar not found', HttpStatus.NOT_FOUND);
    }
    response.redirect(url);
  }
}
