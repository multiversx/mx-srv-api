import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { NftMedia } from "./nft.media";
import { NftMetadata } from "./nft.metadata";
import { NftType } from "./nft.type";
import { ComplexityEstimation, SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { NftRarities } from "./nft.rarities";
import { UnlockMileStoneModel } from "src/common/locked-asset/entities/unlock.milestone.model";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { NftSubType } from "./nft.sub.type";

export class Nft {
  constructor(init?: Partial<Nft>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection: string = '';

  @ApiProperty({ type: String })
  hash: string = '';

  @ApiProperty({ type: Number, nullable: true })
  timestamp?: number = undefined;

  @ApiProperty({ type: String })
  attributes: string = '';

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty({ enum: NftSubType })
  subType: NftSubType = NftSubType.NonFungibleESDT;

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  creator: string = '';

  @ApiProperty({ type: Number, nullable: true })
  royalties: number | undefined = undefined;

  @ApiProperty({ type: String, isArray: true })
  uris: string[] = [];

  @ApiProperty({ type: String })
  url: string = '';

  @ApiProperty({ type: NftMedia, nullable: true, required: false })
  media: NftMedia[] | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false, required: false })
  isWhitelistedStorage: boolean = false;

  @ApiProperty({ type: String, required: false })
  thumbnailUrl: string = '';

  @ApiProperty({ type: String, isArray: true, required: false })
  tags: string[] = [];

  @ApiProperty({ type: NftMetadata, nullable: true })
  metadata: NftMetadata | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  @ComplexityEstimation({ value: 100, alternatives: ['withOwner'], group: 'extras' })
  owner: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  balance: string | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  @ComplexityEstimation({ value: 100, alternatives: ['withSupply'], group: 'extras' })
  supply: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  decimals: number | undefined = undefined;

  @ApiProperty({ type: TokenAssets, required: false })
  assets?: TokenAssets;

  @ApiProperty({ type: String })
  ticker?: string = '';

  @ApiProperty({ type: ScamInfo, nullable: true, required: false })
  scamInfo: ScamInfo | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  score: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  rank: number | undefined = undefined;

  @ApiProperty({ type: NftRarities, nullable: true, required: false })
  rarities: NftRarities | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  isNsfw: boolean | undefined = undefined;

  @ApiProperty({ type: [UnlockMileStoneModel], nullable: true, required: false })
  unlockSchedule?: UnlockMileStoneModel[] | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  unlockEpoch?: number | undefined = undefined;
}
