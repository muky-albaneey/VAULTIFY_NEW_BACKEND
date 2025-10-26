import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PaymentProvider } from './payment-provider.entity';
import { Subscription } from './subscription.entity';
import { UtilityPayment } from './utility-payment.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('payments')
@Index(['reference'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  payment_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Column()
  provider_id: string;

  @Column({ unique: true })
  reference: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  raw_payload: any;

  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PaymentProvider, (provider) => provider.payments)
  @JoinColumn({ name: 'provider_id' })
  provider: PaymentProvider;

  @OneToMany(() => Subscription, (subscription) => subscription.lastRenewalPayment)
  subscriptions: Subscription[];

  @OneToMany(() => UtilityPayment, (utilityPayment) => utilityPayment.payment)
  utilityPayments: UtilityPayment[];
}
