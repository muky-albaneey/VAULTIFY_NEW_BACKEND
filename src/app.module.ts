import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { AppConfig } from './config/app.config';

// Common Services
import { EmailModule } from './common/services/email.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EstatesModule } from './modules/estates/estates.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AccessCodesModule } from './modules/access-codes/access-codes.module';
import { LostFoundModule } from './modules/lost-found/lost-found.module';
import { ServiceDirectoryModule } from './modules/service-directory/service-directory.module';
import { UtilityBillsModule } from './modules/utility-bills/utility-bills.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ResidentIdModule } from './modules/resident-id/resident-id.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BankServiceChargeModule } from './modules/bank-service-charges/bank-service-charges.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [DatabaseConfig, AppConfig],
        ignoreEnvFile: process.env.NODE_ENV === 'production', // <- add this
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      useFactory: (configService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Common Services
    EmailModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    EstatesModule,
    WalletsModule,
    SubscriptionsModule,
    AccessCodesModule,
    LostFoundModule,
    ServiceDirectoryModule,
    UtilityBillsModule,
    MessagingModule,
    ResidentIdModule,
    ReportsModule,
    NotificationsModule,
    PaymentsModule,
    BankServiceChargeModule,
    AlertsModule,
    AnnouncementsModule,
  ],
})
export class AppModule {}
