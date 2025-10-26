import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiceDirectoryService, CreateProviderDto, UpdateProviderDto, CreateReviewDto } from './service-directory.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

const CreateProviderSchema = z.object({
  service_id: z.string().uuid(),
  estate_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().min(1),
  location: z.string().min(1),
  availability: z.string().optional(),
  bio: z.string().optional(),
  skill: z.string().optional(),
  profile_picture_url: z.string().url().optional(),
});

const UpdateProviderSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  availability: z.string().optional(),
  bio: z.string().optional(),
  skill: z.string().optional(),
  profile_picture_url: z.string().url().optional(),
});

const CreateReviewSchema = z.object({
  reviewer_name: z.string().min(1),
  rating: z.number().min(0).max(5),
  comment: z.string().optional(),
});

@ApiTags('Service Directory')
@Controller('service-directory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceDirectoryController {
  constructor(private serviceDirectoryService: ServiceDirectoryService) {}

  @Get('services')
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getServices() {
    return this.serviceDirectoryService.getServices();
  }

  @Get('providers/service/:serviceId')
  @ApiOperation({ summary: 'Get providers by service' })
  @ApiQuery({ name: 'estate_id', description: 'Estate ID filter', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getProvidersByService(
    @Param('serviceId') serviceId: string,
    @Query('estate_id') estateId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.serviceDirectoryService.getProvidersByService(serviceId, estateId, page, limit);
  }

  @Get('providers/search')
  @ApiOperation({ summary: 'Search providers' })
  @ApiQuery({ name: 'query', description: 'Search query' })
  @ApiQuery({ name: 'estate_id', description: 'Estate ID filter', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchProviders(
    @Query('query') query: string,
    @Query('estate_id') estateId?: string,
  ) {
    return this.serviceDirectoryService.searchProviders(query, estateId);
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderById(@Param('id') providerId: string) {
    return this.serviceDirectoryService.getProviderById(providerId);
  }

  @Post('providers')
  @ApiOperation({ summary: 'Create provider' })
  @ApiResponse({ status: 201, description: 'Provider created successfully' })
  async createProvider(
    @CurrentUserId() userId: string,
    @Body() createData: CreateProviderDto,
  ) {
    const parsed = CreateProviderSchema.parse(createData) as any;
    const validatedData: CreateProviderDto = {
      service_id: parsed.service_id,
      estate_id: parsed.estate_id,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      phone: parsed.phone,
      location: parsed.location,
      availability: parsed.availability,
      bio: parsed.bio,
      skill: parsed.skill,
      profile_picture_url: parsed.profile_picture_url,
    };
    return this.serviceDirectoryService.createProvider(userId, validatedData);
  }

  @Put('providers/:id')
  @ApiOperation({ summary: 'Update provider' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async updateProvider(
    @CurrentUserId() userId: string,
    @Param('id') providerId: string,
    @Body() updateData: UpdateProviderDto,
  ) {
    const validatedData = UpdateProviderSchema.parse(updateData);
    return this.serviceDirectoryService.updateProvider(userId, providerId, validatedData);
  }

  @Delete('providers/:id')
  @ApiOperation({ summary: 'Delete provider' })
  @ApiResponse({ status: 200, description: 'Provider deleted successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async deleteProvider(
    @CurrentUserId() userId: string,
    @Param('id') providerId: string,
  ) {
    return this.serviceDirectoryService.deleteProvider(userId, providerId);
  }

  @Post('providers/:id/photos')
  @ApiOperation({ summary: 'Add provider photo' })
  @ApiResponse({ status: 201, description: 'Photo added successfully' })
  async addProviderPhoto(
    @Param('id') providerId: string,
    @Body() body: { image_url: string },
  ) {
    return this.serviceDirectoryService.addProviderPhoto(providerId, body.image_url);
  }

  @Post('providers/:id/reviews')
  @ApiOperation({ summary: 'Create provider review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(
    @Param('id') providerId: string,
    @Body() reviewData: CreateReviewDto,
  ) {
    const parsed = CreateReviewSchema.parse(reviewData) as any;
    const validatedData: CreateReviewDto = {
      reviewer_name: parsed.reviewer_name,
      rating: parsed.rating,
      comment: parsed.comment,
    };
    return this.serviceDirectoryService.createReview(providerId, validatedData);
  }

  @Get('providers/:id/reviews')
  @ApiOperation({ summary: 'Get provider reviews' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getProviderReviews(
    @Param('id') providerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.serviceDirectoryService.getProviderReviews(providerId, page, limit);
  }
}
