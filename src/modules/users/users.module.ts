import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { DeviceToken } from '../../entities/device-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Estate, DeviceToken]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
