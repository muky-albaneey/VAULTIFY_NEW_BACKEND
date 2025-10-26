import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ResidentIdController } from './resident-id.controller';
import { ResidentIdService } from './resident-id.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Estate]),
    JwtModule,
  ],
  controllers: [ResidentIdController],
  providers: [ResidentIdService],
  exports: [ResidentIdService],
})
export class ResidentIdModule {}
