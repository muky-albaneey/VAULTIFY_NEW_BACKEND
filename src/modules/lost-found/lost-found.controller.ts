import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LostFoundService, CreateLostFoundItemDto, UpdateLostFoundItemDto } from './lost-found.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { z } from 'zod';

const CreateLostFoundItemSchema = z.object({
  estate_id: z.string().uuid(),
  description: z.string().min(1),
  item_type: z.enum(['Lost', 'Found']),
  location: z.string().optional(),
  contact_info: z.string().optional(),
  image_url: z.string().url().optional(),
  date_reported: z.string().datetime().optional(),
});

const UpdateLostFoundItemSchema = z.object({
  description: z.string().min(1).optional(),
  location: z.string().optional(),
  contact_info: z.string().optional(),
  image_url: z.string().url().optional(),
});

@ApiTags('Lost & Found')
@Controller('lost-found')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LostFoundController {
  constructor(private lostFoundService: LostFoundService) {}

  @Post()
  @ApiOperation({ summary: 'Create lost/found item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  async createItem(
    @CurrentUserId() userId: string,
    @Body() createData: CreateLostFoundItemDto,
  ) {
    const validatedData = CreateLostFoundItemSchema.parse(createData);
    return this.lostFoundService.createItem(userId, validatedData);
  }

  @Get('estate/:estateId')
  @ApiOperation({ summary: 'Get lost/found items by estate' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  async getItemsByEstate(
    @Param('estateId') estateId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.lostFoundService.getItemsByEstate(estateId, page, limit);
  }

  @Get('search/:estateId')
  @ApiOperation({ summary: 'Search lost/found items' })
  @ApiQuery({ name: 'query', description: 'Search query' })
  @ApiQuery({ name: 'item_type', description: 'Item type filter', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchItems(
    @Param('estateId') estateId: string,
    @Query('query') query: string,
    @Query('item_type') itemType?: 'Lost' | 'Found',
  ) {
    return this.lostFoundService.searchItems(estateId, query, itemType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getItemById(@Param('id') itemId: string) {
    return this.lostFoundService.getItemById(itemId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lost/found item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateItem(
    @CurrentUserId() userId: string,
    @Param('id') itemId: string,
    @Body() updateData: UpdateLostFoundItemDto,
  ) {
    const validatedData = UpdateLostFoundItemSchema.parse(updateData);
    return this.lostFoundService.updateItem(userId, itemId, validatedData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lost/found item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async deleteItem(
    @CurrentUserId() userId: string,
    @Param('id') itemId: string,
  ) {
    return this.lostFoundService.deleteItem(userId, itemId);
  }
}
