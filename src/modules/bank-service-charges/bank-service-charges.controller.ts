import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BankServiceChargeService, CreateBankServiceChargeDto, UpdateBankServiceChargeDto, PayServiceChargeDto, UploadServiceChargeFileDto } from './bank-service-charges.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

const CreateBankServiceChargeSchema = z.object({
  service_charge: z.number().positive(),
  payment_frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  bank_name: z.string().min(1),
  account_name: z.string().min(1),
  account_number: z.string().min(1),
});

const UpdateBankServiceChargeSchema = z.object({
  service_charge: z.number().positive().optional(),
  paid_charge: z.number().min(0).optional(),
  outstanding_charge: z.number().min(0).optional(),
  payment_frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  bank_name: z.string().min(1).optional(),
  account_name: z.string().min(1).optional(),
  account_number: z.string().min(1).optional(),
});

const PayServiceChargeSchema = z.object({
  payment_method: z.enum(['wallet', 'external']),
  amount: z.number().positive().optional(),
});

const UploadServiceChargeFileSchema = z.object({
  file_url: z.string().url(),
});

@ApiTags('Bank Service Charges')
@Controller('bank-service-charges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BankServiceChargeController {
  constructor(private bankServiceChargeService: BankServiceChargeService) {}

  @Post()
  @ApiOperation({ summary: 'Create bank service charge record' })
  @ApiResponse({ status: 201, description: 'Bank service charge created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or record already exists' })
  async createBankServiceCharge(
    @CurrentUserId() userId: string,
    @Body() createData: CreateBankServiceChargeDto,
  ) {
    const validatedData = CreateBankServiceChargeSchema.parse(createData) as CreateBankServiceChargeDto;
    return this.bankServiceChargeService.createBankServiceCharge(userId, validatedData);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user bank service charge record' })
  @ApiResponse({ status: 200, description: 'Bank service charge retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bank service charge record not found' })
  async getUserBankServiceCharge(@CurrentUserId() userId: string) {
    return this.bankServiceChargeService.getUserBankServiceCharge(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update bank service charge record' })
  @ApiResponse({ status: 200, description: 'Bank service charge updated successfully' })
  @ApiResponse({ status: 404, description: 'Bank service charge record not found' })
  async updateBankServiceCharge(
    @CurrentUserId() userId: string,
    @Body() updateData: UpdateBankServiceChargeDto,
  ) {
    const validatedData = UpdateBankServiceChargeSchema.parse(updateData) as UpdateBankServiceChargeDto;
    return this.bankServiceChargeService.updateBankServiceCharge(userId, validatedData);
  }

  @Post('me/pay')
  @ApiOperation({ summary: 'Pay bank service charge' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async payServiceCharge(
    @CurrentUserId() userId: string,
    @Body() paymentData: PayServiceChargeDto,
  ) {
    const validatedData = PayServiceChargeSchema.parse(paymentData) as PayServiceChargeDto;
    return this.bankServiceChargeService.payServiceCharge(userId, validatedData);
  }

  @Post('me/files')
  @ApiOperation({ summary: 'Upload service charge file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Bank service charge record not found' })
  async uploadServiceChargeFile(
    @CurrentUserId() userId: string,
    @Body() uploadData: UploadServiceChargeFileDto,
  ) {
    const validatedData = UploadServiceChargeFileSchema.parse(uploadData) as UploadServiceChargeFileDto;
    
    // Get user's bank service charge record
    const bsc = await this.bankServiceChargeService.getUserBankServiceCharge(userId);
    
    return this.bankServiceChargeService.uploadServiceChargeFile(userId, bsc.bsc_id, validatedData);
  }

  @Get('me/files')
  @ApiOperation({ summary: 'Get service charge files' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bank service charge record not found' })
  async getServiceChargeFiles(@CurrentUserId() userId: string) {
    const bsc = await this.bankServiceChargeService.getUserBankServiceCharge(userId);
    return this.bankServiceChargeService.getServiceChargeFiles(userId, bsc.bsc_id);
  }

  @Delete('me/files/:fileId')
  @ApiOperation({ summary: 'Delete service charge file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteServiceChargeFile(
    @CurrentUserId() userId: string,
    @Param('fileId') fileId: string,
  ) {
    const bsc = await this.bankServiceChargeService.getUserBankServiceCharge(userId);
    return this.bankServiceChargeService.deleteServiceChargeFile(userId, bsc.bsc_id, fileId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bank service charges (Admin only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Bank service charges retrieved successfully' })
  async getAllBankServiceCharges(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.bankServiceChargeService.getAllBankServiceCharges(page, limit);
  }

  @Get('estate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Get bank service charges by estate (Admin/Security only)' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Bank service charges retrieved successfully' })
  async getBankServiceChargesByEstate(
    @Param('estateId') estateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.bankServiceChargeService.getBankServiceChargesByEstate(estateId, page, limit);
  }
}
