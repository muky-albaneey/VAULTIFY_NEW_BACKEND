import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BankServiceCharge, PaymentFrequency } from '../../entities/bank-service-charge.entity';
import { BankServiceChargeFile } from '../../entities/bank-service-charge-file.entity';
import { User } from '../../entities/user.entity';

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

export interface UploadServiceChargeFileDto {
  file_url: string;
}

export interface AdminUpdateServiceChargeDto {
  service_charge?: number;
  paid_charge?: number;
  payment_frequency?: PaymentFrequency;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  is_validated?: boolean;
  validation_notes?: string;
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

  // Users can only update basic info, not payment amounts
  async updateBankServiceCharge(userId: string, updateData: UpdateBankServiceChargeDto) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { user_id: userId },
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    // Users can only update bank details, not payment amounts
    const allowedFields = ['bank_name', 'account_name', 'account_number', 'payment_frequency'];
    const updateFields: Partial<BankServiceCharge> = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    Object.assign(bankServiceCharge, updateFields);
    return await this.bankServiceChargeRepository.save(bankServiceCharge);
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

  async adminUpdateServiceCharge(
    bscId: string,
    adminUserId: string,
    updateData: AdminUpdateServiceChargeDto,
  ) {
    const bankServiceCharge = await this.bankServiceChargeRepository.findOne({
      where: { bsc_id: bscId },
      relations: ['user', 'user.profile'],
    });

    if (!bankServiceCharge) {
      throw new NotFoundException('Bank service charge record not found');
    }

    // Update allowed fields
    if (updateData.service_charge !== undefined) {
      bankServiceCharge.service_charge = updateData.service_charge;
    }

    if (updateData.paid_charge !== undefined) {
      bankServiceCharge.paid_charge = updateData.paid_charge;
    }

    if (updateData.payment_frequency !== undefined) {
      bankServiceCharge.payment_frequency = updateData.payment_frequency;
    }

    if (updateData.bank_name !== undefined) {
      bankServiceCharge.bank_name = updateData.bank_name;
    }

    if (updateData.account_name !== undefined) {
      bankServiceCharge.account_name = updateData.account_name;
    }

    if (updateData.account_number !== undefined) {
      bankServiceCharge.account_number = updateData.account_number;
    }

    if (updateData.is_validated !== undefined) {
      bankServiceCharge.is_validated = updateData.is_validated;
      bankServiceCharge.validated_at = updateData.is_validated ? new Date() : null;
      bankServiceCharge.validated_by = updateData.is_validated ? adminUserId : null;
    }

    if (updateData.validation_notes !== undefined) {
      bankServiceCharge.validation_notes = updateData.validation_notes;
    }

    // Auto-calculate outstanding_charge whenever service_charge or paid_charge changes
    bankServiceCharge.outstanding_charge = bankServiceCharge.service_charge - bankServiceCharge.paid_charge;

    // Ensure outstanding_charge is not negative
    if (bankServiceCharge.outstanding_charge < 0) {
      bankServiceCharge.outstanding_charge = 0;
    }

    return await this.bankServiceChargeRepository.save(bankServiceCharge);
  }
}
