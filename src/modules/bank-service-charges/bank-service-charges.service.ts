import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BankServiceCharge, PaymentFrequency } from '../../entities/bank-service-charge.entity';
import { BankServiceChargeFile } from '../../entities/bank-service-charge-file.entity';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { WalletTransaction, TransactionDirection, TransactionPurpose, TransactionStatus } from '../../entities/wallet-transaction.entity';
import { Wallet } from '../../entities/wallet.entity';
import { WalletsService } from '../wallets/wallets.service';
import { PaymentsService } from '../payments/payments.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateBankServiceChargeDto {
  service_charge: number;
  payment_frequency: PaymentFrequency;
  bank_name: string;
  account_name: string;
  account_number: string;
}

export interface UpdateBankServiceChargeDto {
  service_charge?: number;
  paid_charge?: number;
  outstanding_charge?: number;
  payment_frequency?: PaymentFrequency;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
}

export interface PayServiceChargeDto {
  payment_method: 'wallet' | 'external';
  amount?: number;
}

export interface UploadServiceChargeFileDto {
  file_url: string;
}

@Injectable()
export class BankServiceChargeService {
  constructor(
    @InjectRepository(BankServiceCharge)
    private bankServiceChargeRepository: Repository<BankServiceCharge>,
    @InjectRepository(BankServiceChargeFile)
    private bankServiceChargeFileRepository: Repository<BankServiceChargeFile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async createBankServiceCharge(userId: string, createData: CreateBankServiceChargeDto) {
    const {
      service_charge,
      payment_frequency,
      bank_name,
      account_name,
      account_number,
    } = createData;

    if (service_charge <= 0) {
      throw new BadRequestException('Service charge must be greater than 0');
    }

    // Check if user already has a service charge record
    const existingBSC = await this.bankServiceChargeRepository.findOne({
      where: { user_id: userId },
    });

    if (existingBSC) {
      throw new BadRequestException('Bank service charge record already exists for this user');
    }

    const bankServiceCharge = this.bankServiceChargeRepository.create({
      user_id: userId,
      service_charge,
      paid_charge: 0,
      outstanding_charge: service_charge,
      payment_frequency,
      bank_name,
      account_name,
      account_number,
    });

    return await this.bankServiceChargeRepository.save(bankServiceCharge);
  }

  async getUserBankServiceCharge(userId: string) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'files'],
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    return bankServiceCharge;
  }

  async updateBankServiceCharge(userId: string, updateData: UpdateBankServiceChargeDto) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { user_id: userId },
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    // Update fields
    Object.assign(bankServiceCharge, updateData);

    // Recalculate outstanding charge if service_charge or paid_charge changed
    if (updateData.service_charge !== undefined || updateData.paid_charge !== undefined) {
      bankServiceCharge.outstanding_charge = bankServiceCharge.service_charge - bankServiceCharge.paid_charge;
    }

    return await this.bankServiceChargeRepository.save(bankServiceCharge);
  }

  async payServiceCharge(userId: string, paymentData: PayServiceChargeDto) {
    const { payment_method, amount } = paymentData;

    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { user_id: userId },
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    const paymentAmount = amount || bankServiceCharge.outstanding_charge;

    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (paymentAmount > bankServiceCharge.outstanding_charge) {
      throw new BadRequestException('Payment amount cannot exceed outstanding charge');
    }

    let payment: Payment | null = null;

    if (payment_method === 'wallet') {
      // Debit wallet
      await this.walletsService.debitWallet(
        userId,
        paymentAmount,
        TransactionPurpose.SERVICE_CHARGE_PAYMENT,
      );

      // Create payment record
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: paymentAmount,
        currency: 'NGN',
        provider_id: 'wallet', // This should be a proper provider ID
        reference: `BSC_${uuidv4()}`,
        status: PaymentStatus.SUCCESS,
        paid_at: new Date(),
        raw_payload: {
          purpose: 'service_charge_payment',
          bank_service_charge_id: bankServiceCharge.bsc_id,
        },
      });

      payment = await this.paymentRepository.save(payment);
    } else {
      // External payment
      payment = this.paymentRepository.create({
        user_id: userId,
        amount: paymentAmount,
        currency: 'NGN',
        provider_id: 'external', // This should be a proper provider ID
        reference: `BSC_${uuidv4()}`,
        status: PaymentStatus.PENDING,
        raw_payload: {
          purpose: 'service_charge_payment',
          bank_service_charge_id: bankServiceCharge.bsc_id,
        },
      });

      payment = await this.paymentRepository.save(payment);
    }

    // Update bank service charge
    bankServiceCharge.paid_charge += paymentAmount;
    bankServiceCharge.outstanding_charge -= paymentAmount;
    await this.bankServiceChargeRepository.save(bankServiceCharge);

    return {
      payment: payment,
      bank_service_charge: bankServiceCharge,
      payment_url: payment_method === 'external' ? `https://paystack.com/pay/${payment.reference}` : null,
    };
  }

  async uploadServiceChargeFile(userId: string, bscId: string, uploadData: UploadServiceChargeFileDto) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { bsc_id: bscId, user_id: userId },
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    const file = this.bankServiceChargeFileRepository.create({
      bsc_id: bscId,
      file_url: uploadData.file_url,
      uploaded_at: new Date(),
    });

    return await this.bankServiceChargeFileRepository.save(file);
  }

  async getServiceChargeFiles(userId: string, bscId: string) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { bsc_id: bscId, user_id: userId },
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    return await this.bankServiceChargeFileRepository.find({
      where: { bsc_id: bscId },
      order: { uploaded_at: 'DESC' },
    });
  }

  async deleteServiceChargeFile(userId: string, bscId: string, fileId: string) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { bsc_id: bscId, user_id: userId },
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    const file = await this.bankServiceChargeFileRepository.findOne({
      where: { bsc_file_id: fileId, bsc_id: bscId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.bankServiceChargeFileRepository.remove(file);
    return { message: 'File deleted successfully' };
  }

  async getAllBankServiceCharges(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [bankServiceCharges, total] = await this.bankServiceChargeRepository.findAndCount({
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: bankServiceCharges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBankServiceChargesByEstate(estateId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [bankServiceCharges, total] = await this.bankServiceChargeRepository
      .createQueryBuilder('bsc')
      .leftJoinAndSelect('bsc.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('profile.estate_id = :estateId', { estateId })
      .orderBy('bsc.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: bankServiceCharges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async validateServiceCharge(
    bscId: string,
    adminUserId: string,
    isValidated: boolean,
    notes?: string,
  ) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { bsc_id: bscId },
      relations: ['user', 'user.profile'],
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    bankServiceCharge.is_validated = isValidated;
    bankServiceCharge.validated_at = isValidated ? new Date() : null;
    bankServiceCharge.validated_by = isValidated ? adminUserId : null;
    bankServiceCharge.validation_notes = notes || null;

    return await this.bankServiceChargeRepository.save(bankServiceCharge);
  }
}
