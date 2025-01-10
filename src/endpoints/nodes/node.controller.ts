import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NodeService } from "src/endpoints/nodes/node.service";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeType } from "./entities/node.type";
import { NodeStatus } from "./entities/node.status";
import { SortOrder } from "src/common/entities/sort.order";
import { NodeSort } from "./entities/node.sort";
import { SortNodes } from "src/common/entities/sort.nodes";
import { NodeFilter } from "./entities/node.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ParseAddressPipe, ParseBlsHashPipe, ParseBoolPipe, ParseEnumPipe, ParseIntPipe } from "@multiversx/sdk-nestjs-common";
import { NodeAuction } from "./entities/node.auction";
import { NodeSortAuction } from "./entities/node.sort.auction";
import { NodeAuctionFilter } from "./entities/node.auction.filter";

@Controller()
@ApiTags('nodes')
export class NodeController {
  constructor(private readonly nodeService: NodeService) { }

  @Get("/nodes")
  @ApiOperation({ summary: 'Nodes', description: 'Returns a list of nodes of type observer or validator' })
  @ApiOkResponse({ type: [Node] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'keys', description: 'Search by multiple keys, comma-separated', required: false })
  @ApiQuery({ name: 'search', description: 'Search by name, bls or version', required: false })
  @ApiQuery({ name: 'online', description: 'Whether node is online or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'type', description: 'Type of node', required: false, enum: NodeType })
  @ApiQuery({ name: 'status', description: 'Node status', required: false, enum: NodeStatus })
  @ApiQuery({ name: 'shard', description: 'Node shard', required: false })
  @ApiQuery({ name: 'issues', description: 'Whether node has issues or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'identity', description: 'Node identity', required: false })
  @ApiQuery({ name: 'provider', description: 'Node provider', required: false })
  @ApiQuery({ name: 'owner', description: 'Node owner', required: false })
  @ApiQuery({ name: 'auctioned', description: 'Whether node is auctioned or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'fullHistory', description: 'Whether node is of type \'Full History\' or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: SortNodes })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'isQualified', description: 'Whether node is qualified or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'isAuctioned', description: 'Whether node is auctioned or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'isAuctionDangerZone', description: 'Whether node is in danger zone or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'withIdentityInfo', description: 'Returns identity data for nodes', required: false })
  async getNodes(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('search') search?: string,
    @Query('keys') keys?: string[],
    @Query('online', ParseBoolPipe) online?: boolean,
    @Query('type', new ParseEnumPipe(NodeType)) type?: NodeType,
    @Query('status', new ParseEnumPipe(NodeStatus)) status?: NodeStatus,
    @Query('shard', ParseIntPipe) shard?: number,
    @Query('issues', ParseBoolPipe) issues?: boolean,
    @Query('identity') identity?: string,
    @Query('provider', ParseAddressPipe) provider?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('auctioned', ParseBoolPipe) auctioned?: boolean,
    @Query('fullHistory', ParseBoolPipe) fullHistory?: boolean,
    @Query('sort', new ParseEnumPipe(NodeSort)) sort?: NodeSort,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withIdentityInfo', ParseBoolPipe) withIdentityInfo?: boolean,
    @Query('isQualified', ParseBoolPipe) isQualified?: boolean,
    @Query('isAuctioned', ParseBoolPipe) isAuctioned?: boolean,
    @Query('isAuctionDangerZone', ParseBoolPipe) isAuctionDangerZone?: boolean,
  ): Promise<Node[]> {
    return await this.nodeService.getNodes(new QueryPagination({ from, size }), new NodeFilter({ search, keys, online, type, status, shard, issues, identity, provider, owner, auctioned, fullHistory, sort, order, isQualified, isAuctionDangerZone, isAuctioned, withIdentityInfo }));
  }

  @Get("/nodes/versions")
  @ApiOperation({ summary: 'Node versions', description: 'Returns breakdown of node versions for validator nodes' })
  @ApiOkResponse()
  async getNodeVersions() {
    return await this.nodeService.getNodeVersions();
  }

  @Get("/nodes/count")
  @ApiOperation({ summary: 'Nodes count', description: 'Returns number of all observer/validator nodes available on blockchain' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'search', description: 'Search by name, bls or version', required: false })
  @ApiQuery({ name: 'online', description: 'Whether node is online or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'type', description: 'Type of node', required: false, enum: NodeType })
  @ApiQuery({ name: 'status', description: 'Node status', required: false, enum: NodeStatus })
  @ApiQuery({ name: 'shard', description: 'Node shard', required: false })
  @ApiQuery({ name: 'issues', description: 'Whether node has issues or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'identity', description: 'Node identity', required: false })
  @ApiQuery({ name: 'provider', description: 'Node provider', required: false })
  @ApiQuery({ name: 'owner', description: 'Node owner', required: false })
  @ApiQuery({ name: 'auctioned', description: 'Whether node is auctioned or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'fullHistory', description: 'Whether node is of type \'Full History\' or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: SortNodes })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  @ApiQuery({ name: 'isQualified', description: 'Whether node is qualified or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'isAuctioned', description: 'Whether node is auctioned or not', required: false, type: 'boolean' })
  @ApiQuery({ name: 'isAuctionDangerZone', description: 'Whether node is in danger zone or not', required: false, type: 'boolean' })
  getNodeCount(
    @Query('search') search?: string,
    @Query('online', ParseBoolPipe) online?: boolean,
    @Query('type', new ParseEnumPipe(NodeType)) type?: NodeType,
    @Query('status', new ParseEnumPipe(NodeStatus)) status?: NodeStatus,
    @Query('shard', ParseIntPipe) shard?: number,
    @Query('issues', ParseBoolPipe) issues?: boolean,
    @Query('identity') identity?: string,
    @Query('provider', ParseAddressPipe) provider?: string,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('auctioned', ParseBoolPipe) auctioned?: boolean,
    @Query('fullHistory', ParseBoolPipe) fullHistory?: boolean,
    @Query('sort', new ParseEnumPipe(NodeSort)) sort?: NodeSort,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('isQualified', ParseBoolPipe) isQualified?: boolean,
    @Query('isAuctioned', ParseBoolPipe) isAuctioned?: boolean,
    @Query('isAuctionDangerZone', ParseBoolPipe) isAuctionDangerZone?: boolean,
  ): Promise<number> {
    return this.nodeService.getNodeCount(new NodeFilter({ search, online, type, status, shard, issues, identity, provider, owner, auctioned, fullHistory, sort, order, isQualified, isAuctionDangerZone, isAuctioned }));
  }

  @Get("/nodes/c")
  @ApiExcludeEndpoint()
  getNodeCountAlternative(
    @Query('search') search?: string,
    @Query('online', ParseBoolPipe) online?: boolean,
    @Query('type', new ParseEnumPipe(NodeType)) type?: NodeType,
    @Query('status', new ParseEnumPipe(NodeStatus)) status?: NodeStatus,
    @Query('shard', ParseIntPipe) shard?: number,
    @Query('issues', ParseBoolPipe) issues?: boolean,
    @Query('identity') identity?: string,
    @Query('provider', ParseAddressPipe) provider?: string,
    @Query('auctioned', ParseBoolPipe) auctioned?: boolean,
    @Query('fullHistory', ParseBoolPipe) fullHistory?: boolean,
    @Query('owner', ParseAddressPipe) owner?: string,
    @Query('sort', new ParseEnumPipe(NodeSort)) sort?: NodeSort,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('isQualified', ParseBoolPipe) isQualified?: boolean,
    @Query('isAuctioned', ParseBoolPipe) isAuctioned?: boolean,
    @Query('isAuctionDangerZone', ParseBoolPipe) isAuctionDangerZone?: boolean,
  ): Promise<number> {
    return this.nodeService.getNodeCount(new NodeFilter({ search, online, type, status, shard, issues, identity, provider, owner, auctioned, fullHistory, sort, order, isQualified, isAuctionDangerZone, isAuctioned }));
  }

  @Get("nodes/auctions")
  @ApiOperation({ summary: 'Nodes Auctions', description: 'Returns a list of nodes in auction' })
  @ApiOkResponse({ type: [NodeAuction] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'sort', description: 'Sorting criteria', required: false, enum: NodeSortAuction })
  @ApiQuery({ name: 'order', description: 'Sorting order (asc / desc)', required: false, enum: SortOrder })
  async getNodesAuctions(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(10000), ParseIntPipe) size: number,
    @Query('sort', new ParseEnumPipe(NodeSortAuction)) sort?: NodeSortAuction,
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
  ): Promise<NodeAuction[]> {
    return await this.nodeService.getNodesAuctions(
      new QueryPagination({ from, size }),
      new NodeAuctionFilter({ sort, order })
    );
  }

  @Get('/nodes/:bls')
  @ApiOperation({ summary: 'Node', description: 'Returns details about a specific node for a given bls key' })
  @ApiOkResponse({ type: Node })
  @ApiNotFoundResponse({ description: 'Node not found' })
  async getNode(@Param('bls', ParseBlsHashPipe) bls: string): Promise<Node> {
    const provider = await this.nodeService.getNode(bls);
    if (provider === undefined) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

    return provider;
  }
}
