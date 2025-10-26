import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Estate } from './estate.entity';

export enum ReportCategory {
  MAINTENANCE = 'Maintenance',
  SECURITY = 'Security',
  NOISE_NUISANCE = 'Noise/Nuisance',
  WATER = 'Water',
  POWER = 'Power',
  CLEANING = 'Cleaning',
  PARKING = 'Parking',
  BILLING = 'Billing',
  OTHER = 'Other',
}

export enum ReportUrgency {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  EMERGENCY = 'Emergency',
}

export enum ReportStatus {
  OPEN = 'Open',
  ACKNOWLEDGED = 'Acknowledged',
  IN_PROGRESS = 'In Progress',
  WAITING_ON_RESIDENT = 'Waiting on Resident',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  REOPENED = 'Reopened',
}

export enum ContactPreference {
  IN_APP_ONLY = 'In-app only',
  PHONE = 'Phone',
  EMAIL = 'Email',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  report_id: string;

  @Column()
  user_id: string;

  @Column()
  estate_id: string;

  @Column({
    type: 'enum',
    enum: ReportCategory,
  })
  category: ReportCategory;

  @Column()
  subject: string;

  @Column()
  details: string;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: ReportUrgency,
    default: ReportUrgency.MEDIUM,
  })
  urgency: ReportUrgency;

  @Column({
    type: 'enum',
    enum: ContactPreference,
    default: ContactPreference.IN_APP_ONLY,
  })
  contact_preference: ContactPreference;

  @Column({ type: 'jsonb', nullable: true })
  attachments: any;

  @Column({ nullable: true })
  occurred_on: Date;

  @Column({ default: false })
  anonymize_report: boolean;

  @Column({ default: true })
  allow_sharing: boolean;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.OPEN,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ nullable: true })
  sla_target: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Estate, (estate) => estate.reports)
  @JoinColumn({ name: 'estate_id' })
  estate: Estate;
}
