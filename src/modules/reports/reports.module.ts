import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from '../../entities/report.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Estate])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
