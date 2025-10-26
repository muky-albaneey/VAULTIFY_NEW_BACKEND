import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessCode } from '../../entities/access-code.entity';
import { User } from '../../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAccessCodeDto {
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  valid_from: Date;
  valid_to: Date;
  max_uses?: number;
  gate?: string;
  notify_on_use?: boolean;
}

@Injectable()
export class AccessCodesService {
  constructor(
    @InjectRepository(AccessCode)
    private accessCodeRepository: Repository<AccessCode>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createAccessCode(userId: string, createData: CreateAccessCodeDto) {
    const { visitor_name, visitor_email, visitor_phone, valid_from, valid_to, max_uses = 1, gate, notify_on_use = true } = createData;

    if (valid_from >= valid_to) {
      throw new BadRequestException('Valid from date must be before valid to date');
    }

    const code = uuidv4().substring(0, 8).toUpperCase();

    const accessCode = this.accessCodeRepository.create({
      code,
      creator_user_id: userId,
      visitor_name,
      visitor_email,
      visitor_phone,
      valid_from,
      valid_to,
      max_uses,
      gate,
      notify_on_use,
      is_active: true,
    });

    return await this.accessCodeRepository.save(accessCode);
  }

  async getAccessCodes(userId: string) {
    return await this.accessCodeRepository.find({
      where: { creator_user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async validateAccessCode(code: string) {
    const accessCode = await this.accessCodeRepository.findOne({
      where: { code, is_active: true },
      relations: ['creator'],
    });

    if (!accessCode) {
      throw new NotFoundException('Access code not found');
    }

    const now = new Date();
    if (now < accessCode.valid_from || now > accessCode.valid_to) {
      throw new BadRequestException('Access code has expired');
    }

    if (accessCode.current_uses >= accessCode.max_uses) {
      throw new BadRequestException('Access code has reached maximum uses');
    }

    // Increment usage count
    accessCode.current_uses += 1;
    await this.accessCodeRepository.save(accessCode);

    return {
      code: accessCode.code,
      visitor_name: accessCode.visitor_name,
      visitor_email: accessCode.visitor_email,
      visitor_phone: accessCode.visitor_phone,
      creator_name: `${accessCode.creator.first_name} ${accessCode.creator.last_name}`,
      valid_from: accessCode.valid_from,
      valid_to: accessCode.valid_to,
      remaining_uses: accessCode.max_uses - accessCode.current_uses,
    };
  }

  async deactivateAccessCode(userId: string, code: string) {
    const accessCode = await this.accessCodeRepository.findOne({
      where: { code, creator_user_id: userId },
    });

    if (!accessCode) {
      throw new NotFoundException('Access code not found');
    }

    accessCode.is_active = false;
    await this.accessCodeRepository.save(accessCode);

    return { message: 'Access code deactivated successfully' };
  }
}
