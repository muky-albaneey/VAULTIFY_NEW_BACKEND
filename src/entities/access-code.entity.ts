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

@Entity('access_codes')
@Index(['code'], { unique: true })
export class AccessCode {
  @PrimaryGeneratedColumn('uuid')
  code: string;

  @Column()
  creator_user_id: string;

  @Column()
  visitor_name: string;

  @Column({ nullable: true })
  visitor_email: string;

  @Column({ nullable: true })
  visitor_phone: string;

  @Column()
  valid_from: Date;

  @Column()
  valid_to: Date;

  @Column({ default: 1 })
  max_uses: number;

  @Column({ default: 0 })
  current_uses: number;

  @Column({ nullable: true })
  gate: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  notify_on_use: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.createdAccessCodes)
  @JoinColumn({ name: 'creator_user_id' })
  creator: User;
}
