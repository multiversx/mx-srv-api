import { Module } from "@nestjs/common";
import { PoolService } from "./pool.service";
import { TransactionActionModule } from "../transactions/transaction-action/transaction.action.module";

@Module({
  imports: [
    TransactionActionModule,
  ],
  providers: [
    PoolService,
  ],
  exports: [
    PoolService,
  ],
})

export class PoolModule { }
