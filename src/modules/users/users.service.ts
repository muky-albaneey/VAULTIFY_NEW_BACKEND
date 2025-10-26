import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { UserProfile, UserRole, ApartmentType } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { DeviceToken } from '../../entities/device-token.entity';

export interface UpdateProfileDto {
  phone_number?: string;
  apartment_type?: ApartmentType;
  house_address?: string;
  profile_picture_url?: string;
}

export interface RegisterDeviceDto {
  token: string;
  platform: string;
  device_id?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile', 'wallet', 'subscriptions', 'subscriptions.plan'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status,
      profile: user.profile,
      wallet: user.wallet,
      active_subscription: user.subscriptions?.find(sub => sub.status === 'active'),
    };
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    let profile = await this.userProfileRepository.findOne({ where: { user_id: userId } });
    
    if (!profile) {
      profile = this.userProfileRepository.create({
        user_id: userId,
        ...updateData,
      });
    } else {
      Object.assign(profile, updateData);
    }

    return await this.userProfileRepository.save(profile);
  }

  async registerDevice(userId: string, deviceData: RegisterDeviceDto) {
    const { token, platform, device_id } = deviceData;

    // Check if device token already exists
    let deviceToken = await this.deviceTokenRepository.findOne({
      where: { token, platform },
    });

    if (deviceToken) {
      // Update existing token
      deviceToken.user_id = userId;
      deviceToken.device_id = device_id;
      deviceToken.last_seen = new Date();
    } else {
      // Create new device token
      deviceToken = this.deviceTokenRepository.create({
        user_id: userId,
        token,
        platform,
        device_id,
        last_seen: new Date(),
      });
    }

    return await this.deviceTokenRepository.save(deviceToken);
  }

  async unregisterDevice(userId: string, token: string) {
    await this.deviceTokenRepository.delete({ user_id: userId, token });
    return { message: 'Device unregistered successfully' };
  }

  async getUserDevices(userId: string) {
    return await this.deviceTokenRepository.find({
      where: { user_id: userId },
      order: { last_seen: 'DESC' },
    });
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    return await this.userRepository.save(user);
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async searchUsers(query: string, estateId?: string) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere(
        '(user.first_name ILIKE :query OR user.last_name ILIKE :query OR user.email ILIKE :query)',
        { query: `%${query}%` }
      );

    if (estateId) {
      // Add estate filtering logic here if needed
    }

    return await qb.limit(20).getMany();
  }

  async getUsersByEstate(estateId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    // This would need proper estate-user relationship
    // For now, returning all active users
    return await this.userRepository.find({
      where: { status: UserStatus.ACTIVE },
      relations: ['profile'],
      skip: offset,
      take: limit,
    });
  }
}
