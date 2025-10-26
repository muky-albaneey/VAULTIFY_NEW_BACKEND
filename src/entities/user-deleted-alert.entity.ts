import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Alert } from './alert.entity';

@Entity('user_deleted_alerts')
@Index(['user_id', 'alert_id'], { unique: true })
export class UserDeletedAlert {
  @PrimaryGeneratedColumn('uuid')
  deleted_alert_id: string;

  @Column()
  user_id: string;

  @Column()
  alert_id: string;

  @CreateDateColumn()
  deleted_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.deletedAlerts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Alert, (alert) => alert.deletedByUsers)
  @JoinColumn({ name: 'alert_id' })
  alert: Alert;
}
