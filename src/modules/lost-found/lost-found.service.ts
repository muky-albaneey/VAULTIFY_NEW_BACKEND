import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LostFoundItem, ItemType } from '../../entities/lost-found-item.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

export interface CreateLostFoundItemDto {
  estate_id: string;
  description: string;
  item_type: ItemType;
  location?: string;
  contact_info?: string;
  image_url?: string;
  date_reported?: Date;
}

export interface UpdateLostFoundItemDto {
  description?: string;
  location?: string;
  contact_info?: string;
  image_url?: string;
}

@Injectable()
export class LostFoundService {
  constructor(
    @InjectRepository(LostFoundItem)
    private lostFoundRepository: Repository<LostFoundItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
  ) {}

  async createItem(userId: string, createData: CreateLostFoundItemDto) {
    const { estate_id, description, item_type, location, contact_info, image_url, date_reported } = createData;

    // Verify estate exists
    const estate = await this.estateRepository.findOne({ where: { estate_id } });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const item = this.lostFoundRepository.create({
      sender_user_id: userId,
      estate_id,
      description,
      item_type,
      location,
      contact_info,
      image_url,
      date_reported: date_reported || new Date(),
    });

    return await this.lostFoundRepository.save(item);
  }

  async getItemsByEstate(estateId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [items, total] = await this.lostFoundRepository.findAndCount({
      where: { estate_id: estateId },
      relations: ['sender'],
      order: { date_reported: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getItemById(itemId: string) {
    const item = await this.lostFoundRepository.findOne({
      where: { lostfound_id: itemId },
      relations: ['sender', 'estate'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async updateItem(userId: string, itemId: string, updateData: UpdateLostFoundItemDto) {
    const item = await this.lostFoundRepository.findOne({
      where: { lostfound_id: itemId, sender_user_id: userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found or you are not the owner');
    }

    Object.assign(item, updateData);
    return await this.lostFoundRepository.save(item);
  }

  async deleteItem(userId: string, itemId: string) {
    const item = await this.lostFoundRepository.findOne({
      where: { lostfound_id: itemId, sender_user_id: userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found or you are not the owner');
    }

    await this.lostFoundRepository.remove(item);
    return { message: 'Item deleted successfully' };
  }

  async searchItems(estateId: string, query: string, itemType?: ItemType) {
    const qb = this.lostFoundRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.sender', 'sender')
      .where('item.estate_id = :estateId', { estateId })
      .andWhere('item.description ILIKE :query', { query: `%${query}%` });

    if (itemType) {
      qb.andWhere('item.item_type = :itemType', { itemType });
    }

    return await qb.orderBy('item.date_reported', 'DESC').limit(20).getMany();
  }
}
