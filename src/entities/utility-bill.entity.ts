import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UtilityAccount } from './utility-account.entity';
import { UtilityPayment } from './utility-payment.entity';

export enum BillStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('utility_bills')
export class UtilityBill {
  @PrimaryGeneratedColumn('uuid')
  utility_bill_id: string;

  @Column()
  utility_account_id: string;

  @Column()
  billing_period_start: Date;

  @Column()
  billing_period_end: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount_due: number;

  @Column()
  due_date: Date;

  @Column({
    type: 'enum',
    enum: BillStatus,
    default: BillStatus.UNPAID,
  })
  status: BillStatus;

  @Column()
  generated_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  // Relationships
  @ManyToOne(() => UtilityAccount, (account) => account.bills)
  @JoinColumn({ name: 'utility_account_id' })
  utilityAccount: UtilityAccount;

  @OneToMany(() => UtilityPayment, (payment) => payment.utilityBill)
  payments: UtilityPayment[];
}
