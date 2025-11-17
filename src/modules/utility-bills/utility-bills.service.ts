import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UtilityProvider, UtilityCategory } from '../../entities/utility-provider.entity';
import { UtilityAccount } from '../../entities/utility-account.entity';
import { UtilityBill, BillStatus } from '../../entities/utility-bill.entity';
import { UtilityPayment } from '../../entities/utility-payment.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';
import { WalletsService } from '../wallets/wallets.service';
import { PaymentsService } from '../payments/payments.service';
import { LencoService, LencoBillPaymentRequest, LencoWebhookEvent } from './lenco.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUtilityAccountDto {
  estate_id: string;
  utility_provider_id: string;
  account_number: string;
  address: string;
  is_default?: boolean;
}

export interface UpdateUtilityAccountDto {
  account_number?: string;
  address?: string;
  is_default?: boolean;
}

export interface PayUtilityBillDto {
  payment_method: 'wallet' | 'external' | 'lenco';
  amount?: number;
}

export interface ValidateUtilityCustomerDto {
  product_id: string;
  customer_id: string;
}

export interface SyncLencoVendorsDto {
  force_sync?: boolean;
}

@Injectable()
export class UtilityBillsService {
  constructor(
    @InjectRepository(UtilityProvider)
    private utilityProviderRepository: Repository<UtilityProvider>,
    @InjectRepository(UtilityAccount)
    private utilityAccountRepository: Repository<UtilityAccount>,
    @InjectRepository(UtilityBill)
    private utilityBillRepository: Repository<UtilityBill>,
    @InjectRepository(UtilityPayment)
    private utilityPaymentRepository: Repository<UtilityPayment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    private walletsService: WalletsService,
    private paymentsService: PaymentsService,
    private lencoService: LencoService,
    private dataSource: DataSource,
  ) {}

