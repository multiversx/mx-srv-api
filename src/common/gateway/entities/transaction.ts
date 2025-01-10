import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionReceipt } from "src/endpoints/transactions/entities/transaction.receipt";
import { GatewaySmartContractResults } from "./smart.contract.results.detailed";

export class Transaction {
  constructor(init?: Partial<Transaction>) {
    Object.assign(this, init);
  }

  type: string = '';
  processingTypeOnSource: string = '';
  processingTypeOnDestination: string = '';
  hash: string = '';
  nonce: number = 0;
  round: number = 0;
  epoch: number = 0;
  value: string = '';
  receiver: string = '';
  receiverUsername: string = '';
  sender: string = '';
  senderUsername: string = '';
  gasPrice: number = 0;
  gasLimit: number = 0;
  gasUsed: number = 0;
  fee: number = 0;
  data: string = '';
  status: string = '';
  signature: string = '';
  sourceShard: number = 0;
  destinationShard: number = 0;
  blockNonce: number = 0;
  blockHash: string = '';
  notarizedAtSourceInMetaNonce: number = 0;
  NotarizedAtSourceInMetaHash: string = '';
  notarizedAtDestinationInMetaNonce: number = 0;
  notarizedAtDestinationInMetaHash: string = '';
  miniblockType: string = '';
  miniblockHash: string = '';
  hyperblockNonce: number = 0;
  timestamp: number = 0;
  guardian: string = '';
  guardianSignature: string = '';
  logs: TransactionLog | undefined = undefined;
  receipt: TransactionReceipt | undefined = undefined;
  smartContractResults: GatewaySmartContractResults[] | undefined = undefined;
  relayerAddress: string = '';
  relayerSignature: string = '';
}
