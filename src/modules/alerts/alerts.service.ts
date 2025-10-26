import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Alert, AlertType, UrgencyLevel } from '../../entities/alert.entity';
import { UserDeletedAlert } from '../../entities/user-deleted-alert.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateAlertDto {
  message: string;
  alert_type: AlertType;
  urgency_level: UrgencyLevel;
  recipients: any; // JSONB - can be user IDs, estate ID, or 'all'
}

export interface UpdateAlertDto {
  message?: string;
  alert_type?: AlertType;
  urgency_level?: UrgencyLevel;
  recipients?: any;
}

export interface DeleteAlertDto {
  reason?: string;
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(UserDeletedAlert)
    private userDeletedAlertRepository: Repository<UserDeletedAlert>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async createAlert(userId: string, createData: CreateAlertDto) {
    const { message, alert_type, urgency_level, recipients } = createData;

    // Verify sender exists
    const sender = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const alert = this.alertRepository.create({
      sender_user_id: userId,
      message,
      alert_type,
      urgency_level,
      recipients,
      timestamp: new Date(),
    });

    const savedAlert = await this.alertRepository.save(alert);

    // Send notifications to recipients
    await this.sendAlertNotifications(savedAlert);

    return savedAlert;
  }

  async getUserAlerts(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    // Get user's profile to determine estate
    const userProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Get alerts that are relevant to the user
    const alerts = await this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'senderProfile')
      .leftJoinAndSelect('alert.deletedByUsers', 'deletedByUsers', 'deletedByUsers.user_id = :userId', { userId })
      .where(
        '(alert.recipients::jsonb @> :userRecipients OR alert.recipients::jsonb @> :estateRecipients OR alert.recipients::jsonb @> :allRecipients)',
        {
          userRecipients: JSON.stringify({ type: 'user', user_id: userId }),
          estateRecipients: JSON.stringify({ type: 'estate', estate_id: userProfile.estate_id }),
          allRecipients: JSON.stringify({ type: 'all' }),
        }
      )
      .andWhere('deletedByUsers.user_id IS NULL')
      .orderBy('alert.timestamp', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: alerts,
      page,
      limit,
    };
  }

  async getAlertById(alertId: string, userId: string) {
    const alert = await this.alertRepository.findOne({
      where: { alert_id: alertId },
      relations: ['sender', 'sender.profile'],
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    // Check if user has access to this alert
    const userProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const hasAccess = this.checkAlertAccess(alert, userId, userProfile.estate_id);
    if (!hasAccess) {
      throw new BadRequestException('You do not have access to this alert');
    }

    return alert;
  }

  async updateAlert(alertId: string, userId: string, updateData: UpdateAlertDto) {
    const alert = await this.alertRepository.findOne({
      where: { alert_id: alertId, sender_user_id: userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found or you are not the sender');
    }

    Object.assign(alert, updateData);
    return await this.alertRepository.save(alert);
  }

  async deleteAlert(alertId: string, userId: string, deleteData: DeleteAlertDto) {
    const alert = await this.alertRepository.findOne({
      where: { alert_id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    // Check if user has access to delete this alert
    const userProfile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const hasAccess = this.checkAlertAccess(alert, userId, userProfile.estate_id);
    if (!hasAccess) {
      throw new BadRequestException('You do not have access to this alert');
    }

    // Check if user is the sender (can delete completely) or just a recipient (can only mark as deleted)
    if (alert.sender_user_id === userId) {
      // Sender can delete completely
      await this.alertRepository.remove(alert);
      return { message: 'Alert deleted successfully' };
    } else {
      // Recipient can only mark as deleted for themselves
      const existingDeletedAlert = await this.userDeletedAlertRepository.findOne({
        where: { user_id: userId, alert_id: alertId },
      });

      if (existingDeletedAlert) {
        throw new BadRequestException('Alert already deleted for you');
      }

      const userDeletedAlert = this.userDeletedAlertRepository.create({
        user_id: userId,
        alert_id: alertId,
        deleted_at: new Date(),
      });

      await this.userDeletedAlertRepository.save(userDeletedAlert);
      return { message: 'Alert marked as deleted for you' };
    }
  }

  async getEstateAlerts(estateId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const alerts = await this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'senderProfile')
      .where(
        '(alert.recipients::jsonb @> :estateRecipients OR alert.recipients::jsonb @> :allRecipients)',
        {
          estateRecipients: JSON.stringify({ type: 'estate', estate_id: estateId }),
          allRecipients: JSON.stringify({ type: 'all' }),
        }
      )
      .orderBy('alert.timestamp', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: alerts,
      page,
      limit,
    };
  }

  async getAlertStats(estateId?: string) {
    let query = this.alertRepository.createQueryBuilder('alert');

    if (estateId) {
      query = query.where(
        '(alert.recipients::jsonb @> :estateRecipients OR alert.recipients::jsonb @> :allRecipients)',
        {
          estateRecipients: JSON.stringify({ type: 'estate', estate_id: estateId }),
          allRecipients: JSON.stringify({ type: 'all' }),
        }
      );
    }

    const totalAlerts = await query.getCount();

    const alertsByType = await query
      .select('alert.alert_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.alert_type')
      .getRawMany();

    const alertsByUrgency = await query
      .select('alert.urgency_level', 'urgency')
      .addSelect('COUNT(*)', 'count')
      .groupBy('alert.urgency_level')
      .getRawMany();

    return {
      total_alerts: totalAlerts,
      alerts_by_type: alertsByType,
      alerts_by_urgency: alertsByUrgency,
    };
  }

  private async sendAlertNotifications(alert: Alert) {
    try {
      const recipients = alert.recipients;

      if (recipients.type === 'all') {
        // Send to all users
        const users = await this.userRepository.find({
          where: { status: 'active' },
        });

        for (const user of users) {
          await this.notificationsService.sendNotificationToUser(user.user_id, {
            title: `Alert: ${alert.alert_type}`,
            body: alert.message,
            data: {
              type: 'alert',
              alert_id: alert.alert_id,
              urgency_level: alert.urgency_level,
            },
          });
        }
      } else if (recipients.type === 'estate') {
        // Send to all users in the estate
        const users = await this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.profile', 'profile')
          .where('profile.estate_id = :estateId', { estateId: recipients.estate_id })
          .andWhere('user.status = :status', { status: 'active' })
          .getMany();

        for (const user of users) {
          await this.notificationsService.sendNotificationToUser(user.user_id, {
            title: `Estate Alert: ${alert.alert_type}`,
            body: alert.message,
            data: {
              type: 'estate_alert',
              alert_id: alert.alert_id,
              estate_id: recipients.estate_id,
              urgency_level: alert.urgency_level,
            },
          });
        }
      } else if (recipients.type === 'user' && recipients.user_ids) {
        // Send to specific users
        for (const userId of recipients.user_ids) {
          await this.notificationsService.sendNotificationToUser(userId, {
            title: `Personal Alert: ${alert.alert_type}`,
            body: alert.message,
            data: {
              type: 'personal_alert',
              alert_id: alert.alert_id,
              urgency_level: alert.urgency_level,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  private checkAlertAccess(alert: Alert, userId: string, estateId: string): boolean {
    const recipients = alert.recipients;

    if (recipients.type === 'all') {
      return true;
    } else if (recipients.type === 'estate' && recipients.estate_id === estateId) {
      return true;
    } else if (recipients.type === 'user' && recipients.user_ids?.includes(userId)) {
      return true;
    }

    return false;
  }
}
