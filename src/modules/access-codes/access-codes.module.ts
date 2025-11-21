import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessCodesController } from './access-codes.controller';
import { AccessCodesService } from './access-codes.service';
import { AccessCode } from '../../entities/access-code.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccessCode, User, UserProfile, Estate])],
  controllers: [AccessCodesController],
  providers: [AccessCodesService],
  exports: [AccessCodesService],
})
export class AccessCodesModule {}
