import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../entities/service.entity';
import { Provider } from '../../entities/provider.entity';
import { ProviderPhoto } from '../../entities/provider-photo.entity';
import { ProviderReview } from '../../entities/provider-review.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

export interface CreateProviderDto {
  service_id: string;
  estate_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  availability?: string;
  bio?: string;
  skill?: string;
  profile_picture_url?: string;
  photos?: string[]; // Array of image URLs (up to 5)
}

export interface UpdateProviderDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  availability?: string;
  bio?: string;
  skill?: string;
  profile_picture_url?: string;
}

export interface CreateReviewDto {
  reviewer_name: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ServiceDirectoryService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(ProviderPhoto)
    private providerPhotoRepository: Repository<ProviderPhoto>,
    @InjectRepository(ProviderReview)
    private providerReviewRepository: Repository<ProviderReview>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
  ) {}

  async getServices() {
    return await this.serviceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getProvidersByService(serviceId: string, estateId?: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const qb = this.providerRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.service', 'service')
      .leftJoinAndSelect('provider.photos', 'photos')
      .leftJoinAndSelect('provider.reviews', 'reviews')
      .where('provider.service_id = :serviceId', { serviceId });

    if (estateId) {
      qb.andWhere('provider.estate_id = :estateId', { estateId });
    }

    const [providers, total] = await qb
      .orderBy('provider.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: providers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProviderById(providerId: string) {
    const provider = await this.providerRepository.findOne({
      where: { provider_id: providerId },
      relations: ['service', 'photos', 'reviews', 'admin', 'estate'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  async createProvider(userId: string, createData: CreateProviderDto) {
    const { service_id, estate_id, first_name, last_name, phone, location, availability, bio, skill, profile_picture_url, photos } = createData;

    // Verify service exists
    const service = await this.serviceRepository.findOne({ where: { service_id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Verify estate exists
    const estate = await this.estateRepository.findOne({ where: { estate_id } });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Validate photos (max 5)
    if (photos && photos.length > 5) {
      throw new BadRequestException('Maximum 5 photos allowed per provider');
    }

    const provider = this.providerRepository.create({
      service_id,
      admin_user_id: userId,
      estate_id,
      first_name,
      last_name,
      phone,
      location,
      availability,
      bio,
      skill,
      profile_picture_url,
    });

    const savedProvider = await this.providerRepository.save(provider);

    // Add photos if provided
    if (photos && photos.length > 0) {
      for (const imageUrl of photos) {
        const photo = this.providerPhotoRepository.create({
          provider_id: savedProvider.provider_id,
          image_url: imageUrl,
        });
        await this.providerPhotoRepository.save(photo);
      }
    }

    // Return provider with photos
    return await this.providerRepository.findOne({
      where: { provider_id: savedProvider.provider_id },
      relations: ['service', 'photos', 'reviews'],
    });
  }

  async updateProvider(userId: string, providerId: string, updateData: UpdateProviderDto) {
    const provider = await this.providerRepository.findOne({
      where: { provider_id: providerId, admin_user_id: userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found or you are not the admin');
    }

    Object.assign(provider, updateData);
    return await this.providerRepository.save(provider);
  }

  async deleteProvider(userId: string, providerId: string) {
    const provider = await this.providerRepository.findOne({
      where: { provider_id: providerId, admin_user_id: userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found or you are not the admin');
    }

    await this.providerRepository.remove(provider);
    return { message: 'Provider deleted successfully' };
  }

  async addProviderPhoto(providerId: string, imageUrl: string) {
    const provider = await this.providerRepository.findOne({ 
      where: { provider_id: providerId },
      relations: ['photos'],
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Check if provider already has 5 photos
    const existingPhotosCount = provider.photos?.length || 0;
    if (existingPhotosCount >= 5) {
      throw new BadRequestException('Maximum 5 photos allowed per provider. Please delete an existing photo first.');
    }

    const photo = this.providerPhotoRepository.create({
      provider_id: providerId,
      image_url: imageUrl,
    });

    return await this.providerPhotoRepository.save(photo);
  }

  async deleteProviderPhoto(providerId: string, photoId: string) {
    const photo = await this.providerPhotoRepository.findOne({
      where: { provider_photo_id: photoId, provider_id: providerId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found or does not belong to this provider');
    }

    await this.providerPhotoRepository.remove(photo);
    return { message: 'Photo deleted successfully' };
  }

  async createReview(providerId: string, reviewData: CreateReviewDto) {
    const { reviewer_name, rating, comment } = reviewData;

    if (rating < 0 || rating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

    const provider = await this.providerRepository.findOne({ where: { provider_id: providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const review = this.providerReviewRepository.create({
      provider_id: providerId,
      reviewer_name,
      rating,
      comment,
    });

    return await this.providerReviewRepository.save(review);
  }

  async getProviderReviews(providerId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [reviews, total] = await this.providerReviewRepository.findAndCount({
      where: { provider_id: providerId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchProviders(query: string, estateId?: string) {
    const qb = this.providerRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.service', 'service')
      .leftJoinAndSelect('provider.photos', 'photos')
      .where(
        '(provider.first_name ILIKE :query OR provider.last_name ILIKE :query OR provider.skill ILIKE :query OR service.name ILIKE :query)',
        { query: `%${query}%` }
      );

    if (estateId) {
      qb.andWhere('provider.estate_id = :estateId', { estateId });
    }

    return await qb.orderBy('provider.created_at', 'DESC').limit(20).getMany();
  }
}
