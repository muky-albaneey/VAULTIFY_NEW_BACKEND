import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../../entities/user.entity';
import { UserProfile, UserRole, ApartmentType } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { DeviceToken, Platform } from '../../entities/device-token.entity';
import { Wallet } from '../../entities/wallet.entity';

export interface UpdateProfileDto {
  phone_number?: string;
  apartment_type?: ApartmentType;
  house_address?: string;
  profile_picture_url?: string;
}

export interface RegisterDeviceDto {
  token: string;
  platform: Platform;
  device_id?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  estate_id?: string;
  phone_number?: string;
  apartment_type?: ApartmentType;
  house_address?: string;
  profile_picture_url?: string;
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
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private configService: ConfigService,
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
      where: { token, platform: platform as Platform },
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
        platform: platform as Platform,
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
      relations: ['profile', 'bankServiceCharges', 'bankServiceCharges.files'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transform to include single service charge (since each user has only one)
    const { bankServiceCharges, ...userWithoutBSC } = user;
    const transformedUser = {
      ...userWithoutBSC,
      service_charge: bankServiceCharges?.[0] || null,
    };

    return transformedUser;
  }

  async searchUsers(query: string, estateId?: string) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.bankServiceCharges', 'bankServiceCharge')
      .leftJoinAndSelect('bankServiceCharge.files', 'files')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere(
        '(user.first_name ILIKE :query OR user.last_name ILIKE :query OR user.email ILIKE :query)',
        { query: `%${query}%` }
      );

    if (estateId) {
      qb.andWhere('profile.estate_id = :estateId', { estateId });
    }

    const users = await qb.limit(20).getMany();

