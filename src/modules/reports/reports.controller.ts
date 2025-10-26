import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, CreateReportDto, UpdateReportDto, UpdateReportStatusDto } from './reports.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

const CreateReportSchema = z.object({
  estate_id: z.string().uuid(),
  category: z.enum(['Maintenance', 'Security', 'Noise/Nuisance', 'Water', 'Power', 'Cleaning', 'Parking', 'Billing', 'Other']),
  subject: z.string().min(1),
  details: z.string().min(1),
  location: z.string().optional(),
  urgency: z.enum(['Low', 'Medium', 'High', 'Emergency']),
  contact_preference: z.enum(['In-app only', 'Phone', 'Email']).optional(),
  attachments: z.any().optional(),
  occurred_on: z.string().datetime().optional(),
  anonymize_report: z.boolean().optional(),
  allow_sharing: z.boolean().optional(),
});

const UpdateReportSchema = z.object({
  subject: z.string().min(1).optional(),
  details: z.string().min(1).optional(),
  location: z.string().optional(),
  urgency: z.enum(['Low', 'Medium', 'High', 'Emergency']).optional(),
  contact_preference: z.enum(['In-app only', 'Phone', 'Email']).optional(),
  attachments: z.any().optional(),
  occurred_on: z.string().datetime().optional(),
  anonymize_report: z.boolean().optional(),
  allow_sharing: z.boolean().optional(),
});

const UpdateReportStatusSchema = z.object({
  status: z.enum(['Open', 'Acknowledged', 'In Progress', 'Waiting on Resident', 'Resolved', 'Closed', 'Reopened']).default('Open'),
  assigned_to: z.string().optional(),
  sla_target: z.string().datetime().optional(),
});

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(
    @CurrentUserId() userId: string,
    @Body() createData: CreateReportDto,
  ) {
    const parsed = CreateReportSchema.parse(createData) as any;
    const validatedData: CreateReportDto = {
      estate_id: parsed.estate_id,
      category: parsed.category,
      subject: parsed.subject,
      details: parsed.details,
      location: parsed.location,
      urgency: parsed.urgency,
      contact_preference: parsed.contact_preference,
      attachments: parsed.attachments,
      occurred_on: parsed.occurred_on ? new Date(parsed.occurred_on) : undefined,
      anonymize_report: parsed.anonymize_report,
      allow_sharing: parsed.allow_sharing,
    };
    return this.reportsService.createReport(userId, validatedData);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user reports' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getUserReports(
    @CurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.reportsService.getUserReports(userId, page, limit);
  }

  @Get('estate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get estate reports (Admin/Security only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getEstateReports(
    @Param('estateId') estateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.reportsService.getEstateReports(estateId, page, limit);
  }

  @Get('search/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Search reports (Admin/Security only)' })
  @ApiQuery({ name: 'query', description: 'Search query' })
  @ApiQuery({ name: 'category', description: 'Category filter', required: false })
  @ApiQuery({ name: 'status', description: 'Status filter', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchReports(
    @Param('estateId') estateId: string,
    @Query('query') query: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.searchReports(estateId, query, category as any, status as any);
  }

  @Get('status/:estateId/:status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get reports by status (Admin/Security only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReportsByStatus(
    @Param('estateId') estateId: string,
    @Param('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.reportsService.getReportsByStatus(estateId, status as any, page, limit);
  }

  @Get('overdue/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get overdue reports (Admin/Security only)' })
  @ApiResponse({ status: 200, description: 'Overdue reports retrieved successfully' })
  async getOverdueReports(@Param('estateId') estateId: string) {
    return this.reportsService.getOverdueReports(estateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id') reportId: string) {
    return this.reportsService.getReportById(reportId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update report' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @CurrentUserId() userId: string,
    @Param('id') reportId: string,
    @Body() updateData: UpdateReportDto,
  ) {
    const parsed = UpdateReportSchema.parse(updateData) as any;
    const validatedData: UpdateReportDto = {
      subject: parsed.subject,
      details: parsed.details,
      location: parsed.location,
      urgency: parsed.urgency,
      contact_preference: parsed.contact_preference,
      attachments: parsed.attachments,
      occurred_on: parsed.occurred_on ? new Date(parsed.occurred_on) : undefined,
      anonymize_report: parsed.anonymize_report,
      allow_sharing: parsed.allow_sharing,
    };
    return this.reportsService.updateReport(userId, reportId, validatedData);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Update report status (Admin/Security only)' })
  @ApiResponse({ status: 200, description: 'Report status updated successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReportStatus(
    @Param('id') reportId: string,
    @Body() statusData: UpdateReportStatusDto,
  ) {
    const parsed = UpdateReportStatusSchema.parse(statusData) as any;
    const validatedData: UpdateReportStatusDto = {
      status: parsed.status || parsed.status,
      assigned_to: parsed.assigned_to,
      sla_target: parsed.sla_target ? new Date(parsed.sla_target) : undefined,
    };
    return this.reportsService.updateReportStatus(reportId, validatedData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(
    @CurrentUserId() userId: string,
    @Param('id') reportId: string,
  ) {
    return this.reportsService.deleteReport(userId, reportId);
  }
}
