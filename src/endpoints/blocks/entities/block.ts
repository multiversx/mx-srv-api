import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { ApiProperty } from "@nestjs/swagger";
import { Identity } from "src/endpoints/identities/entities/identity";
import { BlockProofDto } from "./block.proof";

export class Block {
  constructor(init?: Partial<Block>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  hash: string = '';

  @ApiProperty({ type: Number })
  epoch: number = 0;

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: String })
  prevHash: string = '';

  @ApiProperty({ type: String })
  proposer: string = '';

  @ApiProperty({ type: Identity, nullable: true, required: false })
  proposerIdentity: Identity | undefined = undefined;

  @ApiProperty({ type: String })
  pubKeyBitmap: string = '';

  @ApiProperty({ type: Number })
  round: number = 0;

  @ApiProperty({ type: Number })
  shard: number = 0;

  @ApiProperty({ type: Number })
  size: number = 0;

  @ApiProperty({ type: Number })
  sizeTxs: number = 0;

  @ApiProperty({ type: String })
  stateRootHash: string = '';

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Number })
  txCount: number = 0;

  @ApiProperty({ type: Number })
  gasConsumed: number = 0;

  @ApiProperty({ type: Number })
  gasRefunded: number = 0;

  @ApiProperty({ type: Number })
  gasPenalized: number = 0;

  @ApiProperty({ type: Number })
  maxGasLimit: number = 0;

  @ApiProperty({ type: String, nullable: true, required: false })
  scheduledRootHash: string | undefined = undefined;

  @ApiProperty({ type: BlockProofDto, nullable: true, required: false })
  previousHeaderProof: BlockProofDto | undefined = undefined;

  @ApiProperty({ type: BlockProofDto, nullable: true, required: false })
  proof: BlockProofDto | undefined = undefined;

  static mergeWithElasticResponse<T extends Block>(newBlock: T, blockRaw: any): T {
    blockRaw.shard = blockRaw.shardId;

    if (blockRaw.gasProvided) {
      blockRaw.gasConsumed = blockRaw.gasProvided;
    }

    if (blockRaw.scheduledData?.rootHash) {
      blockRaw.maxGasLimit = blockRaw.maxGasLimit * 2;
    }

    return ApiUtils.mergeObjects(newBlock, blockRaw);
  }
}
