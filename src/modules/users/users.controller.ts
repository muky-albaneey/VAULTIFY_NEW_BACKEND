import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto, RegisterDeviceDto } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

// Validation schemas
const UpdateProfileSchema = z.object({
  phone_number: z.string().optional(),
  apartment_type: z.enum(['Studio', '1-Bedroom', '2-Bedroom', '3-Bedroom', '4-Bedroom', '5-Bedroom', 'Duplex']).optional(),
  house_address: z.string().optional(),
  profile_picture_url: z.string().url().optional(),
});

const RegisterDeviceSchema = z.object({
  token: z.string().min(1),
  platform: z.string().min(1),
  device_id: z.string().optional(),
});

const SearchUsersSchema = z.object({
  query: z.string().min(1),
  estate_id: z.string().uuid().optional(),
});

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getMe(@CurrentUserId() userId: string) {
    return this.usersService.getMe(userId);
  }

  @Put('me/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    const validatedData = UpdateProfileSchema.parse(updateData) as UpdateProfileDto;
    return this.usersService.updateProfile(userId, validatedData);
  }

  @Post('me/devices')
  @ApiOperation({ summary: 'Register device for push notifications' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  async registerDevice(
    @CurrentUserId() userId: string,
    @Body() deviceData: RegisterDeviceDto,
  ) {
    const validatedData = RegisterDeviceSchema.parse(deviceData) as RegisterDeviceDto;
    return this.usersService.registerDevice(userId, validatedData);
  }

  @Delete('me/devices/:token')
  @ApiOperation({ summary: 'Unregister device' })
  @ApiResponse({ status: 200, description: 'Device unregistered successfully' })
  async unregisterDevice(
    @CurrentUserId() userId: string,
    @Param('token') token: string,
  ) {
    return this.usersService.unregisterDevice(userId, token);
  }

  @Get('me/devices')
  @ApiOperation({ summary: 'Get user devices' })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  async getUserDevices(@CurrentUserId() userId: string) {
    return this.usersService.getUserDevices(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'query', description: 'Search query' })
  @ApiQuery({ name: 'estate_id', description: 'Estate ID filter', required: false })
  @ApiResponse({ status: 200, description: 'Users found' })
  async searchUsers(
    @Query('query') query: string,
    @Query('estate_id') estateId?: string,
  ) {
    const validatedData = SearchUsersSchema.parse({ query, estate_id: estateId });
    return this.usersService.searchUsers(validatedData.query, validatedData.estate_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { status: 'pending' | 'active' | 'suspended' },
  ) {
    return this.usersService.updateUserStatus(userId, body.status as any);
  }

  @Get('estate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get users by estate (Admin/Security only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsersByEstate(
    @Param('estateId') estateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.usersService.getUsersByEstate(estateId, page, limit);
  }
}
