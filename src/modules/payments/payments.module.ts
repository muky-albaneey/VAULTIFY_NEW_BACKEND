import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from '../../entities/payment.entity';
import { PaymentProvider } from '../../entities/payment-provider.entity';
import { WalletTransaction } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { Subscription } from '../../entities/subscription.entity';
import { UserProfile } from '../../entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentProvider,
      WalletTransaction,
      Wallet,
      Subscription,
      UserProfile,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
