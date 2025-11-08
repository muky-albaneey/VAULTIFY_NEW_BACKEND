import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { PaymentProvider } from '../../entities/payment-provider.entity';
import { WalletTransaction, TransactionDirection, TransactionPurpose, TransactionStatus } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { Subscription, SubscriptionStatus } from '../../entities/subscription.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface InitiatePaymentDto {
  amount: number;
  currency?: string;
  payment_method: 'paystack' | 'card' | 'transfer';
  purpose: string;
  metadata?: any;
}

export interface PaymentWebhookDto {
  event: string;
  data: any;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentProvider)
    private paymentProviderRepository: Repository<PaymentProvider>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private configService: ConfigService,
  ) {}

  async initiatePayment(userId: string, paymentData: InitiatePaymentDto) {
    const { amount, currency = 'NGN', payment_method, purpose, metadata } = paymentData;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const paymentProvider = await this.paymentProviderRepository.findOne({
      where: { name: payment_method.toUpperCase() },
    });

    if (!paymentProvider) {
      throw new NotFoundException('Payment provider not found');
    }

    const reference = `PAY_${uuidv4()}`;

    const payment = this.paymentRepository.create({
      user_id: userId,
      amount,
      currency,
      provider_id: paymentProvider.provider_id,
      reference,
      status: PaymentStatus.PENDING,
      raw_payload: metadata,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Generate payment URL based on provider
    let paymentUrl = null;
    if (payment_method === 'paystack') {
      paymentUrl = await this.generatePaystackPaymentUrl(savedPayment);
    }

    return {
      payment_id: savedPayment.payment_id,
      reference: savedPayment.reference,
      amount: savedPayment.amount,
      currency: savedPayment.currency,
      status: savedPayment.status,
      payment_url: paymentUrl,
    };
  }

  async verifyPayment(reference: string) {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: ['provider'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify with payment provider
    if (payment.provider.name === 'PAYSTACK') {
      const isVerified = await this.verifyPaystackPayment(reference);
      if (isVerified) {
        payment.status = PaymentStatus.SUCCESS;
        payment.paid_at = new Date();
        await this.paymentRepository.save(payment);

        // Handle different payment purposes
        if (payment.raw_payload?.purpose === 'wallet_topup') {
          await this.creditWalletFromPayment(payment);
        } else if (payment.raw_payload?.purpose === 'service_charge_payment' || payment.raw_payload?.purpose === 'subscription_payment') {
          // Activate subscription if payment is for subscription
          await this.activateSubscriptionFromPayment(payment);
        }
      }
    }

    return payment;
  }

  async handleWebhook(webhookData: PaymentWebhookDto) {
    const { event, data } = webhookData;

    if (event === 'charge.success' && data.reference) {
      const payment = await this.paymentRepository.findOne({
        where: { reference: data.reference },
      });

      if (payment && payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.SUCCESS;
        payment.paid_at = new Date();
        payment.raw_payload = data;
        await this.paymentRepository.save(payment);

        // Handle different payment purposes
        if (payment.raw_payload?.purpose === 'wallet_topup') {
          await this.creditWalletFromPayment(payment);
        } else if (payment.raw_payload?.purpose === 'service_charge_payment' || payment.raw_payload?.purpose === 'subscription_payment') {
          // Activate subscription if payment is for subscription
          await this.activateSubscriptionFromPayment(payment);
        }
      }
    }

    return { status: 'success' };
  }

  async getPaymentHistory(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { user_id: userId },
      relations: ['provider'],
      order: { payment_id: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPaymentById(paymentId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: paymentId },
      relations: ['provider'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  private async generatePaystackPaymentUrl(payment: Payment): Promise<string> {
    // This would integrate with Paystack API
    // For now, return a mock URL
    return `https://paystack.com/pay/${payment.reference}`;
  }

  private async verifyPaystackPayment(reference: string): Promise<boolean> {
    // This would integrate with Paystack API to verify payment
    // For now, return true for testing
    return true;
  }

  private async creditWalletFromPayment(payment: Payment) {
    const wallet = await this.walletRepository.findOne({
      where: { user_id: payment.user_id },
    });

    if (wallet) {
      const transaction = this.walletTransactionRepository.create({
        wallet_id: wallet.wallet_id,
        amount: payment.amount,
        direction: TransactionDirection.CREDIT,
        purpose: TransactionPurpose.TOP_UP,
        reference: `PAYMENT_${payment.reference}`,
        status: TransactionStatus.SUCCESS,
      });

      await this.walletTransactionRepository.save(transaction);
    }
  }

  /**
   * Activate subscription when payment is confirmed
   */
  private async activateSubscriptionFromPayment(payment: Payment) {
    // Find pending subscription linked to this payment
    const subscription = await this.subscriptionRepository.findOne({
      where: { last_renewal_payment_id: payment.payment_id, status: SubscriptionStatus.PENDING },
      relations: ['plan'],
    });

    if (subscription && payment.status === PaymentStatus.SUCCESS) {
      subscription.status = SubscriptionStatus.ACTIVE;
      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Sync user profile subscription status
      await this.syncUserProfileSubscription(payment.user_id, updatedSubscription);
    }
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
}
