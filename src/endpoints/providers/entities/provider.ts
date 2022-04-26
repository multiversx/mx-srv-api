import { ApiProperty } from "@nestjs/swagger";
import { NodesInfos } from "./nodes.infos";

export class Provider extends NodesInfos {
  @ApiProperty()
  provider: string = '';

  @ApiProperty({ type: String, nullable: true })
  owner: string | null = null;

  @ApiProperty()
  featured: boolean = false;

  @ApiProperty()
  serviceFee: number = 0;

  @ApiProperty()
  delegationCap: string = '';

  @ApiProperty()
  apr: number = 0;

  @ApiProperty()
  numUsers: number = 0;

  @ApiProperty({ type: String, nullable: true })
  cumulatedRewards: string | null = null;

  @ApiProperty()
  identity: string | undefined = undefined;
}
