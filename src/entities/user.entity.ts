import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Wallet } from './wallet.entity';
import { Subscription } from './subscription.entity';
import { DeviceToken } from './device-token.entity';
import { Payment } from './payment.entity';
import { AccessCode } from './access-code.entity';
import { Alert } from './alert.entity';
import { UserDeletedAlert } from './user-deleted-alert.entity';
import { LostFoundItem } from './lost-found-item.entity';
import { BankServiceCharge } from './bank-service-charge.entity';
import { Provider } from './provider.entity';
import { UtilityAccount } from './utility-account.entity';
import { FamilyGroup } from './family-group.entity';
import { FamilyMember } from './family-member.entity';
import { Conversation } from './conversation.entity';
import { ConversationParticipant } from './conversation-participant.entity';
import { Report } from './report.entity';
import { Message } from './message.entity';
import { MessageReaction } from './message-reaction.entity';

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.user)
  deviceTokens: DeviceToken[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => AccessCode, (accessCode) => accessCode.creator)
  createdAccessCodes: AccessCode[];

  @OneToMany(() => Alert, (alert) => alert.sender)
  sentAlerts: Alert[];

  @OneToMany(() => UserDeletedAlert, (deletedAlert) => deletedAlert.user)
  deletedAlerts: UserDeletedAlert[];

  @OneToMany(() => LostFoundItem, (item) => item.sender)
  lostFoundItems: LostFoundItem[];

  @OneToMany(() => BankServiceCharge, (bsc) => bsc.user)
  bankServiceCharges: BankServiceCharge[];

  @OneToMany(() => Provider, (provider) => provider.admin)
  managedProviders: Provider[];

  @OneToMany(() => UtilityAccount, (account) => account.user)
  utilityAccounts: UtilityAccount[];

  @OneToMany(() => FamilyGroup, (group) => group.headUser)
  headedFamilyGroups: FamilyGroup[];

  @OneToMany(() => FamilyMember, (member) => member.user)
  familyMemberships: FamilyMember[];

  @OneToMany(() => FamilyMember, (member) => member.addedBy)
  addedFamilyMembers: FamilyMember[];

  @OneToMany(() => ConversationParticipant, (participant) => participant.user)
  conversationParticipants: ConversationParticipant[];

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.user)
  messageReactions: MessageReaction[];
}
