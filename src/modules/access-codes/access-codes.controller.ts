import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccessCodesService, CreateAccessCodeDto } from './access-codes.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

const CreateAccessCodeSchema = z.object({
  visitor_name: z.string().min(1),
  visitor_email: z.string().email().optional(),
  visitor_phone: z.string().optional(),
  valid_from: z.string().datetime(),
  valid_to: z.string().datetime(),
  max_uses: z.number().positive().optional(),
  gate: z.string().optional(),
  notify_on_use: z.boolean().optional(),
});

@ApiTags('Access Codes')
@Controller('access-codes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccessCodesController {
  constructor(private accessCodesService: AccessCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create access code' })
  @ApiResponse({ status: 201, description: 'Access code created successfully' })
  async createAccessCode(
    @CurrentUserId() userId: string,
    @Body() createData: CreateAccessCodeDto,
  ) {
    const validatedData = CreateAccessCodeSchema.parse(createData);
    return this.accessCodesService.createAccessCode(userId, validatedData);
  }

  @Get()
  @ApiOperation({ summary: 'Get user access codes' })
  @ApiResponse({ status: 200, description: 'Access codes retrieved successfully' })
  async getAccessCodes(@CurrentUserId() userId: string) {
    return this.accessCodesService.getAccessCodes(userId);
  }

  @Post('validate/:code')
  @ApiOperation({ summary: 'Validate access code' })
  @ApiResponse({ status: 200, description: 'Access code validated successfully' })
  async validateAccessCode(@Param('code') code: string) {
    return this.accessCodesService.validateAccessCode(code);
  }

  @Put(':code/deactivate')
  @ApiOperation({ summary: 'Deactivate access code' })
  @ApiResponse({ status: 200, description: 'Access code deactivated successfully' })
  async deactivateAccessCode(
    @CurrentUserId() userId: string,
    @Param('code') code: string,
  ) {
    return this.accessCodesService.deactivateAccessCode(userId, code);
  }
}
