import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BankServiceChargeController } from './bank-service-charges.controller';
import { BankServiceChargeService } from './bank-service-charges.service';
import { BankServiceCharge } from '../../entities/bank-service-charge.entity';
import { BankServiceChargeFile } from '../../entities/bank-service-charge-file.entity';
import { User } from '../../entities/user.entity';
import { S3UploadModule } from '../../common/services/s3-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankServiceCharge,
      BankServiceChargeFile,
      User,
    ]),
    S3UploadModule,
  ],
  controllers: [BankServiceChargeController],
  providers: [BankServiceChargeService],
  exports: [BankServiceChargeService],
})
export class BankServiceChargeModule {}
