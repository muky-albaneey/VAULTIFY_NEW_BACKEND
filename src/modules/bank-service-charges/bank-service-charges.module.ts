import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BankServiceChargeController } from './bank-service-charges.controller';
import { BankServiceChargeService } from './bank-service-charges.service';
import { BankServiceCharge } from '../../entities/bank-service-charge.entity';
import { BankServiceChargeFile } from '../../entities/bank-service-charge-file.entity';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { WalletTransaction } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankServiceCharge,
      BankServiceChargeFile,
      User,
      Payment,
      WalletTransaction,
      Wallet,
    ]),
    WalletsModule,
    PaymentsModule,
  ],
  controllers: [BankServiceChargeController],
  providers: [BankServiceChargeService],
  exports: [BankServiceChargeService],
})
export class BankServiceChargeModule {}
