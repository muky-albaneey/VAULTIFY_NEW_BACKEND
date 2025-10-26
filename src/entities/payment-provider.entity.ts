import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('payment_providers')
export class PaymentProvider {
  @PrimaryGeneratedColumn('uuid')
  provider_id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  // Relationships
  @OneToMany(() => Payment, (payment) => payment.provider)
  payments: Payment[];
}
