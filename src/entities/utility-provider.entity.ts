import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UtilityAccount } from './utility-account.entity';

export enum UtilityCategory {
  POWER = 'power',
  WATER = 'water',
  WASTE = 'waste',
  GAS = 'gas',
  INTERNET = 'internet',
}

@Entity('utility_providers')
export class UtilityProvider {
  @PrimaryGeneratedColumn('uuid')
  utility_provider_id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UtilityCategory,
  })
  category: UtilityCategory;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => UtilityAccount, (account) => account.utilityProvider)
  accounts: UtilityAccount[];
}
