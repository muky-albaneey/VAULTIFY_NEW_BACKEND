import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from '../../entities/subscription.entity';
import { Plan } from '../../entities/plan.entity';
import { FamilyGroup } from '../../entities/family-group.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { Payment } from '../../entities/payment.entity';
import { WalletTransaction } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Plan,
      FamilyGroup,
      FamilyMember,
      Payment,
      WalletTransaction,
      Wallet,
    ]),
    WalletsModule,
    PaymentsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
