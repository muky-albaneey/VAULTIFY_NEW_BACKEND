import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BankServiceChargeFile } from './bank-service-charge-file.entity';

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('bank_service_charges')
export class BankServiceCharge {
  @PrimaryGeneratedColumn('uuid')
  bsc_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  service_charge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  paid_charge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  outstanding_charge: number;

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
  })
  payment_frequency: PaymentFrequency;

  @Column()
  bank_name: string;

  @Column()
  account_name: string;

  @Column()
  account_number: string;

  @Column({ default: false })
  is_validated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  validated_at: Date;

  @Column({ nullable: true })
  validated_by: string;

  @Column({ type: 'text', nullable: true })
  validation_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.bankServiceCharges)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => BankServiceChargeFile, (file) => file.bankServiceCharge)
  files: BankServiceChargeFile[];
}