  async getUtilityProviders() {
    return await this.utilityProviderRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getUserAccounts(userId: string) {
    return await this.utilityAccountRepository.find({
      where: { user_id: userId },
      relations: ['utilityProvider', 'estate'],
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  async createUtilityAccount(userId: string, createData: CreateUtilityAccountDto) {
    const { estate_id, utility_provider_id, account_number, address, is_default = false } = createData;

    // Verify utility provider exists
    const utilityProvider = await this.utilityProviderRepository.findOne({
      where: { utility_provider_id },
    });
    if (!utilityProvider) {
      throw new NotFoundException('Utility provider not found');
    }

    // Verify estate exists
    const estate = await this.estateRepository.findOne({ where: { estate_id } });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // If setting as default, unset other defaults for this user
    if (is_default) {
      await this.utilityAccountRepository.update(
        { user_id: userId },
        { is_default: false }
      );
    }

    const account = this.utilityAccountRepository.create({
      user_id: userId,
      estate_id,
      utility_provider_id,
      account_number,
      address,
      is_default,
    });

    return await this.utilityAccountRepository.save(account);
  }

  async updateUtilityAccount(userId: string, accountId: string, updateData: UpdateUtilityAccountDto) {
    const { account_number, address, is_default } = updateData;

    const account = await this.utilityAccountRepository.findOne({
      where: { utility_account_id: accountId, user_id: userId },
    });

    if (!account) {
      throw new NotFoundException('Utility account not found');
    }

    // If setting as default, unset other defaults for this user
    if (is_default) {
      await this.utilityAccountRepository.update(
        { user_id: userId },
        { is_default: false }
      );
    }

    Object.assign(account, updateData);
    return await this.utilityAccountRepository.save(account);
  }

  async deleteUtilityAccount(userId: string, accountId: string) {
    const account = await this.utilityAccountRepository.findOne({
      where: { utility_account_id: accountId, user_id: userId },
    });

    if (!account) {
      throw new NotFoundException('Utility account not found');
    }

    await this.utilityAccountRepository.remove(account);
    return { message: 'Utility account deleted successfully' };
  }

  async getAccountBills(accountId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [bills, total] = await this.utilityBillRepository.findAndCount({
      where: { utility_account_id: accountId },
      order: { generated_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: bills,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBillById(billId: string) {
    const bill = await this.utilityBillRepository.findOne({
      where: { utility_bill_id: billId },
      relations: ['utilityAccount', 'utilityAccount.user', 'utilityAccount.utilityProvider', 'payments', 'payments.payment'],
    });

    if (!bill) {
      throw new NotFoundException('Utility bill not found');
    }

    return bill;
  }

  async payUtilityBill(userId: string, billId: string, paymentData: PayUtilityBillDto) {
    const { payment_method, amount } = paymentData;

    const bill = await this.utilityBillRepository.findOne({
      where: { utility_bill_id: billId },
      relations: ['utilityAccount'],
    });

    if (!bill) {
      throw new NotFoundException('Utility bill not found');
    }

    if (bill.utilityAccount.user_id !== userId) {
      throw new BadRequestException('You can only pay your own bills');
    }

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('Bill is already paid');
    }

    const paymentAmount = amount || bill.amount_due;

    if (paymentAmount > bill.amount_due) {
      throw new BadRequestException('Payment amount cannot exceed bill amount');
    }

    let payment: Payment | null = null;

    if (payment_method === 'wallet') {
      // Debit wallet
      await this.walletsService.debitWallet(
        userId,
        paymentAmount,
        'utility_payment' as any,
      );

      // Create payment record
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: paymentAmount,
        currency: 'NGN',
        provider_id: 'wallet', // This should be a proper provider ID
        reference: `UTIL_${uuidv4()}`,
        status: PaymentStatus.SUCCESS,
        paid_at: new Date(),
      });

      payment = await this.paymentRepository.save(payment);
    } else {
      // External payment
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: paymentAmount,
        currency: 'NGN',
        provider_id: 'external', // This should be a proper provider ID
        reference: `UTIL_${uuidv4()}`,
        status: PaymentStatus.PENDING,
      });

      payment = await this.paymentRepository.save(payment);
    }

    // Create utility payment record
    const utilityPayment = this.utilityPaymentRepository.create({
      utility_bill_id: billId,
      payment_id: payment.payment_id,
      amount: paymentAmount,
      paid_at: new Date(),
    });

    await this.utilityPaymentRepository.save(utilityPayment);

    // Update bill status if fully paid
    const totalPaid = await this.getTotalPaidAmount(billId);
    if (totalPaid >= bill.amount_due) {
      bill.status = BillStatus.PAID;
      await this.utilityBillRepository.save(bill);
    }

    return {
      utility_payment: utilityPayment,
      payment: payment,
      payment_url: payment_method === 'external' ? `https://paystack.com/pay/${payment.reference}` : null,
    };
  }

  async getUserBills(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const qb = this.utilityBillRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.utilityAccount', 'account')
      .leftJoinAndSelect('account.utilityProvider', 'provider')
      .leftJoinAndSelect('bill.payments', 'payments')
      .where('account.user_id = :userId', { userId })
      .orderBy('bill.generated_at', 'DESC')
      .skip(offset)
      .take(limit);

    const [bills, total] = await qb.getManyAndCount();

    return {
      data: bills,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async getTotalPaidAmount(billId: string): Promise<number> {
    const result = await this.utilityPaymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.utility_bill_id = :billId', { billId })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  // Lenco API Integration Methods
  async syncLencoVendors(syncData: SyncLencoVendorsDto) {
    const { force_sync = false } = syncData;

    try {
      // Get vendors from Lenco API
      const lencoVendors = await this.lencoService.getVendors();

      let syncedCount = 0;
      let updatedCount = 0;

      for (const lencoVendor of lencoVendors) {
        // Check if vendor already exists
        const existingProvider = await this.utilityProviderRepository.findOne({
          where: { 
            metadata: { lenco_vendor_id: lencoVendor.id }
          }
        });

        if (existingProvider && !force_sync) {
          continue; // Skip if exists and not forcing sync
        }

        const providerData = this.lencoService.mapVendorToUtilityProvider(lencoVendor);

        if (existingProvider) {
          // Update existing provider
          Object.assign(existingProvider, providerData);
          await this.utilityProviderRepository.save(existingProvider);
          updatedCount++;
        } else {
          // Create new provider
          const provider = this.utilityProviderRepository.create(providerData);
          await this.utilityProviderRepository.save(provider);
          syncedCount++;
        }
      }

      return {
        message: 'Lenco vendors synced successfully',
        synced_count: syncedCount,
        updated_count: updatedCount,
        total_vendors: lencoVendors.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to sync Lenco vendors: ${errorMessage}`);
    }
  }

  async getLencoProducts(vendorId?: string) {
    try {
      return await this.lencoService.getProducts(vendorId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to fetch Lenco products: ${errorMessage}`);
    }
  }

  async validateUtilityCustomer(validationData: ValidateUtilityCustomerDto) {
    const { product_id, customer_id } = validationData;

    try {
      const validation = await this.lencoService.validateCustomer(product_id, customer_id);
      return validation;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to validate customer details: ${errorMessage}`);
    }
  }

  async payUtilityBillWithLenco(userId: string, billId: string, paymentData: PayUtilityBillDto) {
    const { amount } = paymentData;

    const bill = await this.utilityBillRepository.findOne({
      where: { utility_bill_id: billId },
      relations: ['utilityAccount'],
    });

    if (!bill) {
      throw new NotFoundException('Utility bill not found');
    }

    if (bill.utilityAccount.user_id !== userId) {
      throw new BadRequestException('You can only pay your own bills');
    }

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('Bill is already paid');
    }

    const paymentAmount = amount || bill.amount_due;

    if (paymentAmount > bill.amount_due) {
      throw new BadRequestException('Payment amount cannot exceed bill amount');
    }

    try {
      // Get Lenco product ID from bill metadata
      const productId = bill.metadata?.lenco_product_id;
      if (!productId) {
        throw new BadRequestException('This bill is not configured for Lenco payment');
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        user_id: userId,
        amount: paymentAmount,
        currency: 'NGN',
        provider_id: 'lenco', // This should be a proper provider ID
        reference: `UTIL_LENCO_${uuidv4()}`,
        status: PaymentStatus.PENDING,
        raw_payload: {
          purpose: 'utility_bill_payment',
          utility_bill_id: billId,
          lenco_product_id: productId,
          customer_id: bill.utilityAccount.account_number,
        },
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Initiate Lenco bill payment
      const lencoPaymentRequest: LencoBillPaymentRequest = {
        productId: productId,
        customerId: bill.utilityAccount.account_number,
        debitAccountId: userId, // Using user ID as debit account
        amount: paymentAmount,
        reference: savedPayment.reference,
        description: `Utility bill payment for ${bill.utilityAccount.account_number}`,
      };

      const lencoResponse = await this.lencoService.initiateBillPayment(lencoPaymentRequest);

      // Update payment with Lenco transaction details
      savedPayment.raw_payload = {
        ...savedPayment.raw_payload,
        lenco_transaction_id: lencoResponse.transactionId,
        lenco_status: lencoResponse.status,
      };
      await this.paymentRepository.save(savedPayment);

      return {
        payment: savedPayment,
        lenco_response: lencoResponse,
        bill: bill,
        message: 'Lenco payment initiated successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to initiate Lenco payment: ${errorMessage}`);
    }
  }

  async handleLencoWebhook(webhookData: LencoWebhookEvent) {
    try {
      const { data } = webhookData;
      
      // Find the payment by Lenco transaction ID
      const payment = await this.paymentRepository.findOne({
        where: {
          raw_payload: { lenco_transaction_id: data.transactionId }
        },
        relations: ['user'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found for Lenco transaction');
      }

      // Update payment status based on Lenco webhook
      if (data.status === 'successful') {
        payment.status = PaymentStatus.SUCCESS;
        payment.paid_at = new Date();
        
        // Create utility payment record
        const utilityPayment = this.utilityPaymentRepository.create({
          utility_bill_id: payment.raw_payload.utility_bill_id,
          payment_id: payment.payment_id,
          amount: data.amount,
          paid_at: new Date(),
        });
        await this.utilityPaymentRepository.save(utilityPayment);

        // Update bill status
        const bill = await this.utilityBillRepository.findOne({
          where: { utility_bill_id: payment.raw_payload.utility_bill_id },
        });
        
        if (bill) {
          bill.status = BillStatus.PAID;
          await this.utilityBillRepository.save(bill);
        }
      } else if (data.status === 'failed') {
        payment.status = PaymentStatus.FAILED;
      }

      await this.paymentRepository.save(payment);

      return {
        message: 'Webhook processed successfully',
        payment_id: payment.payment_id,
        status: payment.status,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to process Lenco webhook: ${errorMessage}`);
    }
  }

  async getLencoPaymentStatus(transactionId: string) {
    try {
      return await this.lencoService.getBillPaymentStatus(transactionId);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to fetch Lenco payment status: ${errorMessage}`);
    }
  }

  async getLencoPaymentHistory(page: number = 1, limit: number = 20) {
    try {
      return await this.lencoService.getBillPaymentHistory(page, limit);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to fetch Lenco payment history: ${errorMessage}`);
    }
  }
}
