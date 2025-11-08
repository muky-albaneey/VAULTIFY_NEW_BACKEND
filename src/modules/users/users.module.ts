import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { DeviceToken } from '../../entities/device-token.entity';
import { BankServiceCharge } from '../../entities/bank-service-charge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Estate, DeviceToken, BankServiceCharge]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
