import { ApiProperty } from '@nestjs/swagger';

export class BlockProofDto {
  @ApiProperty({
    type: String,
    description: "Bitmap representing public keys involved in the proof",
    example: "7702",
  })
  pubKeysBitmap?: string;

  @ApiProperty({
    type: String,
    description: "Aggregated BLS signature for the proof",
    example: "50224d66a42a019991d16f25dba375b581f279d4394d4c254876c1484f61bed90fb20456f8af107c54e4eed1763e2a92",
  })
  aggregatedSignature?: string;

  @ApiProperty({
    type: String,
    description: "Hash of the block header being proven",
    example: "414d526161587ae9f53453aa0392971272c48dbb3cc54a33448972d388e0deeb",
  })
  headerHash?: string;

  @ApiProperty({type: Number, description: "Epoch number of the block header", example: 130})
  headerEpoch?: number;

  @ApiProperty({type: Number, description: "Nonce value of the block header", example: 13137})
  headerNonce?: number;

  @ApiProperty({type: Number, description: "Round number of the block header", example: 13163})
  headerRound?: number;
}
