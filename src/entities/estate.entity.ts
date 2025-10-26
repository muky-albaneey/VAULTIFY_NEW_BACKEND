import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LostFoundItem } from './lost-found-item.entity';
import { Provider } from './provider.entity';
import { UtilityAccount } from './utility-account.entity';
import { Conversation } from './conversation.entity';
import { Report } from './report.entity';

@Entity('estates')
export class Estate {
  @PrimaryGeneratedColumn('uuid')
  estate_id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => LostFoundItem, (item) => item.estate)
  lostFoundItems: LostFoundItem[];

  @OneToMany(() => Provider, (provider) => provider.estate)
  providers: Provider[];

  @OneToMany(() => UtilityAccount, (account) => account.estate)
  utilityAccounts: UtilityAccount[];

  @OneToMany(() => Conversation, (conversation) => conversation.estate)
  conversations: Conversation[];

  @OneToMany(() => Report, (report) => report.estate)
  reports: Report[];
}
