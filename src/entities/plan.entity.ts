import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { FamilyGroup } from './family-group.entity';

export enum PlanType {
  NORMAL = 'normal',
  FAMILY = 'family',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  plan_id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  type: PlanType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_ngn: number;

  @Column({
    type: 'enum',
    enum: BillingCycle,
  })
  billing_cycle: BillingCycle;

  @Column({ default: 1 })
  max_members: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @OneToMany(() => FamilyGroup, (group) => group.plan)
  familyGroups: FamilyGroup[];
}
