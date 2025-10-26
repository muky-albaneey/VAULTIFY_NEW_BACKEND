import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UtilityBillsController } from './utility-bills.controller';
import { UtilityBillsService } from './utility-bills.service';
import { LencoService } from './lenco.service';
import { UtilityProvider } from '../../entities/utility-provider.entity';
import { UtilityAccount } from '../../entities/utility-account.entity';
import { UtilityBill } from '../../entities/utility-bill.entity';
import { UtilityPayment } from '../../entities/utility-payment.entity';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UtilityProvider,
      UtilityAccount,
      UtilityBill,
      UtilityPayment,
      Payment,
      User,
      Estate,
    ]),
    WalletsModule,
    PaymentsModule,
  ],
  controllers: [UtilityBillsController],
  providers: [UtilityBillsService, LencoService],
  exports: [UtilityBillsService, LencoService],
})
export class UtilityBillsModule {}
