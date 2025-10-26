import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { NotificationPayload } from '../../common/interfaces/common.interface';
import { z } from 'zod';

const NotificationPayloadSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.any().optional(),
  imageUrl: z.string().url().optional(),
});

const TopicSubscriptionSchema = z.object({
  tokens: z.array(z.string()),
  topic: z.string().min(1),
});

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('send/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send notification to user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotificationToUser(
    @Param('userId') userId: string,
    @Body() payload: NotificationPayload,
  ) {
    const parsed = NotificationPayloadSchema.parse(payload) as NotificationPayload;
    return this.notificationsService.sendNotificationToUser(userId, parsed);
  }

  @Post('send/estate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send notification to estate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotificationToEstate(
    @Param('estateId') estateId: string,
    @Body() payload: NotificationPayload,
  ) {
    const parsed = NotificationPayloadSchema.parse(payload) as NotificationPayload;
    return this.notificationsService.sendNotificationToEstate(estateId, parsed);
  }

  @Post('send/topic/:topic')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send notification to topic (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendTopicNotification(
    @Param('topic') topic: string,
    @Body() payload: NotificationPayload,
  ) {
    const parsed = NotificationPayloadSchema.parse(payload) as NotificationPayload;
    return this.notificationsService.sendTopicNotification(topic, parsed);
  }

  @Post('subscribe/topic')
  @ApiOperation({ summary: 'Subscribe to topic' })
  @ApiResponse({ status: 200, description: 'Subscribed successfully' })
  async subscribeToTopic(@Body() body: { tokens: string[]; topic: string }) {
    const validatedData = TopicSubscriptionSchema.parse(body);
    return this.notificationsService.subscribeToTopic(validatedData.tokens, validatedData.topic);
  }

  @Post('unsubscribe/topic')
  @ApiOperation({ summary: 'Unsubscribe from topic' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  async unsubscribeFromTopic(@Body() body: { tokens: string[]; topic: string }) {
    const validatedData = TopicSubscriptionSchema.parse(body);
    return this.notificationsService.unsubscribeFromTopic(validatedData.tokens, validatedData.topic);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get user device tokens' })
  @ApiResponse({ status: 200, description: 'Device tokens retrieved successfully' })
  async getUserDeviceTokens(@CurrentUserId() userId: string) {
    return this.notificationsService.getUserDeviceTokens(userId);
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Remove device token' })
  @ApiResponse({ status: 200, description: 'Device token removed successfully' })
  async removeDeviceToken(
    @CurrentUserId() userId: string,
    @Param('token') token: string,
  ) {
    return this.notificationsService.removeDeviceToken(userId, token);
  }

  @Post('cleanup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cleanup inactive device tokens (Admin only)' })
  @ApiQuery({ name: 'days', description: 'Days inactive threshold', required: false })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupInactiveTokens(@Query('days') days: number = 30) {
    return this.notificationsService.cleanupInactiveTokens(days);
  }
}
