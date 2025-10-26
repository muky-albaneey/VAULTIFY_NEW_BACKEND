import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UtilityBill } from './utility-bill.entity';
import { Payment } from './payment.entity';

@Entity('utility_payments')
export class UtilityPayment {
  @PrimaryGeneratedColumn('uuid')
  utility_payment_id: string;

  @Column()
  utility_bill_id: string;

  @Column()
  payment_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  paid_at: Date;

  // Relationships
  @ManyToOne(() => UtilityBill, (bill) => bill.payments)
  @JoinColumn({ name: 'utility_bill_id' })
  utilityBill: UtilityBill;

  @ManyToOne(() => Payment, (payment) => payment.utilityPayments)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;
}
