import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "./entities/token.filter";
import { TokenHelpers } from "src/utils/token.helpers";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAccount } from "./entities/token.account";
import { EsdtType } from "../esdt/entities/esdt.type";
import { EsdtAddressService } from "../esdt/esdt.address.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { TokenProperties } from "./entities/token.properties";
import { TokenRoles } from "./entities/token.roles";
import { TokenSupplyResult } from "./entities/token.supply.result";
import { TokenDetailedWithBalance } from "./entities/token.detailed.with.balance";
import { SortOrder } from "src/common/entities/sort.order";
import { TokenSort } from "./entities/token.sort";
import { TokenWithRoles } from "./entities/token.with.roles";
import { TokenWithRolesFilter } from "./entities/token.with.roles.filter";
import { AddressUtils, BinaryUtils, NumberUtils, TokenUtils } from "@multiversx/sdk-nestjs-common";
import { ApiService, ApiUtils } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { IndexerService } from "src/common/indexer/indexer.service";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { TokenLogo } from "./entities/token.logo";
import { AssetsService } from "src/common/assets/assets.service";
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionService } from "../transactions/transaction.service";
import { MexTokenService } from "../mex/mex.token.service";
import { CollectionService } from "../collections/collection.service";
import { NftType } from "../nfts/entities/nft.type";
import { TokenType } from "src/common/indexer/entities";
import { TokenAssetsPriceSourceType } from "src/common/assets/entities/token.assets.price.source.type";
import { DataApiService } from "src/common/data-api/data-api.service";
import { TrieOperationsTimeoutError } from "../esdt/exceptions/trie.operations.timeout.error";
import { TokenSupplyOptions } from "./entities/token.supply.options";
import { TransferService } from "../transfers/transfer.service";
import { MexPairService } from "../mex/mex.pair.service";
import { MexPairState } from "../mex/entities/mex.pair.state";
import { MexTokenType } from "../mex/entities/mex.token.type";
import { NftSubType } from "../nfts/entities/nft.sub.type";

@Injectable()
export class TokenService {
  private readonly logger = new OriginLogger(TokenService.name);
  private readonly nftSubTypes = [NftSubType.DynamicNonFungibleESDT, NftSubType.DynamicMetaESDT, NftSubType.NonFungibleESDTv2, NftSubType.DynamicSemiFungibleESDT];
  private readonly egldIdentifierInMultiTransfer = 'EGLD-000000';

