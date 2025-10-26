import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estate } from '../../entities/estate.entity';

export interface CreateEstateDto {
  name: string;
  email: string;
  address: string;
}

export interface UpdateEstateDto {
  name?: string;
  email?: string;
  address?: string;
}

@Injectable()
export class EstatesService {
  constructor(
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
  ) {}

  async createEstate(createData: CreateEstateDto) {
    const estate = this.estateRepository.create(createData);
    return await this.estateRepository.save(estate);
  }

  async getAllEstates(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const [estates, total] = await this.estateRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data: estates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEstateById(estateId: string) {
    const estate = await this.estateRepository.findOne({
      where: { estate_id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    return estate;
  }

  async updateEstate(estateId: string, updateData: UpdateEstateDto) {
    const estate = await this.getEstateById(estateId);
    
    Object.assign(estate, updateData);
    return await this.estateRepository.save(estate);
  }

  async deleteEstate(estateId: string) {
    const estate = await this.getEstateById(estateId);
    await this.estateRepository.remove(estate);
    return { message: 'Estate deleted successfully' };
  }

  async searchEstates(query: string) {
    return await this.estateRepository
      .createQueryBuilder('estate')
      .where('estate.name ILIKE :query OR estate.address ILIKE :query', {
        query: `%${query}%`,
      })
      .limit(20)
      .getMany();
  }
}
