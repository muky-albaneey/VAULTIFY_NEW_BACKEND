import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServiceDirectoryController } from './service-directory.controller';
import { ServiceDirectoryService } from './service-directory.service';
import { Service } from '../../entities/service.entity';
import { Provider } from '../../entities/provider.entity';
import { ProviderPhoto } from '../../entities/provider-photo.entity';
import { ProviderReview } from '../../entities/provider-review.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      Provider,
      ProviderPhoto,
      ProviderReview,
      User,
      Estate,
    ]),
  ],
  controllers: [ServiceDirectoryController],
  providers: [ServiceDirectoryService],
  exports: [ServiceDirectoryService],
})
export class ServiceDirectoryModule {}
