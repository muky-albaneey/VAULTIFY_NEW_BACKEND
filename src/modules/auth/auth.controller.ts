import { Controller, Post, Put, Body, UseGuards, HttpCode, HttpStatus, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginDto, RegisterDto, RegisterSimpleDto } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard } from './auth.guards';
import { Public } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole, ApartmentType } from '../../entities/user-profile.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { z } from 'zod';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  estate_id: z.string().uuid('Estate ID must be a valid UUID'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.RESIDENCE),
  phone_number: z.string().optional(),
  apartment_type: z.nativeEnum(ApartmentType).optional(),
  house_address: z.string().optional(),
  profile_picture_url: z.string().url().optional(),
});

const RefreshTokenSchema = z.object({
  refresh_token: z.string(),
});

const ChangePasswordSchema = z.object({
  old_password: z.string().min(6),
  new_password: z.string().min(6),
});

const RequestPasswordResetSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4),
  new_password: z.string().min(6),
});

const VerifyOTPSchema = z.object({
  user_id: z.string().uuid(),
  otp: z.string().length(6),
});

const RegisterSimpleSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone_number: z.string().optional(),
  apartment_type: z.nativeEnum(ApartmentType).optional(),
  house_address: z.string().optional(),
  profile_picture_url: z.string().url().optional(),
});

const ChangeRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user with estate and send OTP. Role can be specified (Residence or Security Personnel). Profile fields (phone_number, apartment_type, house_address, profile_picture_url) can be included.' })
  @ApiResponse({ status: 201, description: 'User registered successfully. OTP sent to email.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    const validatedData = RegisterSchema.parse(registerDto) as RegisterDto;
    // Ensure only RESIDENCE or SECURITY_PERSONNEL can be registered (not Admin/Super Admin)
    if (validatedData.role && validatedData.role !== UserRole.RESIDENCE && validatedData.role !== UserRole.SECURITY_PERSONNEL) {
      throw new BadRequestException('Only Residence or Security Personnel roles can be assigned during registration');
    }
    return this.authService.register(validatedData);
  }

  @Post('register-simple')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user without estate (becomes Residence by default) and send OTP. Profile fields (phone_number, apartment_type, house_address, profile_picture_url) can be included.' })
  @ApiResponse({ status: 201, description: 'User registered successfully. OTP sent to email.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerSimple(@Body() registerDto: RegisterSimpleDto) {
    const validatedData = RegisterSimpleSchema.parse(registerDto) as RegisterSimpleDto;
    return this.authService.registerSimple(validatedData);
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and complete email verification (User remains pending until admin activates)' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully. User status remains pending until admin activation.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyOTP(@Body() body: { user_id: string; otp: string }) {
    const validatedData = VerifyOTPSchema.parse(body);
    return this.authService.verifyOTP(validatedData.user_id, validatedData.otp);
  }

  @Post('resend-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP verification code to user email' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'User not found or already verified' })
  async resendOTP(@Body() body: { user_id?: string; email?: string }) {
    const ResendOTPSchema = z.object({
      user_id: z.string().uuid().optional(),
      email: z.string().email().optional(),
    }).refine((data) => data.user_id || data.email, {
      message: 'Either user_id or email must be provided',
    });
    
    const validatedData = ResendOTPSchema.parse(body);
    const identifier = validatedData.user_id || validatedData.email;
    
    if (!identifier) {
      throw new BadRequestException('Either user_id or email must be provided');
    }
    
    return this.authService.resendOTP(identifier);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const validatedData = LoginSchema.parse(loginDto) as LoginDto;
    return this.authService.login(validatedData);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() body: { refresh_token: string }) {
    const validatedData = RefreshTokenSchema.parse(body);
    return this.authService.refreshToken(validatedData.refresh_token);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid old password' })
  async changePassword(
    @Body() body: { old_password: string; new_password: string },
    @CurrentUserId() userId: string,
  ) {
    const validatedData = ChangePasswordSchema.parse(body);
    await this.authService.changePassword(userId, validatedData.old_password, validatedData.new_password);
    return { message: 'Password changed successfully' };
  }

  @Post('request-password-reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  async requestPasswordReset(@Body() body: { email: string }) {
    const validatedData = RequestPasswordResetSchema.parse(body);
    await this.authService.requestPasswordReset(validatedData.email);
    return { message: 'OTP sent to email if account exists' };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async resetPassword(@Body() body: { email: string; otp: string; new_password: string }) {
    const validatedData = ResetPasswordSchema.parse(body);
    await this.authService.resetPassword(validatedData.email, validatedData.otp, validatedData.new_password);
    return { message: 'Password reset successfully' };
  }

  @Put('change-role/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user role (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Role changed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async changeRole(
    @Param('userId') userId: string,
    @Body() body: { role: UserRole },
  ) {
    const validatedData = ChangeRoleSchema.parse(body);
    return this.authService.changeRole(userId, validatedData.role);
  }

  @Post('create-super-admin-temp')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '⚠️ TEMPORARY: Create super admin without authentication (REMOVE IN PRODUCTION!)',
    description: 'This is a temporary endpoint for bootstrapping the first super admin. Should be disabled/removed in production.'
  })
  @ApiResponse({ status: 201, description: 'Super admin created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTempSuperAdmin(@Body() body: { 
    email: string; 
    password: string; 
    first_name: string; 
    last_name: string;
  }) {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      first_name: z.string().min(1),
      last_name: z.string().min(1),
    });
    const validatedData = schema.parse(body) as {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    };
    return this.authService.createTempSuperAdmin(validatedData);
  }
}
