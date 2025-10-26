import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService, InitiatePaymentDto, PaymentWebhookDto } from './payments.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { Public } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

// Validation schemas
const InitiatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional(),
  payment_method: z.enum(['paystack', 'card', 'transfer']),
  purpose: z.string().min(1),
  metadata: z.any().optional(),
});

const PaymentWebhookSchema = z.object({
  event: z.string(),
  data: z.any(),
});

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async initiatePayment(
    @CurrentUserId() userId: string,
    @Body() paymentData: InitiatePaymentDto,
  ) {
    const validatedData = InitiatePaymentSchema.parse(paymentData) as InitiatePaymentDto;
    return this.paymentsService.initiatePayment(userId, validatedData);
  }

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment status' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }

  @Post('webhook/paystack')
  @Public()
  @ApiOperation({ summary: 'Paystack webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handlePaystackWebhook(@Body() webhookData: PaymentWebhookDto) {
    const validatedData = PaymentWebhookSchema.parse(webhookData) as PaymentWebhookDto;
    return this.paymentsService.handleWebhook(validatedData);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(
    @CurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.paymentsService.getPaymentHistory(userId, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(@Param('id') paymentId: string) {
    return this.paymentsService.getPaymentById(paymentId);
  }
}
