import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EstatesService, CreateEstateDto, UpdateEstateDto } from './estates.service';
import { JwtAuthGuard } from '../auth/auth.guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/custom.decorators';
import { UserRole } from '../../entities/user-profile.entity';
import { z } from 'zod';

// Validation schemas
const CreateEstateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
});

const UpdateEstateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
});

const SearchEstatesSchema = z.object({
  query: z.string().min(1),
});

@ApiTags('Estates')
@Controller('estates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EstatesController {
  constructor(private estatesService: EstatesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new estate (Admin only)' })
  @ApiResponse({ status: 201, description: 'Estate created successfully' })
  async createEstate(@Body() createData: CreateEstateDto) {
    const validatedData = CreateEstateSchema.parse(createData) as CreateEstateDto;
    return this.estatesService.createEstate(validatedData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all estates' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({ status: 200, description: 'Estates retrieved successfully' })
  async getAllEstates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.estatesService.getAllEstates(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search estates' })
  @ApiQuery({ name: 'query', description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Estates found' })
  async searchEstates(@Query('query') query: string) {
    const validatedData = SearchEstatesSchema.parse({ query });
    return this.estatesService.searchEstates(validatedData.query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get estate by ID' })
  @ApiResponse({ status: 200, description: 'Estate retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Estate not found' })
  async getEstateById(@Param('id') estateId: string) {
    return this.estatesService.getEstateById(estateId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update estate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Estate updated successfully' })
  async updateEstate(
    @Param('id') estateId: string,
    @Body() updateData: UpdateEstateDto,
  ) {
    const validatedData = UpdateEstateSchema.parse(updateData);
    return this.estatesService.updateEstate(estateId, validatedData);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete estate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Estate deleted successfully' })
  async deleteEstate(@Param('id') estateId: string) {
    return this.estatesService.deleteEstate(estateId);
  }
}
