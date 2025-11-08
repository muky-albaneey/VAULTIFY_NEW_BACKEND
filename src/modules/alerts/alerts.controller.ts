import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertsService, CreateAlertDto, UpdateAlertDto, DeleteAlertDto } from './alerts.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

const CreateAlertSchema = z.object({
  message: z.string().min(1),
  alert_type: z.enum(['general', 'emergency', 'maintenance', 'security', 'utility']),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']),
  recipients: z.any(), // JSONB - flexible structure
});

const UpdateAlertSchema = z.object({
  message: z.string().min(1).optional(),
  alert_type: z.enum(['general', 'emergency', 'maintenance', 'security', 'utility']).optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  recipients: z.any().optional(),
});

const DeleteAlertSchema = z.object({
  reason: z.string().optional(),
});

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create alert (All residents can send alerts to their estate)' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid alert data' })
  async createAlert(
    @CurrentUserId() userId: string,
    @Body() createData: CreateAlertDto,
  ) {
    const validatedData = CreateAlertSchema.parse(createData) as CreateAlertDto;
    return this.alertsService.createAlert(userId, validatedData);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user alerts' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getUserAlerts(
    @CurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.alertsService.getUserAlerts(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlertById(
    @CurrentUserId() userId: string,
    @Param('id') alertId: string,
  ) {
    return this.alertsService.getAlertById(alertId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update alert (Only sender can update their own alert)' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateAlert(
    @CurrentUserId() userId: string,
    @Param('id') alertId: string,
    @Body() updateData: UpdateAlertDto,
  ) {
    const validatedData = UpdateAlertSchema.parse(updateData) as UpdateAlertDto;
    return this.alertsService.updateAlert(alertId, userId, validatedData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async deleteAlert(
    @CurrentUserId() userId: string,
    @Param('id') alertId: string,
    @Body() deleteData: DeleteAlertDto,
  ) {
    const validatedData = DeleteAlertSchema.parse(deleteData);
    return this.alertsService.deleteAlert(alertId, userId, validatedData);
  }

  @Get('estate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get estate alerts (Admin/Security only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Estate alerts retrieved successfully' })
  async getEstateAlerts(
    @Param('estateId') estateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.alertsService.getEstateAlerts(estateId, page, limit);
  }

  @Get('stats/:estateId?')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get alert statistics (Admin/Security only)' })
  @ApiResponse({ status: 200, description: 'Alert statistics retrieved successfully' })
  async getAlertStats(@Param('estateId') estateId?: string) {
    return this.alertsService.getAlertStats(estateId);
  }
}
