import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Plan } from './plan.entity';
import { Payment } from './payment.entity';

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PAUSED = 'paused',
  CANCELED = 'canceled',
}

@Entity('subscriptions')
@Index(['user_id', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  subscription_id: string;

  @Column()
  user_id: string;

  @Column()
  plan_id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  expired_date: Date;

  @Column({ nullable: true })
  last_renewal_payment_id: string;

  @Column({ nullable: true })
  granted_by_admin: string;

  @Column({ default: false })
  is_free_subscription: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.subscriptions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @ManyToOne(() => Payment, (payment) => payment.subscriptions)
  @JoinColumn({ name: 'last_renewal_payment_id' })
  lastRenewalPayment: Payment;
}
