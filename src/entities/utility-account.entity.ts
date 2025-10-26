import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Estate } from './estate.entity';
import { UtilityProvider } from './utility-provider.entity';
import { UtilityBill } from './utility-bill.entity';

@Entity('utility_accounts')
export class UtilityAccount {
  @PrimaryGeneratedColumn('uuid')
  utility_account_id: string;

  @Column()
  user_id: string;

  @Column()
  estate_id: string;

  @Column()
  utility_provider_id: string;

  @Column()
  account_number: string;

  @Column()
  address: string;

  @Column({ default: false })
  is_default: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.utilityAccounts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Estate, (estate) => estate.utilityAccounts)
  @JoinColumn({ name: 'estate_id' })
  estate: Estate;

  @ManyToOne(() => UtilityProvider, (provider) => provider.accounts)
  @JoinColumn({ name: 'utility_provider_id' })
  utilityProvider: UtilityProvider;

  @OneToMany(() => UtilityBill, (bill) => bill.utilityAccount)
  bills: UtilityBill[];
}
