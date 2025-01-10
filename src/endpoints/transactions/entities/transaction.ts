import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { Account } from "src/endpoints/accounts/entities/account";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionAction } from "../transaction-action/entities/transaction.action";

export class Transaction {
  constructor(init?: Partial<Transaction>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  txHash: string = '';

  @ApiProperty({ type: Number })
  gasLimit: number | undefined = undefined;

  @ApiProperty({ type: Number })
  gasPrice: number | undefined = undefined;

  @ApiProperty({ type: Number })
  gasUsed: number | undefined = undefined;

  @ApiProperty({ type: String })
  miniBlockHash: string | undefined = undefined;

  @ApiProperty({ type: Number })
  nonce: number | undefined = undefined;

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: String, nullable: true, required: false })
  receiverUsername: string = '';

  receiverAccount: Account | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true, required: false })
  receiverAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  receiverShard: number = 0;

  @ApiProperty({ type: Number })
  round: number | undefined = undefined;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String, nullable: true, required: false })
  senderUsername: string = '';

  senderAccount: Account | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true, required: false })
  senderAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  senderShard: number = 0;

  @ApiProperty({ type: String })
  signature: string | undefined = undefined;

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: String })
  value: string = '';

  @ApiProperty({ type: String })
  fee: string | undefined = undefined;

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: String, nullable: true, required: false })
  data: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  function: string | undefined = undefined;

  @ApiProperty({ type: TransactionAction, nullable: true, required: false })
  action: TransactionAction | undefined = undefined;

  @ApiProperty({ type: ScamInfo, nullable: true, required: false })
  scamInfo: ScamInfo | undefined = undefined;

  @ApiProperty({ enum: TransactionType, nullable: true, required: false })
  type: TransactionType | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  originalTxHash: string | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true, required: false })
  pendingResults: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  guardianAddress: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  guardianSignature: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  isRelayed: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  relayer: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  relayerSignature: string | undefined = undefined;

  getDate(): Date | undefined {
    if (this.timestamp) {
      return new Date(this.timestamp * 1000);
    }

    return undefined;
  }
}
