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
import { UserProfile } from '../../entities/user-profile.entity';
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

export interface GrantFreeSubscriptionDto {
  user_id: string;
  plan_id: string;
  duration_days: number;
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
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private walletsService: WalletsService,
    private paymentsService: PaymentsService,
    private dataSource: DataSource,
  ) {}

  async getActiveSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user_id: userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    if (!subscription) {
      return null;
    }

    // Check if subscription has expired
    const checkedSubscription = await this.checkSubscriptionExpiration(subscription);
    
    // If expired, return null
    if (checkedSubscription && checkedSubscription.status === SubscriptionStatus.EXPIRED) {
      return null;
    }

    return checkedSubscription;
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

    // Check if user is a family member (not head) - they pay member price
    const familyMembership = await this.familyMemberRepository.findOne({
      where: { user_id: userId, is_head: false },
      relations: ['familyGroup', 'familyGroup.plan'],
    });

    let actualPrice = Number(plan.price_ngn);
    let isFamilyMember = false;

    if (familyMembership && familyMembership.familyGroup.plan.plan_id === plan_id) {
      // User is a family member activating their member subscription
      // Member pays half of head price
      actualPrice = Number(plan.price_ngn) / 2;
      isFamilyMember = true;
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.getActiveSubscription(userId);
    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Check if there's a pending subscription (created when added as family member)
    const pendingSubscription = await this.subscriptionRepository.findOne({
      where: { user_id: userId, plan_id: plan_id, status: SubscriptionStatus.PENDING },
    });

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
      // Debit wallet with actual price (member price if family member)
      await this.walletsService.debitWallet(
        userId,
        actualPrice,
        TransactionPurpose.SUBSCRIPTION_PAYMENT,
      );

      // Create payment record
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: actualPrice,
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
        amount: actualPrice,
        currency: 'NGN',
        provider_id: 'external', // This should be a proper provider ID
        reference: `SUB_${uuidv4()}`,
        status: PaymentStatus.PENDING,
      });

      payment = await this.paymentRepository.save(payment);
    }

    // Update existing pending subscription or create new one
    let subscription: Subscription;
    if (pendingSubscription) {
      // Update pending subscription created when member was added
      pendingSubscription.status = payment_method === 'wallet' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING;
      pendingSubscription.start_date = startDate;
      pendingSubscription.end_date = endDate;
      pendingSubscription.last_renewal_payment_id = payment.payment_id;
      subscription = await this.subscriptionRepository.save(pendingSubscription);
    } else {
      // Create new subscription
      subscription = this.subscriptionRepository.create({
        user_id: userId,
        plan_id: plan.plan_id,
        status: payment_method === 'wallet' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
        start_date: startDate,
        end_date: endDate,
        last_renewal_payment_id: payment.payment_id,
      });
      subscription = await this.subscriptionRepository.save(subscription);
    }

    // Sync user profile subscription status
    await this.syncUserProfileSubscription(userId, subscription);

    // If it's a family plan and user is NOT a member (i.e., they're the head), create family group
    if (plan.type === PlanType.FAMILY && !isFamilyMember) {
      await this.createFamilyGroup(userId, plan.plan_id);
    }

    return {
      subscription: subscription,
      payment: payment,
      payment_url: payment_method === 'external' ? `https://paystack.com/pay/${payment.reference}` : null,
      is_family_member: isFamilyMember,
      price_paid: actualPrice,
      head_price: Number(plan.price_ngn),
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

    // Check if user is a family member (not head) - they pay member price
    const familyMembership = await this.familyMemberRepository.findOne({
      where: { user_id: userId, is_head: false },
      relations: ['familyGroup', 'familyGroup.plan'],
    });

    let actualPrice = Number(plan.price_ngn);
    let isFamilyMember = false;

    if (familyMembership && familyMembership.familyGroup.plan.plan_id === plan.plan_id) {
      // User is a family member renewing their member subscription
      // Member pays half of head price
      actualPrice = Number(plan.price_ngn) / 2;
      isFamilyMember = true;
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
      // Debit wallet with actual price (member price if family member)
      await this.walletsService.debitWallet(
        userId,
        actualPrice,
        TransactionPurpose.SUBSCRIPTION_PAYMENT,
      );

      // Create payment record
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: actualPrice,
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
      subscription.expired_date = null; // Clear expired date on renewal
      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Sync user profile subscription status
      await this.syncUserProfileSubscription(userId, updatedSubscription);
    } else {
      // External payment
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: actualPrice,
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
      is_family_member: isFamilyMember,
      price_paid: actualPrice,
      head_price: Number(plan.price_ngn),
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.status = SubscriptionStatus.CANCELED;
    const canceledSubscription = await this.subscriptionRepository.save(subscription);

    // Sync user profile subscription status (set isSubscribe to false)
    await this.syncUserProfileSubscription(userId, canceledSubscription);

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

    // Check if member already has an active subscription
    const existingSubscription = await this.getActiveSubscription(memberUserId);
    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription. They must cancel it first to join family plan.');
    }

    // Calculate member price (half of head price)
    const memberPrice = Number(familyGroup.plan.price_ngn) / 2;

    // Create family member record
    const familyMember = this.familyMemberRepository.create({
      family_group_id: familyGroup.family_group_id,
      user_id: memberUserId,
      added_by_user_id: userId,
      is_head: false,
    });

    const savedMember = await this.familyMemberRepository.save(familyMember);

    // Create subscription for the member with member pricing
    // Note: Member needs to pay separately - this creates a pending subscription
    const startDate = new Date();
    const endDate = new Date();
    
    if (familyGroup.plan.billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create pending subscription for member (they need to pay)
    const memberSubscription = this.subscriptionRepository.create({
      user_id: memberUserId,
      plan_id: familyGroup.plan.plan_id,
      status: SubscriptionStatus.PENDING,
      start_date: startDate,
      end_date: endDate,
      expired_date: null,
      is_free_subscription: false,
    });

    await this.subscriptionRepository.save(memberSubscription);

    return {
      ...savedMember,
      subscription_required: true,
      member_price: memberPrice,
      billing_cycle: familyGroup.plan.billing_cycle,
      message: 'Family member added. Member must activate their subscription by paying ₦' + memberPrice.toFixed(2) + ' (' + familyGroup.plan.billing_cycle + ')',
    };
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

  /**
   * Sync user profile subscription status with actual subscription
   */
  private async syncUserProfileSubscription(userId: string, subscription: Subscription) {
    const profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile) {
      return;
    }

    // Check if subscription is actually active (status is ACTIVE and not expired)
    const now = new Date();
    const isActive = subscription.status === SubscriptionStatus.ACTIVE && 
                     new Date(subscription.end_date) > now;

    // Update profile fields
    profile.isSubscribe = isActive;
    profile.subscription_start_date = subscription.start_date;
    profile.subscription_expiry_date = subscription.end_date;

    // If subscription expired, ensure isSubscribe is false
    if (!isActive) {
      profile.isSubscribe = false;
    }

    await this.userProfileRepository.save(profile);
  }

  /**
   * Check if a subscription has expired and update it if needed
   * Call this before checking subscription status
   */
  async checkSubscriptionExpiration(subscription: Subscription): Promise<Subscription | null> {
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      const now = new Date();
      if (new Date(subscription.end_date) <= now) {
        // Mark as expired
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.expired_date = subscription.expired_date || now; // Set expired_date if not already set
        const updatedSubscription = await this.subscriptionRepository.save(subscription);

        // Sync user profile (set isSubscribe to false)
        await this.syncUserProfileSubscription(subscription.user_id, updatedSubscription);

        return updatedSubscription;
      }
    }
    return subscription;
  }

  /**
   * Check and update expired subscriptions
   * This method should be called periodically (via cron job)
   */
  async checkAndUpdateExpiredSubscriptions() {
    const now = new Date();
    
    // Find all active subscriptions that have expired
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    const expiredUpdates = [];

    for (const subscription of expiredSubscriptions) {
      if (new Date(subscription.end_date) <= now) {
        // Mark as expired
        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.expired_date = subscription.expired_date || now; // Set expired_date if not already set
        const updatedSubscription = await this.subscriptionRepository.save(subscription);

        // Sync user profile (set isSubscribe to false)
        await this.syncUserProfileSubscription(subscription.user_id, updatedSubscription);

        expiredUpdates.push(subscription.subscription_id);
      }
    }

    return {
      checked: expiredSubscriptions.length,
      expired: expiredUpdates.length,
      subscription_ids: expiredUpdates,
    };
  }

  /**
   * Grant free subscription (Super Admin only)
   */
  async grantFreeSubscription(adminUserId: string, grantData: GrantFreeSubscriptionDto) {
    const { user_id, plan_id, duration_days } = grantData;

    // Verify plan exists
    const plan = await this.planRepository.findOne({ where: { plan_id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.getActiveSubscription(user_id);
    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription. Cancel it first.');
    }

    // Calculate subscription dates based on duration_days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration_days);

    // Create free subscription
    const subscription = this.subscriptionRepository.create({
      user_id,
      plan_id: plan.plan_id,
      status: SubscriptionStatus.ACTIVE,
      start_date: startDate,
      end_date: endDate,
      expired_date: null,
      granted_by_admin: adminUserId,
      is_free_subscription: true,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Sync user profile subscription status
    await this.syncUserProfileSubscription(user_id, savedSubscription);

    // If it's a family plan, create family group
    if (plan.type === PlanType.FAMILY) {
      await this.createFamilyGroup(user_id, plan.plan_id);
    }

    return savedSubscription;
  }
}
