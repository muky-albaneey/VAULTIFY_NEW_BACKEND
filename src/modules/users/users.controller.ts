import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto, RegisterDeviceDto } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ApartmentType } from '../../entities/user-profile.entity';
import { UserStatus } from '../../entities/user.entity';
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user status (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { status: 'pending' | 'active' | 'suspended' },
  ) {
    return this.usersService.updateUserStatus(userId, body.status as any);
  }

  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate user account (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  async activateUser(@Param('id') userId: string) {
    return this.usersService.updateUserStatus(userId, UserStatus.ACTIVE);
  }

  @Put(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend user account (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  async suspendUser(@Param('id') userId: string) {
    return this.usersService.updateUserStatus(userId, UserStatus.SUSPENDED);
  }

  @Get('estate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get users by estate (Admin/Security/Super Admin only)' })
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

  @Put(':id/assign-estate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign estate to user (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Estate assigned successfully' })
  async assignEstateToUser(
    @Param('id') userId: string,
    @Body() body: {
      estate_id: string;
      role: UserRole;
      apartment_type?: ApartmentType;
      house_address?: string;
      phone_number?: string;
    },
  ) {
    return this.usersService.assignEstateToUser(
      userId,
      body.estate_id,
      body.role,
      body.apartment_type,
      body.house_address,
      body.phone_number,
    );
  }

  @Put(':id/make-admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Make user estate admin (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User promoted to Estate Admin' })
  async makeEstateAdmin(
    @Param('id') userId: string,
    @Body() body: { estate_id: string },
  ) {
    return this.usersService.makeEstateAdmin(userId, body.estate_id);
  }

  @Put(':id/make-super-admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Make user super admin (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User promoted to Super Admin' })
  async makeSuperAdmin(
    @Param('id') userId: string,
    @Body() body: { confirm: boolean },
  ) {
    if (!body.confirm) {
      throw new BadRequestException('Confirmation required');
    }
    return this.usersService.makeSuperAdmin(userId);
  }
}
