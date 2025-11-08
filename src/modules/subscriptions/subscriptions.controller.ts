import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService, ActivateSubscriptionDto, AddFamilyMemberDto, RemoveFamilyMemberDto, GrantFreeSubscriptionDto } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

// Validation schemas
const ActivateSubscriptionSchema = z.object({
  plan_id: z.string().uuid(),
  payment_method: z.enum(['wallet', 'external']),
});

const AddFamilyMemberSchema = z.object({
  user_id: z.string().uuid(),
});

const RemoveFamilyMemberSchema = z.object({
  user_id: z.string().uuid(),
});

const RenewSubscriptionSchema = z.object({
  payment_method: z.enum(['wallet', 'external']),
});

const GrantFreeSubscriptionSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  duration_days: z.number().positive().min(1),
});

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getAvailablePlans() {
    return this.subscriptionsService.getAvailablePlans();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getAllSubscriptions(@CurrentUserId() userId: string) {
    return this.subscriptionsService.getAllSubscriptions(userId);
  }

  @Get('me/active')
  @ApiOperation({ summary: 'Get active subscription' })
  @ApiResponse({ status: 200, description: 'Active subscription retrieved successfully' })
  async getActiveSubscription(@CurrentUserId() userId: string) {
    return this.subscriptionsService.getActiveSubscription(userId);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate subscription' })
  @ApiResponse({ status: 201, description: 'Subscription activated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  async activateSubscription(
    @CurrentUserId() userId: string,
    @Body() activationData: ActivateSubscriptionDto,
  ) {
    const validatedData = ActivateSubscriptionSchema.parse(activationData) as ActivateSubscriptionDto;
    return this.subscriptionsService.activateSubscription(userId, validatedData);
  }

  @Put('renew')
  @ApiOperation({ summary: 'Renew subscription' })
  @ApiResponse({ status: 200, description: 'Subscription renewed successfully' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async renewSubscription(
    @CurrentUserId() userId: string,
    @Body() body: { payment_method: 'wallet' | 'external' },
  ) {
    const validatedData = RenewSubscriptionSchema.parse(body);
    return this.subscriptionsService.renewSubscription(userId, validatedData.payment_method);
  }

  @Put('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async cancelSubscription(@CurrentUserId() userId: string) {
    return this.subscriptionsService.cancelSubscription(userId);
  }

  @Get('family/group')
  @ApiOperation({ summary: 'Get family group' })
  @ApiResponse({ status: 200, description: 'Family group retrieved successfully' })
  async getFamilyGroup(@CurrentUserId() userId: string) {
    return this.subscriptionsService.getFamilyGroup(userId);
  }

  @Post('family/members')
  @ApiOperation({ summary: 'Add family member' })
  @ApiResponse({ status: 201, description: 'Family member added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid member data' })
  async addFamilyMember(
    @CurrentUserId() userId: string,
    @Body() memberData: AddFamilyMemberDto,
  ) {
    const validatedData = AddFamilyMemberSchema.parse(memberData) as AddFamilyMemberDto;
    return this.subscriptionsService.addFamilyMember(userId, validatedData);
  }

  @Delete('family/members')
  @ApiOperation({ summary: 'Remove family member' })
  @ApiResponse({ status: 200, description: 'Family member removed successfully' })
  @ApiResponse({ status: 404, description: 'Family member not found' })
  async removeFamilyMember(
    @CurrentUserId() userId: string,
    @Body() memberData: RemoveFamilyMemberDto,
  ) {
    const validatedData = RemoveFamilyMemberSchema.parse(memberData) as RemoveFamilyMemberDto;
    return this.subscriptionsService.removeFamilyMember(userId, validatedData);
  }

  @Post('admin/grant-free')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Grant free subscription to user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Free subscription granted successfully' })
  @ApiResponse({ status: 400, description: 'User already has active subscription' })
  async grantFreeSubscription(
    @CurrentUserId() adminUserId: string,
    @Body() grantData: GrantFreeSubscriptionDto,
  ) {
    const validatedData = GrantFreeSubscriptionSchema.parse(grantData) as GrantFreeSubscriptionDto;
    return this.subscriptionsService.grantFreeSubscription(adminUserId, validatedData);
  }

  @Post('admin/check-expired')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually check and update expired subscriptions (Super Admin/Estate Admin only)' })
  @ApiResponse({ status: 200, description: 'Expiration check completed' })
  async checkExpiredSubscriptions() {
    return this.subscriptionsService.checkAndUpdateExpiredSubscriptions();
  }
}
