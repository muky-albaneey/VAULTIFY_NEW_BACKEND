import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EstatesController } from './estates.controller';
import { EstatesService } from './estates.service';
import { Estate } from '../../entities/estate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Estate])],
  controllers: [EstatesController],
  providers: [EstatesService],
  exports: [EstatesService],
})
export class EstatesModule {}
