export interface Collection {
  _id: string;
  name: string;
  ticker: string;
  token: string;
  issuer: string;
  currentOwner: string;
  type: string;
  timestamp: number;
  ownersHistory: { address: string, timestamp: number }[];
  api_isVerified?: boolean;
  api_nftCount?: number;
  api_holderCount?: number;
  nft_scamInfoType?: string;
  nft_scamInfoDescription?: string;
  api_assets?: any;
}
