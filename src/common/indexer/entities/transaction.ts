export interface Transaction {
  hash: string;
  miniBlockHash: string;
  nonce: number;
  round: number;
  value: string;
  receiver: string;
  receiverUserName: string;
  receiverUsername: string; // for newer ES indexer versions
  sender: string;
  senderUserName: string;
  senderUsername: string; // for newer ES indexer versions
  receiverShard: number;
  senderShard: number;
  gasPrice: string;
  gasLimit: string;
  gasUsed: string;
  fee: string;
  data: string;
  signature: string;
  timestamp: number;
  status: string;
  searchOrder: number;
  hasScResults: boolean;
  hasOperations: boolean;
  tokens: string[];
  esdtValues: string[];
  receivers: string[];
  receiversShardIDs: number[];
  operation: string;
  scResults: any[];
  version: number;
  relayerAddr: string;
  relayer: string;
  relayerSignature: string;
  isRelayed: boolean;
}
