import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DeviceToken } from '../../entities/device-token.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { NotificationPayload } from '../../common/interfaces/common.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const credentialsJson = this.configService.get('app.firebase.credentialsJson');
      
      let credential;
      
      if (credentialsJson) {
        // Use JSON credentials from environment variable
        try {
          const credentials = JSON.parse(credentialsJson);
          credential = admin.credential.cert(credentials);
          this.logger.log('Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS_JSON');
        } catch (parseError) {
          this.logger.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', parseError);
          return;
        }
      } else {
        // Fallback to individual credentials
        const firebaseConfig = {
          projectId: this.configService.get('app.firebase.projectId'),
          privateKey: this.configService.get('app.firebase.privateKey'),
          clientEmail: this.configService.get('app.firebase.clientEmail'),
        };

        if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
          this.logger.warn('Firebase configuration is incomplete. Push notifications will be disabled.');
          return;
        }

        credential = admin.credential.cert({
          projectId: firebaseConfig.projectId,
          privateKey: firebaseConfig.privateKey,
          clientEmail: firebaseConfig.clientEmail,
        });
        this.logger.log('Firebase initialized with individual credentials');
      }

      this.firebaseApp = admin.initializeApp({
        credential,
      });

      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  async sendNotificationToUser(userId: string, payload: NotificationPayload) {
    try {
      const deviceTokens = await this.deviceTokenRepository.find({
        where: { user_id: userId },
      });

      if (deviceTokens.length === 0) {
        this.logger.warn(`No device tokens found for user ${userId}`);
        return { success: false, message: 'No device tokens found' };
      }

      const tokens = deviceTokens.map(dt => dt.token);
      const results = await this.sendMulticastNotification(tokens, payload);

      // Update last seen for successful tokens
      const successfulTokens = results.responses
        .map((response, index) => ({ response, token: tokens[index] }))
        .filter(({ response }) => response.success)
        .map(({ token }) => token);

      if (successfulTokens.length > 0) {
        for (const token of successfulTokens) {
          await this.deviceTokenRepository.update(
            { token },
            { last_seen: new Date() }
          );
        }
      }

      return {
        success: true,
        sent: results.successCount,
        failed: results.failureCount,
        results: results.responses,
      };
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendNotificationToEstate(estateId: string, payload: NotificationPayload) {
    try {
      // Get all users in the estate (you might need to add estate relationship)
      // For now, we'll get all active users
      const users = await this.userRepository.find({
        where: { status: UserStatus.ACTIVE },
      });

      const userIds = users.map(user => user.user_id);
      const results = [];

      for (const userId of userIds) {
        const result = await this.sendNotificationToUser(userId, payload);
        results.push({ userId, result });
      }

      return {
        success: true,
        total_users: userIds.length,
        results,
      };
    } catch (error) {
      this.logger.error(`Failed to send notification to estate ${estateId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendMulticastNotification(tokens: string[], payload: NotificationPayload) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot send notifications.');
      return {
        successCount: 0,
        failureCount: tokens.length,
        responses: tokens.map(() => ({ success: false, error: 'Firebase not initialized' })),
      };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        tokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      this.logger.error('Failed to send multicast notification:', error);
      return {
        successCount: 0,
        failureCount: tokens.length,
        responses: tokens.map(() => ({ success: false, error: error.message })),
      };
    }
  }

  async sendTopicNotification(topic: string, payload: NotificationPayload) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot send notifications.');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        topic,
      };

      const response = await admin.messaging().send(message);
      
      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      this.logger.error(`Failed to send topic notification to ${topic}:`, error);
      return { success: false, error: error.message };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot subscribe to topic.');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
      return { success: false, error: error.message };
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Cannot unsubscribe from topic.');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
      return { success: false, error: error.message };
    }
  }

  async getUserDeviceTokens(userId: string) {
    return await this.deviceTokenRepository.find({
      where: { user_id: userId },
      order: { last_seen: 'DESC' },
    });
  }

  async removeDeviceToken(userId: string, token: string) {
    await this.deviceTokenRepository.delete({ user_id: userId, token });
    return { message: 'Device token removed successfully' };
  }

  async cleanupInactiveTokens(daysInactive: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await this.deviceTokenRepository
      .createQueryBuilder()
      .delete()
      .where('last_seen < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} inactive device tokens`);
    return { removed: result.affected };
  }
}
