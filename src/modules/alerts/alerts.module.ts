import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert } from '../../entities/alert.entity';
import { UserDeletedAlert } from '../../entities/user-deleted-alert.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alert,
      UserDeletedAlert,
      User,
      UserProfile,
      Estate,
    ]),
    NotificationsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
