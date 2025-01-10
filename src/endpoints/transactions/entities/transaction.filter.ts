import { QueryConditionOptions } from "@multiversx/sdk-nestjs-elastic";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "./transaction.status";
import { TransactionType } from "./transaction.type";
import { BadRequestException } from "@nestjs/common";

export class TransactionFilter {
  address?: string;
  sender?: string;
  senders?: string[] = [];
  receivers?: string[] = [];
  token?: string;
  functions?: string[] = [];
  senderShard?: number;
  receiverShard?: number;
  miniBlockHash?: string;
  hashes?: string[];
  status?: TransactionStatus;
  before?: number;
  after?: number;
  condition?: QueryConditionOptions;
  order?: SortOrder;
  type?: TransactionType;
  tokens?: string[];
  senderOrReceiver?: string;
  isRelayed?: boolean;
  relayer?: string;
  round?: number;
  withRefunds?: boolean;
  withRelayedScresults?: boolean;
  withTxsRelayedByAddress?: boolean;

  constructor(init?: Partial<TransactionFilter>) {
    Object.assign(this, init);
  }

  static validate(filter: TransactionFilter, size: number) {
    if (filter.withRelayedScresults && size > 50) {
      throw new BadRequestException('Size must be less than or equal to 50 when withRelayedScresults is set');
    }
  }
}
