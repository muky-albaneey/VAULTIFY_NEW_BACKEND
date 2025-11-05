import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { LostFoundItem } from './lost-found-item.entity';
import { Provider } from './provider.entity';
import { UtilityAccount } from './utility-account.entity';
import { Conversation } from './conversation.entity';
import { Report } from './report.entity';

export enum UserRole {
  RESIDENCE = 'Residence',
  SECURITY_PERSONNEL = 'Security Personnel',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'Super Admin',
}

export enum ApartmentType {
  STUDIO = 'Studio',
  ONE_BEDROOM = '1-Bedroom',
  TWO_BEDROOM = '2-Bedroom',
  THREE_BEDROOM = '3-Bedroom',
  FOUR_BEDROOM = '4-Bedroom',
  PENTHOUSE = 'Penthouse',
  DUPLEX = 'Duplex',
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.RESIDENCE,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: ApartmentType,
    nullable: true,
  })
  apartment_type: ApartmentType;

  @Column({ nullable: true })
  house_address: string;

  @Column({ nullable: true })
  plan: string;

  @Column({ nullable: true })
  subscription_start_date: Date;

  @Column({ nullable: true })
  subscription_expiry_date: Date;

  @Column({ nullable: true })
  profile_picture_url: string;

  @Column({ nullable: true })
  last_transaction_reference: string;

  @Column({ nullable: true })
  estate_id: string;

  // Relationships
  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => LostFoundItem, (item) => item.sender)
  lostFoundItems: LostFoundItem[];

  @OneToMany(() => Provider, (provider) => provider.admin)
  managedProviders: Provider[];

  @OneToMany(() => UtilityAccount, (account) => account.user)
  utilityAccounts: UtilityAccount[];

  @OneToMany(() => Conversation, (conversation) => conversation.createdBy)
  createdConversations: Conversation[];

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];
}
