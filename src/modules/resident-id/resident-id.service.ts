import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import * as QRCode from 'qrcode';
import { QRCodeData } from '../../common/interfaces/common.interface';

@Injectable()
export class ResidentIdService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateResidentId(userId: string, estateId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    const estate = await this.estateRepository.findOne({
      where: { estate_id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Check if user belongs to this estate (you might need to add estate relationship)
    // For now, we'll assume all users can generate IDs for any estate

    const now = Date.now();
    const rotationMinutes = this.configService.get('app.qrCode.rotationMinutes') || 10;
    const expiresAt = now + (rotationMinutes * 60 * 1000);

    const qrData: QRCodeData = {
      userId: user.user_id,
      estateId: estate.estate_id,
      issuedAt: now,
      expiresAt: expiresAt,
    };

    // Generate signed token
    const token = this.jwtService.sign(qrData, {
      secret: this.configService.get('app.jwt.secret'),
      expiresIn: `${rotationMinutes}m`,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(token);

    return {
      qr_code_url: qrCodeUrl,
      token: token,
      expires_at: new Date(expiresAt),
      expires_in_seconds: rotationMinutes * 60,
      resident_info: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: profile.profile_picture_url,
        house_address: profile.house_address,
        apartment_type: profile.apartment_type,
        estate_name: estate.name,
        status: user.status,
      },
    };
  }

  async validateResidentId(token: string, estateId: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('app.jwt.secret'),
      }) as QRCodeData;

      // Check if token is for the correct estate
      if (payload.estateId !== estateId) {
        throw new BadRequestException('QR code is not valid for this estate');
      }

      // Check if token has expired
      const now = Date.now();
      if (now > payload.expiresAt) {
        throw new BadRequestException('QR code has expired');
      }

      // Get user and profile information
      const user = await this.userRepository.findOne({
        where: { user_id: payload.userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const profile = await this.userProfileRepository.findOne({
        where: { user_id: payload.userId },
      });

      if (!profile) {
        throw new NotFoundException('User profile not found');
      }

      const estate = await this.estateRepository.findOne({
        where: { estate_id: payload.estateId },
      });

      if (!estate) {
        throw new NotFoundException('Estate not found');
      }

      // Check user status
      if (user.status !== 'active') {
        throw new BadRequestException('User account is not active');
      }

      return {
        valid: true,
        resident_info: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_picture_url: profile.profile_picture_url,
          house_address: profile.house_address,
          apartment_type: profile.apartment_type,
          estate_name: estate.name,
          status: user.status,
        },
        issued_at: new Date(payload.issuedAt),
        expires_at: new Date(payload.expiresAt),
        time_remaining_seconds: Math.max(0, Math.floor((payload.expiresAt - now) / 1000)),
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('QR code has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid QR code');
      }
      throw error;
    }
  }

  async getResidentIdStatus(userId: string, estateId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    const estate = await this.estateRepository.findOne({
      where: { estate_id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    return {
      can_generate_id: user.status === 'active' && !!profile.house_address,
      user_status: user.status,
      profile_complete: !!(profile.house_address && profile.apartment_type),
      estate_name: estate.name,
      last_updated: user.updated_at,
    };
  }

  async revokeResidentId(userId: string, estateId: string) {
    // In a real implementation, you might want to maintain a blacklist of revoked tokens
    // For now, we'll just return a success message since tokens expire automatically
    return {
      message: 'Resident ID revoked successfully',
      note: 'Current QR codes will expire automatically based on rotation time',
    };
  }
}
