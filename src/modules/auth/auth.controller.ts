import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginDto, RegisterDto } from './auth.service';
import { LocalAuthGuard } from './auth.guards';
import { Public } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    const validatedData = RegisterSchema.parse(registerDto);
    return this.authService.register(validatedData);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const validatedData = LoginSchema.parse(loginDto);
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
}
