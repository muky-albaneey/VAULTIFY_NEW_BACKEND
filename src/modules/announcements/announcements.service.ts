import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement, AnnouncementType, RecipientType } from '../../entities/announcement.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { UserProfile, UserRole } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  announcement_type: AnnouncementType;
  recipient_type: RecipientType;
  target_user_ids?: string[];
  payment_details?: {
    amount?: number;
    due_date?: string;
    description?: string;
    utility_account_id?: string;
  };
  image_urls?: string[]; // Optional array of image URLs
}

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    private notificationsService: NotificationsService,
  ) {}

  async createAnnouncement(userId: string, createData: CreateAnnouncementDto) {
    const { title, message, announcement_type, recipient_type, target_user_ids, payment_details, image_urls } = createData;

    // Get sender's profile to verify admin role and get estate
    const senderProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!senderProfile) {
      throw new NotFoundException('User profile not found');
    }

    if (senderProfile.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only estate admins can create announcements');
    }

    // Verify estate exists
    const estate = await this.estateRepository.findOne({
      where: { estate_id: senderProfile.estate_id },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Validate target users if specified
    if (
      recipient_type === RecipientType.SINGLE_USER ||
      recipient_type === RecipientType.SPECIFIC_RESIDENTS
    ) {
      if (!target_user_ids || target_user_ids.length === 0) {
        throw new BadRequestException('Target user IDs are required for this recipient type');
      }

      // Verify all target users belong to the same estate
      for (const targetUserId of target_user_ids) {
        const targetProfile = await this.userProfileRepository.findOne({
          where: { user_id: targetUserId },
        });

        if (!targetProfile) {
          throw new NotFoundException(`User ${targetUserId} not found`);
        }

        if (targetProfile.estate_id !== senderProfile.estate_id) {
          throw new BadRequestException(
            `User ${targetUserId} does not belong to your estate`
          );
        }
      }
    }

    // Create announcement
    const announcement = this.announcementRepository.create({
      sender_user_id: userId,
      estate_id: senderProfile.estate_id,
      title,
      message,
      announcement_type,
      recipient_type,
      target_user_ids,
      payment_details,
      image_urls: image_urls || null,
    });

    const savedAnnouncement = await this.announcementRepository.save(announcement);

    // Send notifications to recipients
    await this.sendAnnouncementNotifications(savedAnnouncement);

    return savedAnnouncement;
  }

  async getAnnouncements(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    // Get user's profile to determine estate
    const userProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    let query = this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'senderProfile')
      .where('announcement.estate_id = :estateId', {
        estateId: userProfile.estate_id,
      })
      .andWhere('announcement.is_active = true');

    // Build conditions based on recipient type
    const conditions: string[] = [];
    const params: any = { estateId: userProfile.estate_id };

    // Condition 1: All residents always see ALL_RESIDENTS announcements
    conditions.push('announcement.recipient_type = :allResidents');
    params.allResidents = RecipientType.ALL_RESIDENTS;

    // Condition 2: Security personnel see SECURITY_PERSONNEL announcements
    if (userProfile.role === UserRole.SECURITY_PERSONNEL) {
      conditions.push('announcement.recipient_type = :securityType');
      params.securityType = RecipientType.SECURITY_PERSONNEL;
    }

    // Condition 3: User sees SINGLE_USER announcements if they are the target
    conditions.push(
      `(announcement.recipient_type = :singleUserType AND announcement.target_user_ids::jsonb @> :userId)`
    );
    params.singleUserType = RecipientType.SINGLE_USER;
    params.userId = JSON.stringify(userId);

    // Condition 4: User sees SPECIFIC_RESIDENTS announcements if they are in target list
    conditions.push(
      `(announcement.recipient_type = :specificType AND announcement.target_user_ids::jsonb @> :userId)`
    );
    params.specificType = RecipientType.SPECIFIC_RESIDENTS;

    // Apply all conditions with OR
    query = query.andWhere(`(${conditions.join(' OR ')})`, params);

    const [announcements, total] = await query
      .orderBy('announcement.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: announcements,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAnnouncementById(announcementId: string, userId: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { announcement_id: announcementId },
      relations: ['sender', 'sender.profile', 'estate'],
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if user has access to this announcement
    const userProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!userProfile || userProfile.estate_id !== announcement.estate_id) {
      throw new UnauthorizedException('You do not have access to this announcement');
    }

    // Verify user should see this announcement based on recipient type
    const hasAccess = this.checkAnnouncementAccess(announcement, userId, userProfile.role);
    if (!hasAccess) {
      throw new UnauthorizedException('You do not have access to this announcement');
    }

    return announcement;
  }

  async getMySentAnnouncements(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const announcements = await this.announcementRepository.find({
      where: { sender_user_id: userId },
      relations: ['estate'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: announcements,
      page,
      limit,
    };
  }

  async updateAnnouncement(announcementId: string, userId: string, updateData: Partial<CreateAnnouncementDto>) {
    const announcement = await this.announcementRepository.findOne({
      where: { announcement_id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.sender_user_id !== userId) {
      throw new UnauthorizedException('You can only update your own announcements');
    }

    Object.assign(announcement, updateData);
    return await this.announcementRepository.save(announcement);
  }

  async deleteAnnouncement(announcementId: string, userId: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { announcement_id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.sender_user_id !== userId) {
      throw new UnauthorizedException('You can only delete your own announcements');
    }

    // Soft delete by setting is_active to false
    announcement.is_active = false;
    return await this.announcementRepository.save(announcement);
  }

  async sendPaymentReminder(
    userId: string,
    targetUserId: string,
    amount: number,
    dueDate: string,
    description: string,
    utilityAccountId?: string,
  ) {
    // Verify sender is admin
    const senderProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!senderProfile || senderProfile.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only estate admins can send payment reminders');
    }

    // Verify target user belongs to the same estate
    const targetProfile = await this.userProfileRepository.findOne({
      where: { user_id: targetUserId },
    });

    if (!targetProfile) {
      throw new NotFoundException('Target user not found');
    }

    if (targetProfile.estate_id !== senderProfile.estate_id) {
      throw new BadRequestException('Target user does not belong to your estate');
    }

    // Create payment reminder announcement
    const announcement = this.announcementRepository.create({
      sender_user_id: userId,
      estate_id: senderProfile.estate_id,
      title: `Payment Reminder - ${description}`,
      message: `This is a reminder that you have a payment of ₦${amount.toLocaleString()} due by ${dueDate}. ${description}`,
      announcement_type: AnnouncementType.PAYMENT_REMINDER,
      recipient_type: RecipientType.SINGLE_USER,
      target_user_ids: [targetUserId],
      payment_details: {
        amount,
        due_date: dueDate,
        description,
        utility_account_id: utilityAccountId,
      },
    });

    const savedAnnouncement = await this.announcementRepository.save(announcement);

    // Send notification to the specific user
    await this.notificationsService.sendNotificationToUser(targetUserId, {
      title: `Payment Reminder`,
      body: `Payment of ₦${amount.toLocaleString()} due by ${dueDate}`,
      data: {
        type: 'payment_reminder',
        announcement_id: savedAnnouncement.announcement_id,
        amount,
        due_date: dueDate,
      },
    });

    return savedAnnouncement;
  }

  private async sendAnnouncementNotifications(announcement: Announcement) {
    try {
      const users = await this.getRecipients(announcement);

      for (const user of users) {
        await this.notificationsService.sendNotificationToUser(user.user_id, {
          title: announcement.title,
          body: announcement.message,
          data: {
            type: 'announcement',
            announcement_id: announcement.announcement_id,
            announcement_type: announcement.announcement_type,
          },
        });
      }
    } catch (error) {
      console.error('Error sending announcement notifications:', error);
    }
  }

  private async getRecipients(announcement: Announcement): Promise<User[]> {
    switch (announcement.recipient_type) {
      case RecipientType.ALL_RESIDENTS:
        // Get all residents in the estate
        return await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.profile', 'profile')
          .where('profile.estate_id = :estateId', { estateId: announcement.estate_id })
          .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
          .getMany();

      case RecipientType.SECURITY_PERSONNEL:
        // Get all security personnel in the estate
        return await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.profile', 'profile')
          .where('profile.estate_id = :estateId', { estateId: announcement.estate_id })
          .andWhere('profile.role = :role', { role: UserRole.SECURITY_PERSONNEL })
          .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
          .getMany();

      case RecipientType.SINGLE_USER:
      case RecipientType.SPECIFIC_RESIDENTS:
        // Get specific users
        if (!announcement.target_user_ids || announcement.target_user_ids.length === 0) {
          return [];
        }
        return await this.userRepository.find({
          where: {
            user_id: announcement.target_user_ids as any,
            status: UserStatus.ACTIVE,
          },
        });

      default:
        return [];
    }
  }

  private checkAnnouncementAccess(
    announcement: Announcement,
    userId: string,
    userRole: UserRole,
  ): boolean {
    switch (announcement.recipient_type) {
      case RecipientType.ALL_RESIDENTS:
        return true;

      case RecipientType.SECURITY_PERSONNEL:
        return userRole === UserRole.SECURITY_PERSONNEL;

      case RecipientType.SINGLE_USER:
      case RecipientType.SPECIFIC_RESIDENTS:
        return announcement.target_user_ids?.includes(userId) || false;

      default:
        return false;
    }
  }
}

