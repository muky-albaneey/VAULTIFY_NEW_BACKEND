import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../entities/user.entity';
import { JwtPayload, RefreshTokenPayload } from '../../common/interfaces/common.interface';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, first_name, last_name } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const saltRounds = this.configService.get('security.bcryptRounds');
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      status: UserStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: {
        user_id: savedUser.user_id,
        email: savedUser.email,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        status: savedUser.status,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
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
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('app.jwt.refreshSecret'),
      }) as RefreshTokenPayload;

      const user = await this.userRepository.findOne({ where: { user_id: payload.sub } });
      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const jwtPayload: JwtPayload = {
        sub: user.user_id,
        email: user.email,
        role: 'Residence', // This should come from user profile
      };

      const access_token = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get('app.jwt.secret'),
        expiresIn: this.configService.get('app.jwt.expiresIn'),
      });

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({ where: { user_id: payload.sub } });
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User not found or suspended');
    }
    return user;
  }

  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string }> {
    const jwtPayload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: 'Residence', // This should come from user profile
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.user_id,
      tokenVersion: 1,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('app.jwt.secret'),
        expiresIn: this.configService.get('app.jwt.expiresIn'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('app.jwt.refreshSecret'),
        expiresIn: this.configService.get('app.jwt.refreshExpiresIn'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Invalid old password');
    }

    const saltRounds = this.configService.get('security.bcryptRounds');
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(userId, { password_hash });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate OTP and send email (implement email service)
    // For now, just return
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    // Validate OTP and reset password
    // Implementation depends on OTP storage mechanism
  }
}
