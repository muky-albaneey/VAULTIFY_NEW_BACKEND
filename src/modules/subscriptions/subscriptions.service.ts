import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { Plan, PlanType } from '../../entities/plan.entity';
import { FamilyGroup } from '../../entities/family-group.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { WalletTransaction, TransactionDirection, TransactionPurpose, TransactionStatus } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { WalletsService } from '../wallets/wallets.service';
import { PaymentsService } from '../payments/payments.service';
import { v4 as uuidv4 } from 'uuid';

export interface ActivateSubscriptionDto {
  plan_id: string;
  payment_method: 'wallet' | 'external';
}

export interface AddFamilyMemberDto {
  user_id: string;
}

export interface RemoveFamilyMemberDto {
  user_id: string;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(FamilyGroup)
    private familyGroupRepository: Repository<FamilyGroup>,
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private walletsService: WalletsService,
    private paymentsService: PaymentsService,
    private dataSource: DataSource,
  ) {}

  async getActiveSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user_id: userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    return subscription;
  }

  async getAllSubscriptions(userId: string) {
    return await this.subscriptionRepository.find({
      where: { user_id: userId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  async getAvailablePlans() {
    return await this.planRepository.find({
      where: { is_active: true },
      order: { price_ngn: 'ASC' },
    });
  }

  async activateSubscription(userId: string, activationData: ActivateSubscriptionDto) {
    const { plan_id, payment_method } = activationData;

    const plan = await this.planRepository.findOne({ where: { plan_id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.is_active) {
      throw new BadRequestException('Plan is not active');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.getActiveSubscription(userId);
    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (plan.billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    let payment: Payment | null = null;

    if (payment_method === 'wallet') {
      // Debit wallet
      await this.walletsService.debitWallet(
        userId,
        plan.price_ngn,
        TransactionPurpose.SUBSCRIPTION_PAYMENT,
      );

      // Create payment record
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: plan.price_ngn,
        currency: 'NGN',
        provider_id: 'wallet', // This should be a proper provider ID
        reference: `SUB_${uuidv4()}`,
        status: PaymentStatus.SUCCESS,
        paid_at: new Date(),
      });

      payment = await this.paymentRepository.save(payment);
    } else {
      // External payment - create pending payment
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: plan.price_ngn,
        currency: 'NGN',
        provider_id: 'external', // This should be a proper provider ID
        reference: `SUB_${uuidv4()}`,
        status: PaymentStatus.PENDING,
      });

      payment = await this.paymentRepository.save(payment);
    }

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      user_id: userId,
      plan_id: plan.plan_id,
      status: payment_method === 'wallet' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      start_date: startDate,
      end_date: endDate,
      last_renewal_payment_id: payment.payment_id,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // If it's a family plan, create family group
    if (plan.type === PlanType.FAMILY) {
      await this.createFamilyGroup(userId, plan.plan_id);
    }

    return {
      subscription: savedSubscription,
      payment: payment,
      payment_url: payment_method === 'external' ? `https://paystack.com/pay/${payment.reference}` : null,
    };
  }

  async renewSubscription(userId: string, payment_method: 'wallet' | 'external') {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const plan = await this.planRepository.findOne({ where: { plan_id: subscription.plan_id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Calculate new end date
    const newEndDate = new Date(subscription.end_date);
    if (plan.billing_cycle === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    let payment: Payment | null = null;

    if (payment_method === 'wallet') {
      // Debit wallet
      await this.walletsService.debitWallet(
        userId,
        plan.price_ngn,
        TransactionPurpose.SUBSCRIPTION_PAYMENT,
      );

      // Create payment record
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: plan.price_ngn,
        currency: 'NGN',
        provider_id: 'wallet',
        reference: `RENEW_${uuidv4()}`,
        status: PaymentStatus.SUCCESS,
        paid_at: new Date(),
      });

      payment = await this.paymentRepository.save(payment);

      // Update subscription
      subscription.end_date = newEndDate;
      subscription.last_renewal_payment_id = payment.payment_id;
      await this.subscriptionRepository.save(subscription);
    } else {
      // External payment
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: plan.price_ngn,
        currency: 'NGN',
        provider_id: 'external',
        reference: `RENEW_${uuidv4()}`,
        status: PaymentStatus.PENDING,
      });

      payment = await this.paymentRepository.save(payment);
    }

    return {
      subscription: subscription,
      payment: payment,
      payment_url: payment_method === 'external' ? `https://paystack.com/pay/${payment.reference}` : null,
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    await this.subscriptionRepository.save(subscription);

    return { message: 'Subscription canceled successfully' };
  }

  async getFamilyGroup(userId: string) {
    const familyGroup = await this.familyGroupRepository.findOne({
      where: { head_user_id: userId },
      relations: ['members', 'members.user', 'plan'],
    });

    return familyGroup;
  }

  async addFamilyMember(userId: string, memberData: AddFamilyMemberDto) {
    const { user_id: memberUserId } = memberData;

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { head_user_id: userId },
      relations: ['members', 'plan'],
    });

    if (!familyGroup) {
      throw new NotFoundException('Family group not found');
    }

    if (familyGroup.members.length >= familyGroup.plan.max_members) {
      throw new BadRequestException('Family group is at maximum capacity');
    }

    // Check if user is already a member
    const existingMember = await this.familyMemberRepository.findOne({
      where: { family_group_id: familyGroup.family_group_id, user_id: memberUserId },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a family member');
    }

    const familyMember = this.familyMemberRepository.create({
      family_group_id: familyGroup.family_group_id,
      user_id: memberUserId,
      added_by_user_id: userId,
      is_head: false,
    });

    return await this.familyMemberRepository.save(familyMember);
  }

  async removeFamilyMember(userId: string, memberData: RemoveFamilyMemberDto) {
    const { user_id: memberUserId } = memberData;

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { head_user_id: userId },
    });

    if (!familyGroup) {
      throw new NotFoundException('Family group not found');
    }

    const familyMember = await this.familyMemberRepository.findOne({
      where: { family_group_id: familyGroup.family_group_id, user_id: memberUserId },
    });

    if (!familyMember) {
      throw new NotFoundException('Family member not found');
    }

    if (familyMember.is_head) {
      throw new BadRequestException('Cannot remove the head of the family group');
    }

    await this.familyMemberRepository.remove(familyMember);

    return { message: 'Family member removed successfully' };
  }

  private async createFamilyGroup(userId: string, planId: string) {
    const familyGroup = this.familyGroupRepository.create({
      head_user_id: userId,
      plan_id: planId,
    });

    const savedGroup = await this.familyGroupRepository.save(familyGroup);

    // Add head user as family member
    const headMember = this.familyMemberRepository.create({
      family_group_id: savedGroup.family_group_id,
      user_id: userId,
      added_by_user_id: userId,
      is_head: true,
    });

    await this.familyMemberRepository.save(headMember);

    return savedGroup;
  }
}
