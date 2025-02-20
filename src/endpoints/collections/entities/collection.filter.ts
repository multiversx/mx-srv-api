import { SortOrder } from "src/common/entities/sort.order";
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";
import { NftType } from "../../nfts/entities/nft.type";
import { SortCollections } from "./sort.collections";

export class CollectionFilter {
  constructor(init?: Partial<CollectionFilter>) {
    Object.assign(this, init);
  }

  collection?: string;
  identifiers?: string[];
  search?: string;
  type?: NftType[];
  subType?: NftSubType[];
  owner?: string;
  before?: number;
  after?: number;
  canCreate?: boolean | string;
  canBurn?: boolean | string;
  canAddQuantity?: boolean | string;
  canUpdateAttributes?: boolean | string;
  canAddUri?: boolean | string;
  canTransferRole?: boolean | string;
  excludeMetaESDT?: boolean;

  sort?: SortCollections;
  order?: SortOrder;

  name?: string;
  hasAssets?: boolean;
}
