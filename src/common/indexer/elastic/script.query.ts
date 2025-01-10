import { AbstractQuery } from "@multiversx/sdk-nestjs-elastic";

// TODO: remove this and use ScriptQuery from sdk-nestjs when PR #247 is merged
export class ScriptQuery extends AbstractQuery {
  constructor(
    private readonly source: string | undefined,
  ) {
    super();
  }

  getQuery(): any {
    return { script: { script: { source: this.source, lang: 'painless' } } };
  }
}
