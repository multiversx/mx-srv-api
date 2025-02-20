import { AccountQueryOptions } from "src/endpoints/accounts/entities/account.query.options";
import { AccountHistoryFilter } from "src/endpoints/accounts/entities/account.history.filter";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { MiniBlockFilter } from "src/endpoints/miniblocks/entities/mini.block.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TokenAssets } from "../assets/entities/token.assets";
import { QueryPagination } from "../entities/query.pagination";
import { Account, AccountHistory, AccountTokenHistory, Block, Collection, MiniBlock, Operation, Round, ScDeploy, ScResult, Tag, Token, TokenAccount, Transaction, TransactionLog, TransactionReceipt } from "./entities";
import { AccountAssets } from "../assets/entities/account.assets";
import { ProviderDelegators } from "./entities/provider.delegators";
import { ApplicationFilter } from "src/endpoints/applications/entities/application.filter";
import { EventsFilter } from "src/endpoints/events/entities/events.filter";
import { Events } from "./entities/events";

export interface IndexerInterface {
  getAccountsCount(filter: AccountQueryOptions): Promise<number>

  getScResultsCount(filter: SmartContractResultFilter): Promise<number>

  getAccountDeploysCount(address: string): Promise<number>

  getBlocksCount(filter: BlockFilter): Promise<number>

  getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]>

  getNftCollectionCount(filter: CollectionFilter): Promise<number>

  getNftCountForAddress(address: string, filter: NftFilter): Promise<number>

  getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number>

  getNftCount(filter: NftFilter): Promise<number>

  getNftOwnersCount(identifier: string): Promise<number>

  getTransfersCount(filter: TransactionFilter): Promise<number>

  getTokenCountForAddress(address: string, filter: TokenFilter): Promise<number>

  getTokenAccountsCount(identifier: string): Promise<number | undefined>

  getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]>

  getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number>

  getNftTagCount(search?: string): Promise<number>

  getRoundCount(filter: RoundFilter): Promise<number>

  getAccountScResultsCount(address: string): Promise<number>

  getTransactionCountForAddress(address: string): Promise<number>

  getTransactionCount(filter: TransactionFilter, address?: string): Promise<number>

  getRound(shard: number, round: number): Promise<Round>

  getToken(identifier: string): Promise<Token>

  getCollection(identifier: string): Promise<Collection | undefined>

  getTransaction(txHash: string): Promise<Transaction | null>

  getScDeploy(address: string): Promise<ScDeploy | undefined>

  getScResult(scHash: string): Promise<ScResult>

  getBlock(hash: string): Promise<Block>

  getMiniBlock(miniBlockHash: string): Promise<MiniBlock>

  getMiniBlocks(pagination: QueryPagination, filter: MiniBlockFilter): Promise<MiniBlock[]>

  getTag(tag: string): Promise<Tag>

  getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Operation[]>

  getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<Token[]>

  getRounds(filter: RoundFilter): Promise<Round[]>

  getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<Collection[]>

  getNftCollectionsByIds(identifiers: string[]): Promise<Collection[]>

  getSmartContractResults(transactionHashes: string[]): Promise<ScResult[]>;

  getAccountsForAddresses(addresses: string[]): Promise<Account[]>;

  getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<TokenAccount[]>

  getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]>

  getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<ScResult[]>

  getAccountScResults(address: string, pagination: QueryPagination): Promise<ScResult[]>

  getAccount(address: string): Promise<Account>

  getAccounts(queryPagination: QueryPagination, filter: AccountQueryOptions, fields?: string[]): Promise<Account[]>

  getAccountDeploys(pagination: QueryPagination, address: string): Promise<ScDeploy[]>

  getAccountContracts(pagination: QueryPagination, address: string): Promise<any[]>

  getAccountContractsCount(address: string): Promise<number>

  getAccountHistory(address: string, pagination: QueryPagination, filter: AccountHistoryFilter): Promise<AccountHistory[]>

  getProviderDelegators(address: string, pagination: QueryPagination): Promise<ProviderDelegators[]>

  getProviderDelegatorsCount(address: string): Promise<number>

  getAccountHistoryCount(address: string, filter?: AccountHistoryFilter): Promise<number>

  getAccountTokenHistoryCount(address: string, tokenIdentifier: string, filter?: AccountHistoryFilter): Promise<number>

  getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination, filter: AccountHistoryFilter): Promise<AccountTokenHistory[]>

  getAccountEsdtHistory(address: string, pagination: QueryPagination, filter: AccountHistoryFilter): Promise<AccountTokenHistory[]>

  getAccountEsdtHistoryCount(address: string, filter?: AccountHistoryFilter): Promise<number>

  getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transaction[]>

  getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<Token[]>

  getTransactionLogs(hashes: string[]): Promise<TransactionLog[]>

  getTransactionScResults(txHash: string): Promise<ScResult[]>

  getScResultsForTransactions(elasticTransactions: Transaction[]): Promise<ScResult[]>

  getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]>

  getAccountsEsdtByCollection(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]>

  getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<TokenAccount[]>

  getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<TokenAccount[]>

  getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<Transaction[]>

  getTransactionReceipts(txHash: string): Promise<TransactionReceipt[]>

  getAllTokensMetadata(action: (items: Token[]) => Promise<void>): Promise<void>

  getEsdtAccountsCount(identifier: string): Promise<number>

  getAllAccountsWithToken(identifier: string, action: (items: TokenAccount[]) => Promise<void>): Promise<void>

  getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined>

  getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number }[]>

  getAssetsForToken(identifier: string): Promise<TokenAssets>

  setAssetsForToken(identifier: string, value: TokenAssets): Promise<void>

  setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void>

  setMediaForToken(identifier: string, value: NftMedia[]): Promise<void>

  setMetadataForToken(identifier: string, value: any): Promise<void>

  setExtraCollectionFields(identifier: string, isVerified: boolean, holderCount: number, nftCount: number): Promise<void>

  setAccountAssetsFields(address: string, assets: AccountAssets): Promise<void>

  setCollectionAssetsFields(identifier: string, assets: any): Promise<void>

  ensureAccountsWritable(): Promise<void>

  ensureTokensWritable(): Promise<void>

  setAccountTransfersLast24h(address: string, transfersLast24h: number): Promise<void>

  getBlockByTimestampAndShardId(timestamp: number, shardId: number): Promise<Block | undefined>

  getVersion(): Promise<string | undefined>

  getApplications(filter: ApplicationFilter, pagination: QueryPagination): Promise<any[]>

  getApplicationCount(filter: ApplicationFilter): Promise<number>

  getApplication(address: string): Promise<any>

  getAddressesWithTransfersLast24h(): Promise<string[]>

  getEvents(pagination: QueryPagination, filter: EventsFilter): Promise<Events[]>

  getEvent(txHash: string): Promise<Events>

  getEventsCount(filter: EventsFilter): Promise<number>
}
