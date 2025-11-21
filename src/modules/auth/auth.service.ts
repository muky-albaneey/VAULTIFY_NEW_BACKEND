import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../../entities/user.entity';
import { UserProfile, UserRole, ApartmentType } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { Wallet } from '../../entities/wallet.entity';
import { JwtPayload, RefreshTokenPayload } from '../../common/interfaces/common.interface';
import { EmailService } from '../../common/services/email.service';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  estate_id: string;
  role?: UserRole;
  phone_number?: string;
  apartment_type?: ApartmentType;
  house_address?: string;
  profile_picture_url?: string;
}

export interface RegisterSimpleDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  apartment_type?: ApartmentType;
  house_address?: string;
  profile_picture_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    status: UserStatus;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    public readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService
  ) {}

  async register(
    registerDto: RegisterDto
  ): Promise<{ message: string; user_id: string }> {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      estate_id, 
      role,
      phone_number,
      apartment_type,
      house_address,
      profile_picture_url,
    } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Verify estate exists //
    const estate = await this.estateRepository.findOne({
      where: { estate_id },
    });
    if (!estate) {
      throw new BadRequestException(
        "Estate not found. Please provide a valid estate ID."
      );
    }

    // Hash password//
    const saltRounds = this.configService.get("app.security.bcryptRounds") || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP expires in 10 minutes

    // Create user with PENDING status
    const user = this.userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      status: UserStatus.PENDING,
      verification_code: otp,
      verification_code_expires: otpExpires,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile with estate_id assigned
    // Use provided role or default to RESIDENCE
    // Only allow RESIDENCE or SECURITY_PERSONNEL for normal registration
    const userRole = role && (role === UserRole.RESIDENCE || role === UserRole.SECURITY_PERSONNEL) 
      ? role 
      : UserRole.RESIDENCE;
    
    const userProfile = this.userProfileRepository.create({
      user_id: savedUser.user_id,
      estate_id: estate_id,
      role: userRole,
      phone_number,
      apartment_type,
      house_address,
      profile_picture_url,
    });
    await this.userProfileRepository.save(userProfile);

    // Send OTP email
    await this.emailService.sendOTP(email, `${first_name} ${last_name}`, otp);

    return {
      message:
        "Registration successful. Please check your email for verification code.",
      user_id: savedUser.user_id,
    };
  }

  async registerSimple(
    registerDto: RegisterSimpleDto
  ): Promise<{ message: string; user_id: string }> {
    const { 
      email, 
      password, 
      first_name, 
      last_name,
      phone_number,
      apartment_type,
      house_address,
      profile_picture_url,
    } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Hash password
    const saltRounds = this.configService.get("app.security.bcryptRounds") || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP expires in 10 minutes

    // Create user with PENDING status
    const user = this.userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      status: UserStatus.PENDING,
      verification_code: otp,
      verification_code_expires: otpExpires,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile with Residence role (no estate_id required)
    const userProfile = this.userProfileRepository.create({
      user_id: savedUser.user_id,
      role: UserRole.RESIDENCE, // Default role
      estate_id: null, // No estate assigned initially
      phone_number,
      apartment_type,
      house_address,
      profile_picture_url,
    });
    await this.userProfileRepository.save(userProfile);

    // Send OTP email
    await this.emailService.sendOTP(email, `${first_name} ${last_name}`, otp);

    return {
      message:
        "Registration successful. Please check your email for verification code.",
      user_id: savedUser.user_id,
    };
  }

  async verifyOTP(
    userId: string,
    otp: string
  ): Promise<{ message: string; user_id: string; status: UserStatus }> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Check if already verified
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException("User is already verified");
    }

    // Check OTP
    if (!user.verification_code || user.verification_code !== otp) {
      throw new UnauthorizedException("Invalid verification code");
    }

    // Check if OTP expired
    if (
      !user.verification_code_expires ||
      new Date() > user.verification_code_expires
    ) {
      throw new BadRequestException("Verification code has expired");
    }

    // Clear OTP but keep status as PENDING - admin must activate user
    user.verification_code = null;
    user.verification_code_expires = null;
    await this.userRepository.save(user);

    return {
      message:
        "Email verified successfully. Please wait for admin approval to activate your account.",
      user_id: user.user_id,
      status: user.status,
    };
  }

  async resendOTP(userIdOrEmail: string): Promise<{ message: string; user_id: string }> {
    // Find user by ID or email
    const user = await this.userRepository.findOne({
      where: [
        { user_id: userIdOrEmail },
        { email: userIdOrEmail },
      ],
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // Check if user is already verified
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException("User is already verified. No need to resend OTP.");
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP expires in 10 minutes

    // Update user with new OTP
    user.verification_code = otp;
    user.verification_code_expires = otpExpires;
    await this.userRepository.save(user);

    // Send OTP email
    await this.emailService.sendOTP(
      user.email,
      `${user.first_name} ${user.last_name}`,
      otp
    );

    return {
      message: "OTP has been resent to your email. Please check your inbox.",
      user_id: user.user_id,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check user status - only ACTIVE users can login
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("Account is suspended");
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        "Account is pending admin approval. Please wait for activation."
      );
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    let payload: RefreshTokenPayload;
    
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("app.jwt.refreshSecret"),
      }) as RefreshTokenPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException("Refresh token has expired. Please login again.");
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException("Invalid refresh token format.");
      } else if (error.name === 'NotBeforeError') {
        throw new UnauthorizedException("Refresh token is not active yet.");
      }
      throw new UnauthorizedException("Invalid refresh token. Please login again.");
    }

    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub },
      relations: ["profile"],
    });
    
    if (!user) {
      throw new UnauthorizedException("User associated with refresh token not found.");
    }
    
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("User account is suspended. Please contact support.");
    }

    const jwtPayload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: user.profile?.role || "Residence",
    };

    const access_token = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get("app.jwt.secret"),
      expiresIn: this.configService.get("app.jwt.expiresIn"),
    });

    return { access_token };
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub },
      relations: ["profile"],
    });
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("User not found or suspended");
    }
    // Return plain object (not TypeORM entity) with all necessary properties
    // This ensures properties are accessible and serializable
    return {
      user_id: user.user_id, // Primary key - MUST be included
      sub: payload.sub, // JWT subject - also include for compatibility
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status,
      role: user.profile?.role || "Residence",
      profile: user.profile ? {
        estate_id: user.profile.estate_id,
        phone_number: user.profile.phone_number,
        apartment_type: user.profile.apartment_type,
        house_address: user.profile.house_address,
      } : null,
    };
  }

  private async generateTokens(
    user: User,
    role?: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    const jwtPayload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: role || "Residence",
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.user_id,
      tokenVersion: 1,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get("app.jwt.secret"),
        expiresIn: this.configService.get("app.jwt.expiresIn"),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get("app.jwt.refreshSecret"),
        expiresIn: this.configService.get("app.jwt.refreshExpiresIn"),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException("Invalid old password");
    }

    const saltRounds = this.configService.get("app.security.bcryptRounds") || 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(userId, { password_hash });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // OTP expires in 10 minutes

    // Save OTP to user record
    user.verification_code = otp;
    user.verification_code_expires = otpExpires;
    await this.userRepository.save(user);

    // Send OTP email
    await this.emailService.sendPasswordResetOTP(
      email,
      `${user.first_name} ${user.last_name}`,
      otp
    );
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check OTP
    if (!user.verification_code || user.verification_code !== otp) {
      throw new UnauthorizedException("Invalid OTP");
    }

    // Check if OTP expired
    if (
      !user.verification_code_expires ||
      new Date() > user.verification_code_expires
    ) {
      throw new BadRequestException("OTP has expired");
    }

    // Hash new password
    const saltRounds = this.configService.get("app.security.bcryptRounds") || 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear OTP
    user.password_hash = password_hash;
    user.verification_code = null;
    user.verification_code_expires = null;
    await this.userRepository.save(user);
  }

  async changeRole(userId: string, newRole: UserRole): Promise<{ message: string; user_id: string; role: UserRole }> {
    // Find user profile
    let profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = this.userProfileRepository.create({
        user_id: userId,
        role: newRole,
      });
    } else {
      // Update role
      profile.role = newRole;
      
      // If changing to Super Admin, remove estate_id
      if (newRole === UserRole.SUPER_ADMIN) {
        profile.estate_id = null;
      }
    }

    await this.userProfileRepository.save(profile);

    return {
      message: 'Role changed successfully',
      user_id: userId,
      role: newRole,
    };
  }

  async createTempSuperAdmin(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<{ message: string; user_id: string; email: string; role: UserRole }> {
    const { email, password, first_name, last_name } = data;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Hash password
    const saltRounds = this.configService.get("app.security.bcryptRounds") || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user with ACTIVE status (no OTP required for temp endpoint)
    const user = this.userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      status: UserStatus.ACTIVE, // Directly active, no OTP needed
    });

    const savedUser = await this.userRepository.save(user);

    // Create super admin profile
    const userProfile = this.userProfileRepository.create({
      user_id: savedUser.user_id,
      role: UserRole.SUPER_ADMIN,
      estate_id: null, // Super Admin doesn't need estate
    });
    await this.userProfileRepository.save(userProfile);

    // Create wallet
    const wallet = this.walletRepository.create({
      user_id: savedUser.user_id,
      available_balance: 0,
    });
    await this.walletRepository.save(wallet);

    return {
      message: '⚠️ TEMPORARY: Super admin created successfully. REMOVE THIS ENDPOINT IN PRODUCTION!',
      user_id: savedUser.user_id,
      email: savedUser.email,
      role: UserRole.SUPER_ADMIN,
    };
  }
}
