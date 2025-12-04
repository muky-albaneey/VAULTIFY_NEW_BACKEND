import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService, CreateAnnouncementDto } from './announcements.service';
import { AnnouncementType, RecipientType } from '../../entities/announcement.entity';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  announcement_type: z.enum([
    'general',
    'payment_reminder',
    'maintenance',
    'event',
    'security',
    'urgent',
  ]),
  recipient_type: z.enum([
    'all_residents',
    'security_personnel',
    'single_user',
    'specific_residents',
  ]),
  target_user_ids: z.array(z.string().uuid()).optional(),
  payment_details: z
    .object({
      amount: z.number().optional(),
      due_date: z.string().optional(),
      description: z.string().optional(),
      utility_account_id: z.string().uuid().optional(),
    })
    .optional(),
  image_urls: z.array(z.string().url()).optional(),
});

const PaymentReminderSchema = z.object({
  target_user_id: z.string().uuid(),
  amount: z.number().positive(),
  due_date: z.string(),
  description: z.string(),
  utility_account_id: z.string().uuid().optional(),
});

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create announcement (Admin only)' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid announcement data' })
  async createAnnouncement(
    @CurrentUserId() userId: string,
    @Body() createData: CreateAnnouncementDto,
  ) {
    const validatedData = CreateAnnouncementSchema.parse(createData) as CreateAnnouncementDto;
    return this.announcementsService.createAnnouncement(userId, validatedData);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my announcements' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Announcements retrieved successfully' })
  async getAnnouncements(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.announcementsService.getAnnouncements(userId, pageNum, limitNum);
  }

  @Get('sent')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get my sent announcements (Admin only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sent announcements retrieved successfully' })
  async getMySentAnnouncements(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.announcementsService.getMySentAnnouncements(userId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  @ApiResponse({ status: 200, description: 'Announcement retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async getAnnouncementById(
    @CurrentUserId() userId: string,
    @Param('id') announcementId: string,
  ) {
    return this.announcementsService.getAnnouncementById(announcementId, userId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update announcement (Admin only)' })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async updateAnnouncement(
    @CurrentUserId() userId: string,
    @Param('id') announcementId: string,
    @Body() updateData: Partial<CreateAnnouncementDto>,
  ) {
    return this.announcementsService.updateAnnouncement(announcementId, userId, updateData);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete announcement (Admin only)' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async deleteAnnouncement(
    @CurrentUserId() userId: string,
    @Param('id') announcementId: string,
  ) {
    return this.announcementsService.deleteAnnouncement(announcementId, userId);
  }

  @Post('payment-reminder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send payment reminder to resident (Admin only)' })
  @ApiResponse({ status: 201, description: 'Payment reminder sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment reminder data' })
  async sendPaymentReminder(
    @CurrentUserId() userId: string,
    @Body() body: {
      target_user_id: string;
      amount: number;
      due_date: string;
      description: string;
      utility_account_id?: string;
    },
  ) {
    const validatedData = PaymentReminderSchema.parse(body);
    return this.announcementsService.sendPaymentReminder(
      userId,
      validatedData.target_user_id,
      validatedData.amount,
      validatedData.due_date,
      validatedData.description,
      validatedData.utility_account_id,
    );
  }
}

