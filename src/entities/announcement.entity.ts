import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Estate } from './estate.entity';

export enum AnnouncementType {
  GENERAL = 'general',
  PAYMENT_REMINDER = 'payment_reminder',
  MAINTENANCE = 'maintenance',
  EVENT = 'event',
  SECURITY = 'security',
  URGENT = 'urgent',
}

export enum RecipientType {
  ALL_RESIDENTS = 'all_residents',
  SECURITY_PERSONNEL = 'security_personnel',
  SINGLE_USER = 'single_user',
  SPECIFIC_RESIDENTS = 'specific_residents',
}

@Entity('announcements')
@Index(['estate_id', 'created_at'])
@Index(['sender_user_id'])
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  announcement_id: string;

  @Column()
  sender_user_id: string;

  @Column()
  estate_id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: AnnouncementType,
    default: AnnouncementType.GENERAL,
  })
  announcement_type: AnnouncementType;

  @Column({
    type: 'enum',
    enum: RecipientType,
  })
  recipient_type: RecipientType;

  @Column({ type: 'jsonb', nullable: true })
  target_user_ids: string[]; // For SINGLE_USER or SPECIFIC_RESIDENTS

  @Column({ type: 'jsonb', nullable: true })
  payment_details: {
    amount?: number;
    due_date?: string;
    description?: string;
    utility_account_id?: string;
  }; // For payment reminders

  @Column({ type: 'jsonb', nullable: true })
  image_urls: string[]; // Optional array of image URLs

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.sentAlerts)
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;

  @ManyToOne(() => Estate)
  @JoinColumn({ name: 'estate_id' })
  estate: Estate;
}