    // Transform users to include single service charge (since each user has only one)
    return users.map(user => {
      const { bankServiceCharges, ...userWithoutBSC } = user;
      return {
        ...userWithoutBSC,
        service_charge: bankServiceCharges?.[0] || null,
      };
    });
  }

  async getUsersByEstate(estateId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.bankServiceCharges', 'bankServiceCharge')
      .leftJoinAndSelect('bankServiceCharge.files', 'files')
      .where('profile.estate_id = :estateId', { estateId })
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Transform users to include single service charge (since each user has only one)
    const transformedUsers = users.map(user => {
      const { bankServiceCharges, ...userWithoutBSC } = user;
      return {
        ...userWithoutBSC,
        service_charge: bankServiceCharges?.[0] || null,
      };
    });

    return {
      data: transformedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEstateUsersByRole(
    estateId: string,
    role: UserRole.RESIDENCE | UserRole.SECURITY_PERSONNEL,
    requestingUserId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const offset = (page - 1) * limit;

    // Validate role
    if (role !== UserRole.RESIDENCE && role !== UserRole.SECURITY_PERSONNEL) {
      throw new BadRequestException('Role must be either "Residence" or "Security Personnel"');
    }

    // Verify estate exists
    const estate = await this.estateRepository.findOne({
      where: { estate_id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // If requesting user is provided, check if they're an estate admin and scope to their estate
    if (requestingUserId) {
      const requestingUserProfile = await this.userProfileRepository.findOne({
        where: { user_id: requestingUserId },
      });

      // If user is an estate admin (not super admin), ensure they can only access their own estate
      if (requestingUserProfile?.role === UserRole.ADMIN && requestingUserProfile.estate_id !== estateId) {
        throw new BadRequestException('Estate Admin can only access users from their own estate');
      }
    }

    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.bankServiceCharges', 'bankServiceCharge')
      .leftJoinAndSelect('bankServiceCharge.files', 'files')
      .where('profile.estate_id = :estateId', { estateId })
      .andWhere('profile.role = :role', { role })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .orderBy('user.first_name', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Transform users to include single service charge (since each user has only one)
    const transformedUsers = users.map(user => {
      const { bankServiceCharges, ...userWithoutBSC } = user;
      return {
        ...userWithoutBSC,
        service_charge: bankServiceCharges?.[0] || null,
      };
    });

    return {
      data: transformedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      role,
      estate_id: estateId,
    };
  }

  async assignEstateToUser(
    userId: string,
    estateId: string,
    role: UserRole,
    apartmentType?: ApartmentType,
    houseAddress?: string,
    phoneNumber?: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify estate exists
    const estate = await this.estateRepository.findOne({
      where: { estate_id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Create or update profile
    let profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      profile = this.userProfileRepository.create({
        user_id: userId,
        estate_id: estateId,
        role,
        apartment_type: apartmentType,
        house_address: houseAddress,
        phone_number: phoneNumber,
      });
    } else {
      profile.estate_id = estateId;
      profile.role = role;
      if (apartmentType) profile.apartment_type = apartmentType;
      if (houseAddress) profile.house_address = houseAddress;
      if (phoneNumber) profile.phone_number = phoneNumber;
    }

    await this.userProfileRepository.save(profile);

    return {
      user_id: userId,
      estate_id: estateId,
      role,
      message: 'Estate assigned successfully',
    };
  }

  async makeEstateAdmin(userId: string, estateId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User must be active to become admin');
    }

    // Verify estate exists
    const estate = await this.estateRepository.findOne({
      where: { estate_id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Create or update profile
    let profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      profile = this.userProfileRepository.create({
        user_id: userId,
        estate_id: estateId,
        role: UserRole.ADMIN,
      });
    } else {
      profile.estate_id = estateId;
      profile.role = UserRole.ADMIN;
    }

    await this.userProfileRepository.save(profile);

    return {
      user_id: userId,
      role: UserRole.ADMIN,
      estate_id: estateId,
      message: 'User promoted to Estate Admin',
    };
  }

  async makeSuperAdmin(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User must be active to become super admin');
    }

    // Create or update profile
    let profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      profile = this.userProfileRepository.create({
        user_id: userId,
        role: UserRole.SUPER_ADMIN,
      });
    } else {
      profile.role = UserRole.SUPER_ADMIN;
      // Super Admin doesn't need estate_id
      profile.estate_id = null;
    }

    await this.userProfileRepository.save(profile);

    return {
      user_id: userId,
      role: UserRole.SUPER_ADMIN,
      message: 'User promoted to Super Admin',
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      estate_id,
      phone_number,
      apartment_type,
      house_address,
      profile_picture_url,
    } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validate estate_id based on role
    if (role === UserRole.ADMIN) {
      if (!estate_id) {
        throw new BadRequestException('Estate ID is required for Estate Admin role. Estate Admins must be assigned to a specific estate.');
      }
      // Verify estate exists
      const estate = await this.estateRepository.findOne({
        where: { estate_id },
      });
      if (!estate) {
        throw new NotFoundException('Estate not found');
      }
    } else if (role === UserRole.SUPER_ADMIN) {
      // Super Admin doesn't need estate_id
      if (estate_id) {
        throw new BadRequestException('Super Admin cannot be assigned to an estate');
      }
    } else if (estate_id) {
      // For other roles, verify estate exists if provided
      const estate = await this.estateRepository.findOne({
        where: { estate_id },
      });
      if (!estate) {
        throw new NotFoundException('Estate not found');
      }
    }

    // Hash password
    const saltRounds = this.configService.get('app.security.bcryptRounds') || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user with ACTIVE status (no OTP needed for admin-created users)
    const user = this.userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile with specified role
    const userProfile = this.userProfileRepository.create({
      user_id: savedUser.user_id,
      role,
      estate_id: role === UserRole.SUPER_ADMIN ? null : estate_id || null,
      phone_number,
      apartment_type,
      house_address,
      profile_picture_url,
    });
    await this.userProfileRepository.save(userProfile);

    // Create wallet
    const wallet = this.walletRepository.create({
      user_id: savedUser.user_id,
      available_balance: 0,
    });
    await this.walletRepository.save(wallet);

    return {
      user_id: savedUser.user_id,
      email: savedUser.email,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      status: savedUser.status,
      role,
      estate_id: role === UserRole.SUPER_ADMIN ? null : estate_id || null,
      message: 'User created successfully',
    };
  }
}
