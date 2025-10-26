import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BankServiceCharge } from './bank-service-charge.entity';

@Entity('bank_service_charge_files')
export class BankServiceChargeFile {
  @PrimaryGeneratedColumn('uuid')
  bsc_file_id: string;

  @Column()
  bsc_id: string;

  @Column()
  file_url: string;

  @CreateDateColumn()
  uploaded_at: Date;

  // Relationships
  @ManyToOne(() => BankServiceCharge, (bsc) => bsc.files)
  @JoinColumn({ name: 'bsc_id' })
  bankServiceCharge: BankServiceCharge;
}
