export class AccountFetchOptions {
  constructor(init?: Partial<AccountFetchOptions>) {
    Object.assign(this, init);
  }

  withGuardianInfo?: boolean;
  withTxCount?: boolean;
  withScrCount?: boolean;
  withTimestamp?: boolean;
  withAssets?: boolean;
}
