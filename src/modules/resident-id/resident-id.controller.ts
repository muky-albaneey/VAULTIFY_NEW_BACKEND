import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResidentIdService } from './resident-id.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

const ValidateResidentIdSchema = z.object({
  token: z.string().min(1),
});

@ApiTags('Resident ID')
@Controller('resident-id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResidentIdController {
  constructor(private residentIdService: ResidentIdService) {}

  @Post('generate/:estateId')
  @ApiOperation({ summary: 'Generate resident ID QR code' })
  @ApiResponse({ status: 201, description: 'QR code generated successfully' })
  @ApiResponse({ status: 404, description: 'User or estate not found' })
  async generateResidentId(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
  ) {
    return this.residentIdService.generateResidentId(userId, estateId);
  }

  @Post('validate/:estateId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SECURITY_PERSONNEL)
  @ApiOperation({ summary: 'Validate resident ID QR code (Security only)' })
  @ApiResponse({ status: 200, description: 'QR code validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired QR code' })
  async validateResidentId(
    @Param('estateId') estateId: string,
    @Body() body: { token: string },
  ) {
    const validatedData = ValidateResidentIdSchema.parse(body);
    return this.residentIdService.validateResidentId(validatedData.token, estateId);
  }

  @Get('status/:estateId')
  @ApiOperation({ summary: 'Get resident ID status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User or estate not found' })
  async getResidentIdStatus(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
  ) {
    return this.residentIdService.getResidentIdStatus(userId, estateId);
  }

  @Post('revoke/:estateId')
  @ApiOperation({ summary: 'Revoke resident ID' })
  @ApiResponse({ status: 200, description: 'Resident ID revoked successfully' })
  @ApiResponse({ status: 404, description: 'User or estate not found' })
  async revokeResidentId(
    @CurrentUserId() userId: string,
    @Param('estateId') estateId: string,
  ) {
    return this.residentIdService.revokeResidentId(userId, estateId);
  }
}
