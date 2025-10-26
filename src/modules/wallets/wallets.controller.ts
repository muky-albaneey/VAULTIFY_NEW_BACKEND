import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WalletsService, TopUpWalletDto, WalletTransferDto, WalletTransactionHistoryDto } from './wallets.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

// Validation schemas
const TopUpWalletSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(['paystack', 'card', 'transfer']),
});

const WalletTransferSchema = z.object({
  recipient_user_id: z.string().uuid(),
  amount: z.number().positive(),
  purpose: z.string().min(1),
});

const WalletTransactionHistorySchema = z.object({
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  purpose: z.enum(['top_up', 'subscription_payment', 'utility_payment', 'refund', 'transfer']).optional(),
  direction: z.enum(['credit', 'debit']).optional(),
  status: z.enum(['pending', 'success', 'failed']).optional(),
});

@ApiTags('Wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get user wallet' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  async getWallet(@CurrentUserId() userId: string) {
    return this.walletsService.getWallet(userId);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiQuery({ name: 'purpose', description: 'Transaction purpose filter', required: false })
  @ApiQuery({ name: 'direction', description: 'Transaction direction filter', required: false })
  @ApiQuery({ name: 'status', description: 'Transaction status filter', required: false })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  async getTransactionHistory(
    @CurrentUserId() userId: string,
    @Query() filters: WalletTransactionHistoryDto,
  ) {
    const validatedFilters = WalletTransactionHistorySchema.parse(filters);
    return this.walletsService.getTransactionHistory(userId, validatedFilters);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Top up wallet' })
  @ApiResponse({ status: 201, description: 'Top up initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid amount or payment method' })
  async topUpWallet(
    @CurrentUserId() userId: string,
    @Body() topUpData: TopUpWalletDto,
  ) {
    const parsed = TopUpWalletSchema.parse(topUpData) as any;
    const validatedData: TopUpWalletDto = {
      amount: parsed.amount,
      payment_method: parsed.payment_method,
    };
    return this.walletsService.topUpWallet(userId, validatedData);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money to another user' })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transfer data or insufficient balance' })
  async transferToUser(
    @CurrentUserId() userId: string,
    @Body() transferData: WalletTransferDto,
  ) {
    const parsed = WalletTransferSchema.parse(transferData) as any;
    const validatedData: WalletTransferDto = {
      recipient_user_id: parsed.recipient_user_id,
      amount: parsed.amount,
      purpose: parsed.purpose,
    };
    return this.walletsService.transferToUser(userId, validatedData);
  }
}
