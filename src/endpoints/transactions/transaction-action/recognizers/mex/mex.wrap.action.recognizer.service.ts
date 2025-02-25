import { Injectable } from "@nestjs/common";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionEsdtNftRecognizerService } from "../esdt/transaction.action.esdt.nft.recognizer.service";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "../../../../mex/entities/mex.settings";
import { MexSettingsService } from "../../../../mex/mex.settings.service";
import { NumberUtils } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class MexWrapActionRecognizerService {
  constructor(
    private readonly transactionActionEsdtNftRecognizerService: TransactionActionEsdtNftRecognizerService,
    private readonly mexSettingsService: MexSettingsService,
  ) { }

  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (!settings.wrapContracts.includes(metadata.receiver)) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.wrapEgld:
        return this.getWrapAction(metadata);
      case MexFunction.unwrapEgld:
        return this.getUnwrapAction(metadata);
      default:
        return undefined;
    }
  }

  private getWrapAction(metadata: TransactionMetadata): TransactionAction | undefined {
    const wegldId = this.mexSettingsService.getWegldId();
    if (!wegldId) {
      return undefined;
    }

    const valueDenominated = NumberUtils.toDenominatedString(metadata.value);


    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.wrapEgld;
    result.description = `Wrap ${valueDenominated} EGLD`;
    result.arguments = {
      transfers: [
        {
          type: 'EGLD',
          name: 'EGLD',
          token: 'EGLD',
          ticker: 'EGLD',
          decimals: 18,
          value: metadata.value.toString(),
        },
        {
          type: EsdtType.FungibleESDT,
          name: 'WrappedEGLD',
          token: wegldId,
          ticker: wegldId.split('-')[0],
          decimals: 18,
          value: metadata.value.toString(),
        },
      ],
      receiver: metadata.receiver,
    };

    return result;
  }

  private getUnwrapAction(metadata: TransactionMetadata): TransactionAction | undefined {
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferActionWithTicker(metadata, TransactionActionCategory.mex, MexFunction.unwrapEgld, 'Unwrap');
  }
}
