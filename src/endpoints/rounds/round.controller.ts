import { ParseBlsHashPipe, ParseEnumPipe, ParseIntPipe } from "@multiversx/sdk-nestjs-common";
import { QueryConditionOptions } from "@multiversx/sdk-nestjs-elastic";
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { RoundService } from "./round.service";

@Controller()
@ApiTags('rounds')
export class RoundController {
  constructor(private readonly roundService: RoundService) { }

  @Get("/rounds")
  @ApiOperation({ summary: 'Rounds', description: 'Returns a list of all rounds available on blockchain' })
  @ApiOkResponse({ type: [Round] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false })
  @ApiQuery({ name: 'condition', description: 'Filter by condition', required: false })
  @ApiQuery({ name: 'shard', description: 'Filter by shard identifier', required: false })
  @ApiQuery({ name: 'epoch', description: 'Filter by epoch number', required: false })
  getRounds(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query("validator", ParseBlsHashPipe) validator?: string,
    @Query('condition', new ParseEnumPipe(QueryConditionOptions)) condition?: QueryConditionOptions,
    @Query("shard", ParseIntPipe) shard?: number,
    @Query("epoch", ParseIntPipe) epoch?: number,
  ): Promise<Round[]> {
    return this.roundService.getRounds(new RoundFilter({ from, size, condition, validator, shard, epoch }));
  }

  @Get("/rounds/count")
  @ApiOperation({ summary: 'Rounds count', description: 'Returns total number of rounds' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false })
  @ApiQuery({ name: 'condition', description: 'Filter by condition', required: false })
  @ApiQuery({ name: 'shard', description: 'Filter by shard identifier', required: false })
  @ApiQuery({ name: 'epoch', description: 'Filter by epoch number', required: false })
  getRoundCount(
    @Query("validator", ParseBlsHashPipe) validator?: string,
    @Query('condition', new ParseEnumPipe(QueryConditionOptions)) condition?: QueryConditionOptions,
    @Query("shard", ParseIntPipe) shard?: number,
    @Query("epoch", ParseIntPipe) epoch?: number,
  ): Promise<number> {
    return this.roundService.getRoundCount(new RoundFilter({ condition, validator, shard, epoch }));
  }

  @Get("/rounds/c")
  @ApiExcludeEndpoint()
  getRoundCountAlternative(
    @Query("validator", ParseBlsHashPipe) validator?: string,
    @Query('condition', new ParseEnumPipe(QueryConditionOptions)) condition?: QueryConditionOptions,
    @Query("shard", ParseIntPipe) shard?: number,
    @Query("epoch", ParseIntPipe) epoch?: number,
  ): Promise<number> {
    return this.roundService.getRoundCount(new RoundFilter({ condition, validator, shard, epoch }));
  }

  @Get("/rounds/:shard/:round")
  @ApiOperation({ summary: 'Round', description: 'Returns details of a given round from a specific shard' })
  @ApiOkResponse({ type: RoundDetailed })
  @ApiNotFoundResponse({ description: 'Round not found' })
  async getRound(
    @Param('shard', ParseIntPipe) shard: number,
    @Param('round', ParseIntPipe) round: number
  ): Promise<RoundDetailed> {
    try {
      return await this.roundService.getRound(shard, round);
    } catch {
      throw new HttpException('Round not found', HttpStatus.NOT_FOUND);
    }
  }
}
