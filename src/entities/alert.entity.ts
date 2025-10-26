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
import { UserDeletedAlert } from './user-deleted-alert.entity';

export enum AlertType {
  GENERAL = 'general',
  EMERGENCY = 'emergency',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  UTILITY = 'utility',
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  alert_id: string;

  @Column()
  sender_user_id: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: AlertType,
    default: AlertType.GENERAL,
  })
  alert_type: AlertType;

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.MEDIUM,
  })
  urgency_level: UrgencyLevel;

  @Column({ type: 'jsonb' })
  recipients: any;

  @Column()
  timestamp: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.sentAlerts)
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;

  @OneToMany(() => UserDeletedAlert, (deletedAlert) => deletedAlert.alert)
  deletedByUsers: UserDeletedAlert[];
}
