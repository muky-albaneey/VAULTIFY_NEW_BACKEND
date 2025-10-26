import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LostFoundController } from './lost-found.controller';
import { LostFoundService } from './lost-found.service';
import { LostFoundItem } from '../../entities/lost-found-item.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LostFoundItem, User, Estate])],
  controllers: [LostFoundController],
  providers: [LostFoundService],
  exports: [LostFoundService],
})
export class LostFoundModule {}