  constructor(
    private readonly esdtService: EsdtService,
    private readonly indexerService: IndexerService,
    private readonly esdtAddressService: EsdtAddressService,
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly assetsService: AssetsService,
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => TransferService))
    private readonly transferService: TransferService,
    @Inject(forwardRef(() => MexTokenService))
    private readonly mexTokenService: MexTokenService,
    private readonly collectionService: CollectionService,
    private readonly dataApiService: DataApiService,
    private readonly mexPairService: MexPairService,
    private readonly apiService: ApiService,
  ) { }

  async isToken(identifier: string): Promise<boolean> {
    const tokens = await this.getAllTokens();
    const lowercaseIdentifier = identifier.toLowerCase();
    return tokens.find(x => x.identifier.toLowerCase() === lowercaseIdentifier) !== undefined;
  }

  async getToken(rawIdentifier: string, supplyOptions?: TokenSupplyOptions): Promise<TokenDetailed | undefined> {
    const tokens = await this.getAllTokens();
    const identifier = this.normalizeIdentifierCase(rawIdentifier);
    let token = tokens.find(x => x.identifier === identifier);

    if (!TokenUtils.isToken(identifier)) {
      return undefined;
    }

    if (!token) {
      return undefined;
    }

    token = ApiUtils.mergeObjects(new TokenDetailed(), token);

    await this.applyTickerFromAssets(token);

    await this.applySupply(token, supplyOptions);

    if (token.type === TokenType.FungibleESDT) {
      token.roles = await this.getTokenRoles(identifier);
    } else if (token.type === TokenType.MetaESDT) {
      const elasticCollection = await this.indexerService.getCollection(identifier);
      if (elasticCollection) {
        await this.collectionService.applyCollectionRoles(token, elasticCollection);
      }
    }

    return token;
  }

  normalizeIdentifierCase(identifier: string): string {
    const [ticker, randomSequence] = identifier.split("-");
    if (!ticker || !randomSequence) {
      return identifier.toUpperCase();
    }

    return `${ticker.toUpperCase()}-${randomSequence.toLowerCase()}`;
  }

  async getTokens(queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenDetailed[]> {
    const {from, size} = queryPagination;

    let tokens = await this.getFilteredTokens(filter);

    tokens = tokens.slice(from, from + size);

    for (const token of tokens) {
      this.applyTickerFromAssets(token);
    }

   return tokens
    .map(item => ApiUtils.mergeObjects(new TokenDetailed(), item))
    .filter(t => t.identifier !== this.egldIdentifierInMultiTransfer);
  }

  applyTickerFromAssets(token: Token) {
    if (token.assets) {
      token.ticker = token.identifier.split('-')[0];
    } else {
      token.ticker = token.identifier;
    }
  }

  async getFilteredTokens(filter: TokenFilter): Promise<TokenDetailed[]> {
    let tokens = await this.getAllTokens();

    if (filter.type) {
      tokens = tokens.filter(token => token.type === filter.type);
    }

    if (filter.subType) {
      tokens = tokens.filter(token => token.subType.toString() === filter.subType?.toString());
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.name) {
      const nameLower = filter.name.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase() === nameLower);
    }

    if (filter.identifier) {
      const identifierLower = filter.identifier.toLowerCase();

      tokens = tokens.filter(token => token.identifier.toLowerCase().includes(identifierLower));
    }

    if (filter.identifiers) {
      const identifierArray = filter.identifiers.map(identifier => identifier.toLowerCase());

      tokens = tokens.filter(token => identifierArray.includes(token.identifier.toLowerCase()));
    }

    if (filter.includeMetaESDT !== true) {
      tokens = tokens.filter(token => token.type === TokenType.FungibleESDT);
    }

    if (filter.sort) {
      tokens = this.sortTokens(tokens, filter.sort, filter.order ?? SortOrder.desc);
    }

    const mexPairTypes = filter.mexPairType ?? [];
    if (mexPairTypes.length > 0) {
      tokens = tokens.filter(token => mexPairTypes.includes(token.mexPairType));
    }

    if (filter.priceSource) {
      tokens = tokens.filter(token => token.assets?.priceSource?.type === filter.priceSource);
    }

    return tokens;
  }

  private sortTokens(tokens: TokenDetailed[], sort: TokenSort, order: SortOrder): TokenDetailed[] {
    let criteria: (token: TokenDetailed) => number;

    switch (sort) {
      case TokenSort.accounts:
        criteria = token => token.accounts ?? 0;
        break;
      case TokenSort.transactions:
        criteria = token => token.transactions ?? 0;
        break;
      case TokenSort.price:
        criteria = token => token.price ?? 0;
        break;
      case TokenSort.marketCap:
        criteria = token => token.isLowLiquidity ? 0 : (token.marketCap ?? 0);
        break;
      default:
        throw new Error(`Unsupported sorting criteria '${sort}'`);
    }

    switch (order) {
      case SortOrder.asc:
        tokens = tokens.sorted(criteria);
        break;
      case SortOrder.desc:
        tokens = tokens.sortedDescending(criteria);
        break;
    }

    return tokens;
  }

  async getTokenCount(filter: TokenFilter): Promise<number> {
    const tokens = await this.getFilteredTokens(filter);

    return tokens.length;
  }

  async getTokenCountForAddress(address: string, filter: TokenFilter): Promise<number> {
    if (AddressUtils.isSmartContractAddress(address)) {
      return await this.getTokenCountForAddressFromElastic(address, filter);
    }

    return await this.getTokenCountForAddressFromGateway(address, filter);
  }

  async getTokenCountForAddressFromElastic(address: string, filter: TokenFilter): Promise<number> {
    return await this.indexerService.getTokenCountForAddress(address, filter);
  }

  async getTokenCountForAddressFromGateway(address: string, filter: TokenFilter): Promise<number> {
    const tokens = await this.getAllTokensForAddress(address, filter);
    return tokens.length;
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens: TokenWithBalance[];
    if (AddressUtils.isSmartContractAddress(address)) {
      tokens = await this.getTokensForAddressFromElastic(address, queryPagination, filter);
    } else {
      tokens = await this.getTokensForAddressFromGatewayWithElasticFallback(address, queryPagination, filter);
    }

    for (const token of tokens) {
      if (token.type === TokenType.MetaESDT) {
        token.collection = token.identifier.split('-').slice(0, 2).join('-');
        token.nonce = BinaryUtils.hexToNumber(token.identifier.split('-').slice(2, 3)[0]);
      }
    }

    return tokens;
  }

  async getTokensForAddressFromElastic(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const elasticTokens = await this.indexerService.getTokensForAddress(address, queryPagination, filter);

    const allTokens = await this.getAllTokens();

    const allTokensIndexed = allTokens.toRecord<TokenDetailed>(token => token.identifier);

    const result: TokenWithBalance[] = [];
    for (const elasticToken of elasticTokens) {
      if (allTokensIndexed[elasticToken.token]) {
        const token = allTokensIndexed[elasticToken.token];

        const tokenWithBalance: TokenWithBalance = {
          ...token,
          identifier: elasticToken.identifier ?? elasticToken.token,
          ticker: elasticToken.identifier,
          balance: elasticToken.balance,
          attributes: elasticToken.data?.attributes,
          valueUsd: undefined,
        };

        this.applyValueUsd(tokenWithBalance);

        this.applyTickerFromAssets(tokenWithBalance);

        result.push(tokenWithBalance);
      }
    }

    return result;
  }

  applyValueUsd(tokenWithBalance: TokenWithBalance) {
    if (tokenWithBalance.price) {
      tokenWithBalance.valueUsd = tokenWithBalance.price * NumberUtils.denominateString(tokenWithBalance.balance, tokenWithBalance.decimals);
    }
  }

  async getTokensForAddressFromGatewayWithElasticFallback(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const isTrieTimeout = await this.cachingService.get<boolean>(CacheInfo.AddressEsdtTrieTimeout(address).key);
    if (isTrieTimeout) {
      return await this.getTokensForAddressFromElastic(address, queryPagination, filter);
    }

    try {
      return await this.getTokensForAddressFromGateway(address, queryPagination, filter);
    } catch (error) {
      if (error instanceof TrieOperationsTimeoutError) {
        await this.cachingService.set(CacheInfo.AddressEsdtTrieTimeout(address).key, true, CacheInfo.AddressEsdtTrieTimeout(address).ttl);
        return await this.getTokensForAddressFromElastic(address, queryPagination, filter);
      }

      throw error;
    }
  }

  async getTokensForAddressFromGateway(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getAllTokensForAddress(address, filter);

    tokens = tokens.slice(queryPagination.from, queryPagination.from + queryPagination.size);
    tokens = tokens.map(token => ApiUtils.mergeObjects(new TokenWithBalance(), token));

    for (const token of tokens) {
      this.applyTickerFromAssets(token);

      this.applyValueUsd(token);
    }

    return tokens;
  }

  async getTokenForAddress(address: string, identifier: string): Promise<TokenDetailedWithBalance | undefined> {
    const esdtIdentifier = identifier.split('-').slice(0, 2).join('-');

    const tokens = await this.getFilteredTokens({ identifier: esdtIdentifier, includeMetaESDT: true });

    if (!TokenUtils.isToken(identifier) && !TokenUtils.isNft(identifier)) {
      return undefined;
    }

    if (!tokens.length) {
      this.logger.log(`Error when fetching token ${identifier} details for address ${address}`);
      return undefined;
    }


    let tokenWithBalance: TokenDetailedWithBalance;
    const token = tokens[0];

    if (TokenUtils.isNft(identifier)) {
      const nftData = await this.gatewayService.getAddressNft(address, identifier);

      tokenWithBalance = new TokenDetailedWithBalance({...token, ...nftData});
    } else {
      const esdtData = await this.gatewayService.getAddressEsdt(address, identifier);

      tokenWithBalance = new TokenDetailedWithBalance({...token, ...esdtData});
    }

    // eslint-disable-next-line require-await
    const esdt = await this.gatewayService.getAddressEsdt(address, identifier);

    if (!esdt || esdt.balance === '0') {
      return undefined;
    }

    tokenWithBalance = ApiUtils.mergeObjects(new TokenDetailedWithBalance(), tokenWithBalance);

    this.applyValueUsd(tokenWithBalance);

    tokenWithBalance.identifier = token.identifier;

    await this.applyTickerFromAssets(tokenWithBalance);

    await this.applySupply(tokenWithBalance);

    return tokenWithBalance;
  }

  async getAllTokensForAddress(address: string, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const tokens = await this.getFilteredTokens(filter);

    const tokensIndexed: { [index: string]: Token } = {};
    for (const token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    const esdts = await this.esdtAddressService.getAllEsdtsForAddressFromGateway(address);

    const tokensWithBalance: TokenWithBalance[] = [];

    for (const tokenIdentifier of Object.keys(esdts)) {
      const identifier = tokenIdentifier.split('-').slice(0, 2).join('-');

      const esdt = esdts[tokenIdentifier];
      const token = tokensIndexed[identifier];
      if (!token) {
        continue;
      }

      if (esdt.type && this.nftSubTypes.includes(esdt.type)) {
        switch (esdt.type as NftSubType) {
          case NftSubType.DynamicNonFungibleESDT:
          case NftSubType.NonFungibleESDTv2:
            esdt.type = NftSubType.NonFungibleESDT;
            esdt.subType = esdt.type;
            break;
          case NftSubType.DynamicMetaESDT:
            esdt.type = NftType.MetaESDT;
            esdt.subType = NftSubType.DynamicMetaESDT;
            break;
          case NftSubType.DynamicSemiFungibleESDT:
            esdt.type = NftType.SemiFungibleESDT;
            esdt.subType = NftSubType.DynamicSemiFungibleESDT;
            break;
          default:
            esdt.subType = NftSubType.None;
            break;
        }
      }

      const tokenWithBalance = {
        ...token,
        ...esdt,
      };

      if (esdt.type === '') { // empty type can come from gateway
        tokenWithBalance.type = token.type;
      }

      tokensWithBalance.push(tokenWithBalance);
    }

    for (const token of tokensWithBalance) {
      // @ts-ignore
      token.identifier = token.tokenIdentifier;
      // @ts-ignore
      delete token.tokenIdentifier;
    }

    return tokensWithBalance;
  }

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[] | undefined> {
    const properties = await this.getTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const tokenAccounts = await this.indexerService.getTokenAccounts(pagination, identifier);
    const assets = await this.assetsService.getAllAccountAssets();
    const result: TokenAccount[] = [];

    for (const tokenAccount of tokenAccounts) {
      result.push(new TokenAccount({
        address: tokenAccount.address,
        balance: tokenAccount.balance,
        assets: assets[tokenAccount.address],
        attributes: tokenAccount.data?.attributes,
        identifier: tokenAccount.type === TokenType.MetaESDT ? tokenAccount.identifier : undefined,
      }));
    }

    return result;
  }

  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    const properties = await this.getTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const count = await this.indexerService.getTokenAccountsCount(identifier);
    return count;
  }

  private async getTokenRolesFromElastic(identifier: string): Promise<TokenRoles[] | undefined> {
    const token = await this.indexerService.getToken(identifier);
    if (!token) {
      return undefined;
    }

    if (!token.roles) {
      return [];
    }

    const roles: TokenRoles[] = [];
    for (const role of Object.keys(token.roles)) {
      const addresses = token.roles[role].distinct();

      for (const address of addresses) {
        let addressRole = roles.find((addressRole) => addressRole.address === address);
        if (!addressRole) {
          addressRole = new TokenRoles();
          addressRole.address = address;
          roles.push(addressRole);
        }

        TokenHelpers.setTokenRole(addressRole, role);
      }
    }

    return roles;
  }

  async getTokenRoles(identifier: string): Promise<TokenRoles[] | undefined> {
    return await this.getTokenRolesFromElastic(identifier);
  }

  async getTokenRolesForIdentifierAndAddress(identifier: string, address: string): Promise<TokenRoles | undefined> {
    const token = await this.indexerService.getToken(identifier);

    if (!token) {
      return undefined;
    }

    if (!token.roles) {
      return undefined;
    }

    const addressRoles: TokenRoles = new TokenRoles();
    addressRoles.address = address;
    for (const role of Object.keys(token.roles)) {
      const addresses = token.roles[role].distinct();
      if (addresses.includes(address)) {
        TokenHelpers.setTokenRole(addressRoles, role);
      }
    }

    //@ts-ignore
    delete addressRoles.address;

    return addressRoles;
  }

  async applySupply(token: TokenDetailed, supplyOptions?: TokenSupplyOptions): Promise<void> {
    const supply = await this.esdtService.getTokenSupply(token.identifier);
    const denominated = supplyOptions && supplyOptions.denominated;

    if (denominated === true) {
      token.supply = NumberUtils.denominate(BigInt(supply.totalSupply), token.decimals);
      token.circulatingSupply = NumberUtils.denominate(BigInt(supply.circulatingSupply), token.decimals);
    } else if (denominated === false) {
      token.supply = supply.totalSupply;
      token.circulatingSupply = supply.circulatingSupply;
    } else {
      token.supply = NumberUtils.denominate(BigInt(supply.totalSupply), token.decimals).toFixed();
      token.circulatingSupply = NumberUtils.denominate(BigInt(supply.circulatingSupply), token.decimals).toFixed();
    }

    if (supply.minted) {
      token.minted = supply.minted;
    }

    if (supply.burned) {
      token.burnt = supply.burned;
    }

    if (supply.initialMinted) {
      token.initialMinted = supply.initialMinted;
    }
  }

  async getTokenSupply(identifier: string, supplyOptions?: TokenSupplyOptions): Promise<TokenSupplyResult | undefined> {
    let totalSupply: string | number;
    let circulatingSupply: string | number;

    const properties = await this.getTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const result = await this.esdtService.getTokenSupply(identifier);
    const denominated = supplyOptions && supplyOptions.denominated;

    if (denominated === true) {
      totalSupply = NumberUtils.denominateString(result.totalSupply, properties.decimals);
      circulatingSupply = NumberUtils.denominateString(result.circulatingSupply, properties.decimals);
    } else if (denominated === false) {
      totalSupply = result.totalSupply;
      circulatingSupply = result.circulatingSupply;
    } else {
      totalSupply = NumberUtils.denominateString(result.totalSupply, properties.decimals).toFixed();
      circulatingSupply = NumberUtils.denominateString(result.circulatingSupply, properties.decimals).toFixed();
    }

    let lockedAccounts = result.lockedAccounts;
    if (lockedAccounts !== undefined) {
      lockedAccounts = JSON.parse(JSON.stringify(lockedAccounts));
      if (denominated === true) {
        // @ts-ignore
        for (const lockedAccount of lockedAccounts) {
          lockedAccount.balance = NumberUtils.denominateString(lockedAccount.balance.toString(), properties.decimals);
        }
      }
    }

    return {
      supply: totalSupply,
      circulatingSupply: circulatingSupply,
      minted: denominated === true && result.minted ? NumberUtils.denominateString(result.minted, properties.decimals) : result.minted,
      burnt: denominated === true && result.burned ? NumberUtils.denominateString(result.burned, properties.decimals) : result.burned,
      initialMinted: denominated === true && result.initialMinted ? NumberUtils.denominateString(result.initialMinted, properties.decimals) : result.initialMinted,
      lockedAccounts: lockedAccounts?.sortedDescending(account => Number(account.balance)),
    };
  }

  async getTokenProperties(identifier: string): Promise<TokenProperties | undefined> {
    if (identifier.split('-').length !== 2) {
      return undefined;
    }

    const properties = await this.esdtService.getEsdtTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    if (![EsdtType.FungibleESDT, EsdtType.MetaESDT].includes(properties.type)) {
      return undefined;
    }

    return properties;
  }

  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    return await this.indexerService.getTokensWithRolesForAddressCount(address, filter);
  }

  async getTokenWithRolesForAddress(address: string, identifier: string): Promise<TokenWithRoles | undefined> {
    const tokens = await this.getTokensWithRolesForAddress(address, { identifier, includeMetaESDT: true }, { from: 0, size: 1 });
    if (tokens.length === 0) {
      return undefined;
    }

    return tokens[0];
  }

  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<TokenWithRoles[]> {
    const tokenList = await this.indexerService.getTokensWithRolesForAddress(address, filter, pagination);

    const allTokens = await this.getAllTokens();

    const result: TokenWithRoles[] = [];

    for (const item of tokenList) {
      const token = allTokens.find(x => x.identifier === item.identifier);
      if (token) {
        this.applyTickerFromAssets(token);

        const resultItem = ApiUtils.mergeObjects(new TokenWithRoles(), token);
        if (item.roles) {
          const addressRoles = Object.keys(item.roles).filter(key => item.roles[key].includes(address));

          if (!item.roles['ESDTTransferRole']) {
            resultItem.canTransfer = true;
          }

          resultItem.role = new TokenRoles({
            canLocalMint: token.type === TokenType.FungibleESDT ? addressRoles.includes('ESDTRoleLocalMint') : undefined,
            canLocalBurn: token.type === TokenType.FungibleESDT ? addressRoles.includes('ESDTRoleLocalBurn') : undefined,
            canAddQuantity: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTAddQuantity') : undefined,
            canAddUri: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTAddURI') : undefined,
            canCreate: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTCreate') : undefined,
            canBurn: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTBurn') : undefined,
            canUpdateAttributes: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTUpdateAttributes') : undefined,
            canTransfer: resultItem.canTransfer === false ? addressRoles.includes('ESDTTransferRole') : undefined,
            roles: addressRoles,
          });

          // temporary, until we enforce deprecation for roles on the root element
          const clonedRoles = new TokenRoles(resultItem.role);
          // @ts-ignore
          delete clonedRoles.roles;
          delete clonedRoles.canTransfer;

          Object.assign(resultItem, clonedRoles);
        }

        result.push(resultItem);
      }
    }

    return result;
  }

  private async getLogo(identifier: string): Promise<TokenLogo | undefined> {
    const assets = await this.assetsService.getTokenAssets(identifier);
    if (!assets) {
      return;
    }

    return new TokenLogo({ pngUrl: assets.pngUrl, svgUrl: assets.svgUrl });
  }

  async getLogoPng(identifier: string): Promise<string | undefined> {
    const logo = await this.getLogo(identifier);
    if (!logo) {
      return;
    }

    return logo.pngUrl;
  }

  async getLogoSvg(identifier: string): Promise<string | undefined> {
    const logo = await this.getLogo(identifier);
    if (!logo) {
      return;
    }

    return logo.svgUrl;
  }

  async getTokenMarketCap(): Promise<number> {
    return await this.cachingService.getOrSet(
      CacheInfo.TokenMarketCap.key,
      async () => await this.getTokenMarketCapRaw(),
      CacheInfo.TokenMarketCap.ttl,
    );
  }

  async getTokenMarketCapRaw(): Promise<number> {
    let totalMarketCap = 0;

    const tokens = await this.getAllTokens();
    for (const token of tokens) {
      if (token.price && token.marketCap && !token.isLowLiquidity) {
        totalMarketCap += token.marketCap;
      }
    }

    return totalMarketCap;
  }

  async getAllTokens(): Promise<TokenDetailed[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.AllEsdtTokens.key,
      async () => await this.getAllTokensRaw(),
      CacheInfo.AllEsdtTokens.ttl,
    );
  }

  async getAllTokensRaw(): Promise<TokenDetailed[]> {
    if (this.apiConfigService.isTokensFetchFeatureEnabled()) {
      return await this.getAllTokensFromApi();
    }

    this.logger.log(`Starting to fetch all tokens`);
    const tokensProperties = await this.esdtService.getAllFungibleTokenProperties();
    let tokens = tokensProperties.map(properties => ApiUtils.mergeObjects(new TokenDetailed(), properties));

    this.logger.log(`Fetched ${tokens.length} fungible tokens`);

    for (const token of tokens) {
      const assets = await this.assetsService.getTokenAssets(token.identifier);

      if (assets && assets.name) {
        token.name = assets.name;
      }

      token.type = TokenType.FungibleESDT;
    }

    this.logger.log(`Starting to fetch all meta tokens`);

    const collections = await this.collectionService.getNftCollections(new QueryPagination({ from: 0, size: 10000 }), { type: [NftType.MetaESDT] });

    this.logger.log(`Fetched ${collections.length} meta tokens`);

    for (const collection of collections) {
      tokens.push(new TokenDetailed({
        type: TokenType.MetaESDT,
        subType: collection.subType,
        identifier: collection.collection,
        name: collection.name,
        timestamp: collection.timestamp,
        owner: collection.owner,
        decimals: collection.decimals,
        canFreeze: collection.canFreeze,
        canPause: collection.canPause,
        canTransferNftCreateRole: collection.canTransferNftCreateRole,
        canWipe: collection.canWipe,
        canAddSpecialRoles: collection.canAddSpecialRoles,
        canChangeOwner: collection.canChangeOwner,
        canUpgrade: collection.canUpgrade,
      }));
    }

    await this.batchProcessTokens(tokens);

    await this.applyMexLiquidity(tokens.filter(x => x.type !== TokenType.MetaESDT));
    await this.applyMexPrices(tokens.filter(x => x.type !== TokenType.MetaESDT));
    await this.applyMexPairType(tokens.filter(x => x.type !== TokenType.MetaESDT));
    await this.applyMexPairTradesCount(tokens.filter(x => x.type !== TokenType.MetaESDT));

    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.EsdtAssets(token.identifier).key,
      async token => await this.getTokenAssetsRaw(token.identifier),
      (token, assets) => token.assets = assets,
      CacheInfo.EsdtAssets('').ttl,
    );

    for (const token of tokens) {
      const priceSourcetype = token.assets?.priceSource?.type;

      if (priceSourcetype === TokenAssetsPriceSourceType.dataApi) {
        token.price = await this.dataApiService.getEsdtTokenPrice(token.identifier);
      } else if (priceSourcetype === TokenAssetsPriceSourceType.customUrl && token.assets?.priceSource?.url) {
        const pathToPrice = token.assets?.priceSource?.path ?? "0.usdPrice";
        const tokenData = await this.fetchTokenDataFromUrl(token.assets.priceSource.url, pathToPrice);

        if (tokenData) {
          token.price = tokenData;
        }
      }

      if (token.price) {
        const supply = await this.esdtService.getTokenSupply(token.identifier);
        token.supply = supply.totalSupply;
        token.circulatingSupply = supply.circulatingSupply;

        if (token.circulatingSupply) {
          token.marketCap = token.price * NumberUtils.denominateString(token.circulatingSupply, token.decimals);
        }
      }
    }

    tokens = tokens.sortedDescending(
      token => token.assets ? 1 : 0,
      token => token.isLowLiquidity ? 0 : (token.marketCap ?? 0),
      token => token.transactions ?? 0,
    );

    const egldToken = new TokenDetailed({
      identifier: this.egldIdentifierInMultiTransfer,
      name: 'EGLD',
      type: TokenType.FungibleESDT,
      assets: await this.assetsService.getTokenAssets(this.egldIdentifierInMultiTransfer),
      decimals: 18,
      isLowLiquidity: false,
      price: await this.dataApiService.getEgldPrice(),
      supply: '0',
      circulatingSupply: '0',
      marketCap: 0,
    });
    tokens = [...tokens, egldToken];

    return tokens;
  }

  private extractData(data: any, path: string): any {
    const keys = path.split('.');
    let result: any = data;

    for (const key of keys) {
      if (result === undefined || result === null) {
        return undefined;
      }

      result = !isNaN(Number(key)) ? result[Number(key)] : result[key];
    }

    return result;
  }

  private async fetchTokenDataFromUrl(url: string, path: string): Promise<any> {
    try {
      const result = await this.apiService.get(url);

      if (!result || !result.data) {
        this.logger.error(`Invalid response received from URL: ${url}`);
        return;
      }

      const extractedValue = this.extractData(result.data, path);
      if (!extractedValue) {
        this.logger.error(`No valid data found at URL: ${url}`);
        return;
      }

      return extractedValue;
    } catch (error) {
      this.logger.error(`Failed to fetch token data from URL: ${url}`, error);
    }
  }


  private async getTokenAssetsRaw(identifier: string): Promise<TokenAssets | undefined> {
    return await this.assetsService.getTokenAssets(identifier);
  }

  private async applyMexPairType(tokens: TokenDetailed[]): Promise<void> {
    try {
      const mexTokens = await this.mexTokenService.getAllMexTokenTypes();
      const mexTokensDictionary = mexTokens.toRecord<MexTokenType>(token => token.identifier);

      for (const token of tokens) {
        const mexTokenType = mexTokensDictionary[token.identifier];
        if (mexTokenType) {
          token.mexPairType = mexTokenType.type;
        }
      }
    } catch (error) {
      this.logger.error('Could not apply mex pair types');
      this.logger.error(error);
    }
  }

  private async batchProcessTokens(tokens: TokenDetailed[]) {
    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.TokenTransactions(token.identifier).key,
      async token => await this.getTotalTransactions(token),
      (token, result) => {
        token.transactions = result?.count;
        token.transactionsLastUpdatedAt = result?.lastUpdatedAt;
      },
      CacheInfo.TokenTransactions('').ttl,
      10,
    );

    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.TokenAccounts(token.identifier).key,
      async token => await this.getTotalAccounts(token),
      (token, result) => {
        token.accounts = result?.count;
        token.accountsLastUpdatedAt = result?.lastUpdatedAt;
      },
      CacheInfo.TokenAccounts('').ttl,
      10,
    );

    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.TokenTransfers(token.identifier).key,
      async token => await this.getTotalTransfers(token),
      (token, result) => {
        token.transfers = result?.count;
        token.transfersLastUpdatedAt = result?.lastUpdatedAt;
      },
      CacheInfo.TokenTransfers('').ttl,
      10,
    );
  }

  private async getAllTokensFromApi(): Promise<TokenDetailed[]> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getTokensFetchServiceUrl()}/tokens`, { params: { size: 10000 } });

      return data;
    } catch (error) {
      this.logger.error('An unhandled error occurred when getting tokens from API');
      this.logger.error(error);

      throw error;
    }
  }

  private async getTotalTransactions(token: TokenDetailed): Promise<{ count: number, lastUpdatedAt: number } | undefined> {
    try {
      const count = await this.transactionService.getTransactionCount(new TransactionFilter({tokens: [token.identifier, ...token.assets?.extraTokens ?? []]}));

      return {count, lastUpdatedAt: new Date().getTimeInSeconds()};
    } catch (error) {
      this.logger.error(`An unhandled error occurred when getting transaction count for token '${token.identifier}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  private async getTotalTransfers(token: TokenDetailed): Promise<{ count: number, lastUpdatedAt: number } | undefined> {
    try {
      const filter = new TransactionFilter({ tokens: [token.identifier, ...token.assets?.extraTokens ?? []] });
      const count = await this.transferService.getTransfersCount(filter);

      return { count, lastUpdatedAt: new Date().getTimeInSeconds() };
    } catch (error) {
      this.logger.error(`An unhandled error occurred when getting transfers count for token '${token.identifier}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  private async getTotalAccounts(token: TokenDetailed): Promise<{ count: number, lastUpdatedAt: number } | undefined> {
    let accounts = await this.cachingService.getRemote<number>(CacheInfo.TokenAccountsExtra(token.identifier).key);
    if (!accounts) {
      accounts = await this.getEsdtAccountsCount(token.identifier);
    }

    if (!accounts) {
      return undefined;
    }

    return { count: accounts, lastUpdatedAt: new Date().getTimeInSeconds() };
  }

  private async getEsdtAccountsCount(identifier: string): Promise<number | undefined> {
    try {
      return await this.indexerService.getEsdtAccountsCount(identifier);
    } catch (error) {
      this.logger.error(`An unhandled error occurred when getting account count for token '${identifier}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  private async applyMexLiquidity(tokens: TokenDetailed[]): Promise<void> {
    try {
      const pairs = await this.mexPairService.getAllMexPairs();
      const filteredPairs = pairs.filter(x => x.state === MexPairState.active);

      for (const token of tokens) {
        const pairs = filteredPairs.filter(x => x.baseId === token.identifier || x.quoteId === token.identifier);
        if (pairs.length > 0) {
          token.totalLiquidity = pairs.sum(x => x.totalValue / 2);
          token.totalVolume24h = pairs.sum(x => x.volume24h ?? 0);
        }
      }
    } catch (error) {
      this.logger.error('Could not apply mex liquidity');
      this.logger.error(error);
    }
  }

  private async applyMexPrices(tokens: TokenDetailed[]): Promise<void> {
    const LOW_LIQUIDITY_THRESHOLD = 0.005;

    try {
      const indexedTokens = await this.mexTokenService.getMexPricesRaw();
      for (const token of tokens) {
        const price = indexedTokens[token.identifier];
        if (price) {
          const supply = await this.esdtService.getTokenSupply(token.identifier);

          if (token.assets && token.identifier.split('-')[0] === 'EGLDUSDC') {
            price.price = price.price / (10 ** 12) * 2;
          }

          if (price.isToken) {
            token.price = price.price;
            token.marketCap = price.price * NumberUtils.denominateString(supply.circulatingSupply, token.decimals);

            if (token.totalLiquidity && token.marketCap && (token.totalLiquidity / token.marketCap < LOW_LIQUIDITY_THRESHOLD)) {
              token.isLowLiquidity = true;
              token.lowLiquidityThresholdPercent = LOW_LIQUIDITY_THRESHOLD * 100;
            }
          }

          token.supply = supply.totalSupply;
          token.circulatingSupply = supply.circulatingSupply;
        }
      }
    } catch (error) {
      this.logger.error('Could not apply mex tokens prices');
      this.logger.error(error);
    }
  }

  private async applyMexPairTradesCount(tokens: TokenDetailed[]): Promise<void> {
    if (!tokens.length) {
      return;
    }

    try {
      const pairs = await this.mexPairService.getAllMexPairs();
      const filteredPairs = pairs.filter(x => x.state === MexPairState.active);

      if (!filteredPairs.length) {
        return;
      }

      for (const token of tokens) {
        const tokenPairs = filteredPairs.filter(x => x.baseId === token.identifier || x.quoteId === token.identifier);

        if (tokenPairs.length > 0) {
          token.tradesCount = tokenPairs.sum(tokenPair => tokenPair.tradesCount ?? 0);
        }
      }

    } catch (error) {
      this.logger.error('Could not apply mex trades count');
      this.logger.error(error);
    }
  }
}
