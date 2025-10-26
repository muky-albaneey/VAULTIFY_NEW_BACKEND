import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UtilityBillsService, CreateUtilityAccountDto, UpdateUtilityAccountDto, PayUtilityBillDto, ValidateUtilityCustomerDto, SyncLencoVendorsDto } from './utility-bills.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

const CreateUtilityAccountSchema = z.object({
  estate_id: z.string().uuid(),
  utility_provider_id: z.string().uuid(),
  account_number: z.string().min(1),
  address: z.string().min(1),
  is_default: z.boolean().optional(),
});

const UpdateUtilityAccountSchema = z.object({
  account_number: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  is_default: z.boolean().optional(),
});

const PayUtilityBillSchema = z.object({
  payment_method: z.enum(['wallet', 'external', 'lenco']),
  amount: z.number().positive().optional(),
});

const ValidateUtilityCustomerSchema = z.object({
  product_id: z.string().min(1),
  customer_id: z.string().min(1),
});

const SyncLencoVendorsSchema = z.object({
  force_sync: z.boolean().optional(),
});

@ApiTags('Utility Bills')
@Controller('utility-bills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UtilityBillsController {
  constructor(private utilityBillsService: UtilityBillsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get utility providers' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getUtilityProviders() {
    return this.utilityBillsService.getUtilityProviders();
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get user utility accounts' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async getUserAccounts(@CurrentUserId() userId: string) {
    return this.utilityBillsService.getUserAccounts(userId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create utility account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async createUtilityAccount(
    @CurrentUserId() userId: string,
    @Body() createData: CreateUtilityAccountDto,
  ) {
    const validatedData = CreateUtilityAccountSchema.parse(createData) as CreateUtilityAccountDto;
    return this.utilityBillsService.createUtilityAccount(userId, validatedData);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update utility account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateUtilityAccount(
    @CurrentUserId() userId: string,
    @Param('id') accountId: string,
    @Body() updateData: UpdateUtilityAccountDto,
  ) {
    const validatedData = UpdateUtilityAccountSchema.parse(updateData);
    return this.utilityBillsService.updateUtilityAccount(userId, accountId, validatedData);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete utility account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deleteUtilityAccount(
    @CurrentUserId() userId: string,
    @Param('id') accountId: string,
  ) {
    return this.utilityBillsService.deleteUtilityAccount(userId, accountId);
  }

  @Get('accounts/:id/bills')
  @ApiOperation({ summary: 'Get account bills' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Bills retrieved successfully' })
  async getAccountBills(
    @Param('id') accountId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.utilityBillsService.getAccountBills(accountId, page, limit);
  }

  @Get('bills')
  @ApiOperation({ summary: 'Get user bills' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Bills retrieved successfully' })
  async getUserBills(
    @CurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.utilityBillsService.getUserBills(userId, page, limit);
  }

  @Get('bills/:id')
  @ApiOperation({ summary: 'Get bill by ID' })
  @ApiResponse({ status: 200, description: 'Bill retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async getBillById(@Param('id') billId: string) {
    return this.utilityBillsService.getBillById(billId);
  }

  @Post('bills/:id/pay')
  @ApiOperation({ summary: 'Pay utility bill' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async payUtilityBill(
    @CurrentUserId() userId: string,
    @Param('id') billId: string,
    @Body() paymentData: PayUtilityBillDto,
  ) {
    const validatedData = PayUtilityBillSchema.parse(paymentData) as PayUtilityBillDto;
    
    // Route to appropriate payment method
    if (validatedData.payment_method === 'lenco') {
      return this.utilityBillsService.payUtilityBillWithLenco(userId, billId, validatedData);
    } else {
      return this.utilityBillsService.payUtilityBill(userId, billId, validatedData);
    }
  }

  // Lenco API Integration Endpoints
  @Post('lenco/sync-vendors')
  @ApiOperation({ summary: 'Sync Lenco vendors' })
  @ApiResponse({ status: 200, description: 'Vendors synced successfully' })
  @ApiResponse({ status: 400, description: 'Failed to sync vendors' })
  async syncLencoVendors(@Body() syncData: SyncLencoVendorsDto) {
    const validatedData = SyncLencoVendorsSchema.parse(syncData);
    return this.utilityBillsService.syncLencoVendors(validatedData);
  }

  @Get('lenco/products')
  @ApiOperation({ summary: 'Get Lenco products' })
  @ApiQuery({ name: 'vendorId', description: 'Vendor ID filter', required: false })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getLencoProducts(@Query('vendorId') vendorId?: string) {
    return this.utilityBillsService.getLencoProducts(vendorId);
  }

  @Post('lenco/validate-customer')
  @ApiOperation({ summary: 'Validate utility customer' })
  @ApiResponse({ status: 200, description: 'Customer validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid customer data' })
  async validateUtilityCustomer(@Body() validationData: ValidateUtilityCustomerDto) {
    const validatedData = ValidateUtilityCustomerSchema.parse(validationData) as ValidateUtilityCustomerDto;
    return this.utilityBillsService.validateUtilityCustomer(validatedData);
  }

  @Post('lenco/webhook')
  @ApiOperation({ summary: 'Handle Lenco webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Failed to process webhook' })
  async handleLencoWebhook(@Body() webhookData: any) {
    return this.utilityBillsService.handleLencoWebhook(webhookData);
  }

  @Get('lenco/payment-status/:transactionId')
  @ApiOperation({ summary: 'Get Lenco payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Failed to fetch payment status' })
  async getLencoPaymentStatus(@Param('transactionId') transactionId: string) {
    return this.utilityBillsService.getLencoPaymentStatus(transactionId);
  }

  @Get('lenco/payment-history')
  @ApiOperation({ summary: 'Get Lenco payment history' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getLencoPaymentHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.utilityBillsService.getLencoPaymentHistory(page, limit);
  }
}
