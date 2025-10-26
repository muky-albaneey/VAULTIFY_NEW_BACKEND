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

export enum Platform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Entity('device_tokens')
@Index(['user_id', 'platform'])
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  device_token_id: string;

  @Column()
  user_id: string;

  @Column()
  token: string;

  @Column({
    type: 'enum',
    enum: Platform,
  })
  platform: Platform;

  @Column({ nullable: true })
  device_id: string;

  @Column({ nullable: true })
  last_seen: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.deviceTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
