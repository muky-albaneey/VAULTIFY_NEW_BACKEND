import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity';
import { WalletTransaction, TransactionDirection, TransactionPurpose, TransactionStatus } from '../../entities/wallet-transaction.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { PaymentProvider } from '../../entities/payment-provider.entity';
import { v4 as uuidv4 } from 'uuid';

export interface TopUpWalletDto {
  amount: number;
  payment_method: 'paystack' | 'card' | 'transfer';
}

export interface WalletTransferDto {
  recipient_user_id: string;
  amount: number;
  purpose: string;
}

export interface WalletTransactionHistoryDto {
  page?: number;
  limit?: number;
  purpose?: 'top_up' | 'subscription_payment' | 'utility_payment' | 'refund' | 'transfer';
  direction?: 'credit' | 'debit';
  status?: 'pending' | 'success' | 'failed';
}

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentProvider)
    private paymentProviderRepository: Repository<PaymentProvider>,
    private dataSource: DataSource,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
      relations: ['transactions'],
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = this.walletRepository.create({
        user_id: userId,
        available_balance: 0,
      });
      wallet = await this.walletRepository.save(wallet);
    }

    // Calculate balance from transactions
    const balance = await this.calculateBalance(wallet.wallet_id);
    wallet.available_balance = balance;

    return wallet;
  }

  async getTransactionHistory(userId: string, filters: WalletTransactionHistoryDto) {
    const wallet = await this.getWallet(userId);
    const { page = 1, limit = 20, purpose, direction, status } = filters;
    const offset = (page - 1) * limit;

    const queryBuilder = this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.wallet_id = :walletId', { walletId: wallet.wallet_id })
      .orderBy('transaction.created_at', 'DESC')
      .skip(offset)
      .take(limit);

    if (purpose) {
      queryBuilder.andWhere('transaction.purpose = :purpose', { purpose });
    }

    if (direction) {
      queryBuilder.andWhere('transaction.direction = :direction', { direction });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async topUpWallet(userId: string, topUpData: TopUpWalletDto) {
    const { amount, payment_method } = topUpData;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.getWallet(userId);
    const reference = `TOPUP_${uuidv4()}`;

    // Create payment record
    const paymentProvider = await this.paymentProviderRepository.findOne({
      where: { name: payment_method.toUpperCase() },
    });

    if (!paymentProvider) {
      throw new NotFoundException('Payment provider not found');
    }

    const payment = this.paymentRepository.create({
      user_id: userId,
      amount,
      currency: 'NGN',
      provider_id: paymentProvider.provider_id,
      reference,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepository.save(payment);

    // For Paystack, you would integrate with their API here
    // For now, we'll simulate a successful payment
    if (payment_method === 'paystack') {
      // Simulate Paystack integration
      payment.status = PaymentStatus.SUCCESS;
      payment.paid_at = new Date();
      await this.paymentRepository.save(payment);

      // Create wallet transaction
      await this.createWalletTransaction(
        wallet.wallet_id,
        amount,
        TransactionDirection.CREDIT,
        TransactionPurpose.TOP_UP,
        reference,
        TransactionStatus.SUCCESS,
      );
    }

    return {
      payment_id: payment.payment_id,
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      payment_url: payment_method === 'paystack' ? `https://paystack.com/pay/${reference}` : null,
    };
  }

  async transferToUser(userId: string, transferData: WalletTransferDto) {
    const { recipient_user_id, amount, purpose } = transferData;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (userId === recipient_user_id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const senderWallet = await this.getWallet(userId);
    const recipientWallet = await this.getWallet(recipient_user_id);

    if (senderWallet.available_balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const reference = `TRANSFER_${uuidv4()}`;

    // Use transaction to ensure atomicity
    await this.dataSource.transaction(async (manager) => {
      // Debit sender
      await this.createWalletTransaction(
        senderWallet.wallet_id,
        amount,
        TransactionDirection.DEBIT,
        TransactionPurpose.TRANSFER,
        `${reference}_DEBIT`,
        TransactionStatus.SUCCESS,
        manager,
      );

      // Credit recipient
      await this.createWalletTransaction(
        recipientWallet.wallet_id,
        amount,
        TransactionDirection.CREDIT,
        TransactionPurpose.TRANSFER,
        `${reference}_CREDIT`,
        TransactionStatus.SUCCESS,
        manager,
      );
    });

    return {
      reference,
      amount,
      recipient_user_id,
      purpose,
      status: 'success',
    };
  }

  async debitWallet(userId: string, amount: number, purpose: TransactionPurpose, reference?: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.available_balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const transactionReference = reference || `DEBIT_${uuidv4()}`;

    await this.createWalletTransaction(
      wallet.wallet_id,
      amount,
      TransactionDirection.DEBIT,
      purpose,
      transactionReference,
      TransactionStatus.SUCCESS,
    );

    return {
      reference: transactionReference,
      amount,
      purpose,
      status: 'success',
    };
  }

  async creditWallet(userId: string, amount: number, purpose: TransactionPurpose, reference?: string) {
    const wallet = await this.getWallet(userId);
    const transactionReference = reference || `CREDIT_${uuidv4()}`;

    await this.createWalletTransaction(
      wallet.wallet_id,
      amount,
      TransactionDirection.CREDIT,
      purpose,
      transactionReference,
      TransactionStatus.SUCCESS,
    );

    return {
      reference: transactionReference,
      amount,
      purpose,
      status: 'success',
    };
  }

  private async calculateBalance(walletId: string): Promise<number> {
    const result = await this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(CASE WHEN direction = :credit THEN amount ELSE -amount END)', 'balance')
      .where('transaction.wallet_id = :walletId', { walletId })
      .andWhere('transaction.status = :status', { status: TransactionStatus.SUCCESS })
      .setParameter('credit', TransactionDirection.CREDIT)
      .getRawOne();

    return parseFloat(result.balance) || 0;
  }

  private async createWalletTransaction(
    walletId: string,
    amount: number,
    direction: TransactionDirection,
    purpose: TransactionPurpose,
    reference: string,
    status: TransactionStatus,
    manager?: any,
  ) {
    const transaction = this.walletTransactionRepository.create({
      wallet_id: walletId,
      amount,
      direction,
      purpose,
      reference,
      status,
    });

    if (manager) {
      return await manager.save(WalletTransaction, transaction);
    } else {
      return await this.walletTransactionRepository.save(transaction);
    }
  }
}
